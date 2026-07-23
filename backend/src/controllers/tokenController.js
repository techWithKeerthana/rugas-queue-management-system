const Token = require("../models/Token");
const asyncHandler = require("../utils/asyncHandler");
const httpError = require("../utils/httpError");
const { nextTokenNumber } = require("../utils/tokenNumber");
const { TOKEN_STATUS, TOKEN_PRIORITY, PRIORITY_WEIGHT } = require("../utils/constants");
const { getOwnedQueue } = require("./queueController");
const { safeEmitToQueue } = require("../config/socket");
const { calculateAverageServiceSeconds, estimatedWaitSeconds } = require("../utils/queueMath");

function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

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

async function buildTokenResponse(queueId, options = {}) {
  const { search = "", page = null, pageSize = null } = options;
  const tokens = await Token.find({ queueId }).sort({ position: 1, createdAt: 1 }).lean();
  let filtered = tokens;

  if (search) {
    const raw = search.trim();
    const regex = new RegExp(escapeRegex(raw), "i");
    const isNumeric = /^\d+$/.test(raw);
    filtered = tokens.filter((token) => {
      if (regex.test(token.personName)) {
        return true;
      }
      if (isNumeric && token.tokenNumber === Number(raw)) {
        return true;
      }
      return token._id.toString() === raw;
    });
  }

  const waiting = tokens.filter((t) => t.status === TOKEN_STATUS.WAITING);
  const avgServiceSeconds = calculateAverageServiceSeconds(tokens);

  const withEstimates = filtered.map((token) => ({
    ...token,
    estimatedWaitSeconds:
      token.status === TOKEN_STATUS.WAITING
        ? estimatedWaitSeconds(token, waiting, avgServiceSeconds)
        : 0,
  }));

  const total = withEstimates.length;
  const shouldPaginate = page && pageSize;
  const safePage = shouldPaginate ? Math.max(1, Number(page)) : 1;
  const safeSize = shouldPaginate ? Math.max(1, Number(pageSize)) : withEstimates.length || 1;
  const start = shouldPaginate ? (safePage - 1) * safeSize : 0;
  const pagedTokens = shouldPaginate ? withEstimates.slice(start, start + safeSize) : withEstimates;

  return {
    tokens: pagedTokens,
    avgServiceSeconds,
    pagination: {
      page: safePage,
      pageSize: safeSize,
      total,
      totalPages: Math.max(1, Math.ceil(total / safeSize)),
      hasNextPage: safePage * safeSize < total,
      hasPreviousPage: safePage > 1,
    },
    search: search || null,
  };
}

const listTokens = asyncHandler(async (req, res) => {
  const queue = await getOwnedQueue(req.params.queueId, req.user.id);
  const payload = await buildTokenResponse(queue._id, {
    search: req.query.search,
    page: req.query.page,
    pageSize: req.query.pageSize,
  });
  res.json(payload);
});

const addToken = asyncHandler(async (req, res) => {
  const queue = await getOwnedQueue(req.params.queueId, req.user.id);
  const priority = req.body.priority || TOKEN_PRIORITY.NORMAL;
  const priorityWeight = PRIORITY_WEIGHT[priority];
  const personName = req.body.personName.trim();

  if (queue.capacity) {
    const activeCount = await Token.countDocuments({
      queueId: queue._id,
      status: { $in: [TOKEN_STATUS.WAITING, TOKEN_STATUS.SERVING] },
    });

    if (activeCount >= queue.capacity) {
      throw httpError(409, `Queue capacity reached (${queue.capacity})`);
    }
  }

  const existingActive = await Token.findOne({
    queueId: queue._id,
    status: { $in: [TOKEN_STATUS.WAITING, TOKEN_STATUS.SERVING] },
    personName: { $regex: new RegExp(`^${escapeRegex(personName)}$`, "i") },
  }).lean();

  if (existingActive) {
    throw httpError(409, "A token with this person name is already active in the queue");
  }

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
    personName,
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
