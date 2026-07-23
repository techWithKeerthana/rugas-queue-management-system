const Token = require("../models/Token");
const asyncHandler = require("../utils/asyncHandler");
const httpError = require("../utils/httpError");
const { nextTokenNumber } = require("../utils/tokenNumber");
const { TOKEN_STATUS, TOKEN_PRIORITY, PRIORITY_WEIGHT } = require("../utils/constants");
const { getOwnedQueue } = require("./queueController");
const { safeEmitToQueue } = require("../config/socket");
const { calculateAverageServiceSeconds, estimatedWaitSeconds } = require("../utils/queueMath");

async function renumberWaitingPositions(queueId) {
  const waiting = await Token.find({ queueId, status: TOKEN_STATUS.WAITING }).sort({ position: 1, createdAt: 1 });
  for (let i = 0; i < waiting.length; i += 1) {
    waiting[i].position = i + 1;
    await waiting[i].save();
  }
}

function insertPositionForPriority(waitingTokens, priorityWeight) {
  let insertAt = waitingTokens.length;
  for (let i = 0; i < waitingTokens.length; i += 1) {
    if (priorityWeight > waitingTokens[i].priorityWeight) {
      insertAt = i;
      break;
    }
  }
  return insertAt;
}

async function buildTokenResponse(queueId) {
  const tokens = await Token.find({ queueId }).sort({ position: 1, createdAt: 1 }).lean();
  const waiting = tokens.filter((t) => t.status === TOKEN_STATUS.WAITING);
  const avgServiceSeconds = calculateAverageServiceSeconds(tokens);

  const withEstimates = tokens.map((token) => ({
    ...token,
    estimatedWaitSeconds:
      token.status === TOKEN_STATUS.WAITING
        ? estimatedWaitSeconds(token, waiting, avgServiceSeconds)
        : 0,
  }));

  return {
    tokens: withEstimates,
    avgServiceSeconds,
  };
}

const listTokens = asyncHandler(async (req, res) => {
  const queue = await getOwnedQueue(req.params.queueId, req.user.id);
  const payload = await buildTokenResponse(queue._id);
  res.json(payload);
});

const addToken = asyncHandler(async (req, res) => {
  const queue = await getOwnedQueue(req.params.queueId, req.user.id);
  const priority = req.body.priority || TOKEN_PRIORITY.NORMAL;
  const priorityWeight = PRIORITY_WEIGHT[priority];

  const waitingTokens = await Token.find({ queueId: queue._id, status: TOKEN_STATUS.WAITING })
    .sort({ position: 1, createdAt: 1 })
    .lean();

  const tokenNumber = await nextTokenNumber(queue._id);
  const insertAt = insertPositionForPriority(waitingTokens, priorityWeight);

  await Token.updateMany(
    {
      queueId: queue._id,
      status: TOKEN_STATUS.WAITING,
      position: { $gte: insertAt + 1 },
    },
    { $inc: { position: 1 } }
  );

  const token = await Token.create({
    queueId: queue._id,
    managerId: req.user.id,
    tokenNumber,
    personName: req.body.personName.trim(),
    priority,
    priorityWeight,
    position: insertAt + 1,
    status: TOKEN_STATUS.WAITING,
  });

  safeEmitToQueue(queue._id.toString(), "token:added", { queueId: queue._id.toString(), tokenId: token._id.toString() });

  const payload = await buildTokenResponse(queue._id);
  res.status(201).json(payload);
});

const reorderTokens = asyncHandler(async (req, res) => {
  const queue = await getOwnedQueue(req.params.queueId, req.user.id);
  const { orderedTokenIds } = req.body;

  const waitingTokens = await Token.find({ queueId: queue._id, status: TOKEN_STATUS.WAITING });
  if (waitingTokens.length !== orderedTokenIds.length) {
    throw httpError(400, "orderedTokenIds must include all waiting tokens exactly once");
  }

  const waitingMap = new Map(waitingTokens.map((token) => [token._id.toString(), token]));
  if (new Set(orderedTokenIds).size !== orderedTokenIds.length) {
    throw httpError(400, "orderedTokenIds contains duplicates");
  }

  for (const id of orderedTokenIds) {
    if (!waitingMap.has(id)) {
      throw httpError(400, "orderedTokenIds contains invalid token id");
    }
  }

  for (const waitingToken of waitingTokens) {
    if (!orderedTokenIds.includes(waitingToken._id.toString())) {
      throw httpError(400, "orderedTokenIds must include every waiting token");
    }
  }

  for (let i = 0; i < orderedTokenIds.length; i += 1) {
    const token = waitingMap.get(orderedTokenIds[i]);
    token.position = i + 1;
    await token.save();
  }

  safeEmitToQueue(queue._id.toString(), "token:reordered", { queueId: queue._id.toString() });

  const payload = await buildTokenResponse(queue._id);
  res.json(payload);
});

const serveTopToken = asyncHandler(async (req, res) => {
  const queue = await getOwnedQueue(req.params.queueId, req.user.id);

  const activeServing = await Token.findOne({ queueId: queue._id, status: TOKEN_STATUS.SERVING });
  if (activeServing) {
    throw httpError(409, "A token is already being served");
  }

  const top = await Token.findOne({ queueId: queue._id, status: TOKEN_STATUS.WAITING }).sort({ position: 1, createdAt: 1 });
  if (!top) {
    throw httpError(400, "No waiting token to serve");
  }

  top.actionSnapshot = {
    type: "serve",
    previousStatus: top.status,
    previousPosition: top.position,
    previousServedAt: top.servedAt,
    previousCompletedAt: top.completedAt,
    previousCancelledAt: top.cancelledAt,
    actedAt: new Date(),
  };
  top.status = TOKEN_STATUS.SERVING;
  top.servedAt = new Date();
  await top.save();

  await renumberWaitingPositions(queue._id);
  safeEmitToQueue(queue._id.toString(), "token:served", { queueId: queue._id.toString(), tokenId: top._id.toString() });
  safeEmitToQueue(queue._id.toString(), "token:statusChanged", { action: "serve", queueId: queue._id.toString(), tokenId: top._id.toString() });

  const payload = await buildTokenResponse(queue._id);
  res.json(payload);
});

const completeToken = asyncHandler(async (req, res) => {
  const queue = await getOwnedQueue(req.params.queueId, req.user.id);
  const token = await Token.findOne({ _id: req.params.tokenId, queueId: queue._id });
  if (!token) {
    throw httpError(404, "Token not found");
  }
  if (token.status !== TOKEN_STATUS.SERVING) {
    throw httpError(400, "Only serving token can be completed");
  }

  token.actionSnapshot = {
    type: "complete",
    previousStatus: token.status,
    previousPosition: token.position,
    previousServedAt: token.servedAt,
    previousCompletedAt: token.completedAt,
    previousCancelledAt: token.cancelledAt,
    actedAt: new Date(),
  };
  token.status = TOKEN_STATUS.COMPLETED;
  token.completedAt = new Date();
  await token.save();

  safeEmitToQueue(queue._id.toString(), "token:statusChanged", { action: "complete", queueId: queue._id.toString(), tokenId: token._id.toString() });

  const payload = await buildTokenResponse(queue._id);
  res.json(payload);
});

const cancelToken = asyncHandler(async (req, res) => {
  const queue = await getOwnedQueue(req.params.queueId, req.user.id);
  const token = await Token.findOne({ _id: req.params.tokenId, queueId: queue._id });
  if (!token) {
    throw httpError(404, "Token not found");
  }
  if (token.status === TOKEN_STATUS.COMPLETED || token.status === TOKEN_STATUS.CANCELLED) {
    throw httpError(400, "Only waiting or serving token can be cancelled");
  }

  token.actionSnapshot = {
    type: "cancel",
    previousStatus: token.status,
    previousPosition: token.position,
    previousServedAt: token.servedAt,
    previousCompletedAt: token.completedAt,
    previousCancelledAt: token.cancelledAt,
    actedAt: new Date(),
  };
  token.status = TOKEN_STATUS.CANCELLED;
  token.cancelledAt = new Date();
  await token.save();

  if (token.actionSnapshot.previousStatus === TOKEN_STATUS.WAITING) {
    await renumberWaitingPositions(queue._id);
  }

  safeEmitToQueue(queue._id.toString(), "token:cancelled", { queueId: queue._id.toString(), tokenId: token._id.toString() });
  safeEmitToQueue(queue._id.toString(), "token:statusChanged", { action: "cancel", queueId: queue._id.toString(), tokenId: token._id.toString() });

  const payload = await buildTokenResponse(queue._id);
  res.json(payload);
});

const undoTokenAction = asyncHandler(async (req, res) => {
  const queue = await getOwnedQueue(req.params.queueId, req.user.id);
  const token = await Token.findOne({ _id: req.params.tokenId, queueId: queue._id });
  if (!token) {
    throw httpError(404, "Token not found");
  }

  if (!token.actionSnapshot || !token.actionSnapshot.type) {
    throw httpError(400, "No action available to undo");
  }

  const snapshot = token.actionSnapshot;
  token.status = snapshot.previousStatus;
  token.position = snapshot.previousPosition;
  token.servedAt = snapshot.previousServedAt || null;
  token.completedAt = snapshot.previousCompletedAt || null;
  token.cancelledAt = snapshot.previousCancelledAt || null;
  token.actionSnapshot = null;
  await token.save();

  await renumberWaitingPositions(queue._id);
  safeEmitToQueue(queue._id.toString(), "token:undone", { queueId: queue._id.toString(), tokenId: token._id.toString() });

  const payload = await buildTokenResponse(queue._id);
  res.json(payload);
});

module.exports = {
  listTokens,
  addToken,
  reorderTokens,
  serveTopToken,
  completeToken,
  cancelToken,
  undoTokenAction,
};
