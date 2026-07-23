const Token = require("../models/Token");
const httpError = require("../utils/httpError");
const { nextTokenNumber } = require("../utils/tokenNumber");
const { TOKEN_STATUS, TOKEN_PRIORITY, PRIORITY_WEIGHT } = require("../utils/constants");

function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
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

async function createTokenInQueue({ queue, managerId, personName, priority = TOKEN_PRIORITY.NORMAL }) {
  const trimmedName = personName.trim();
  if (!trimmedName) {
    throw httpError(400, "personName is required");
  }

  const resolvedPriority = priority || TOKEN_PRIORITY.NORMAL;
  const priorityWeight = PRIORITY_WEIGHT[resolvedPriority];

  if (typeof priorityWeight !== "number") {
    throw httpError(400, "Invalid token priority");
  }

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
    personName: { $regex: new RegExp(`^${escapeRegex(trimmedName)}$`, "i") },
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
    managerId,
    tokenNumber,
    personName: trimmedName,
    priority: resolvedPriority,
    priorityWeight,
    position: insertAt + 1,
    status: TOKEN_STATUS.WAITING,
  });

  return { token };
}

module.exports = {
  createTokenInQueue,
};