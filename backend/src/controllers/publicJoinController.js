const Queue = require("../models/Queue");
const asyncHandler = require("../utils/asyncHandler");
const httpError = require("../utils/httpError");
const { TOKEN_PRIORITY } = require("../utils/constants");
const { safeEmitToQueue, safeEmitPublicTrackInvalidation } = require("../config/socket");
const { createTokenInQueue } = require("../services/tokenCreationService");

const joinQueue = asyncHandler(async (req, res) => {
  const queue = await Queue.findById(req.params.queueId).lean();
  if (!queue) {
    throw httpError(404, "Queue not found");
  }

  if (queue.isArchived) {
    throw httpError(409, "Queue is archived and cannot be joined");
  }

  const { token } = await createTokenInQueue({
    queue,
    managerId: queue.managerId,
    personName: req.body.personName,
    priority: TOKEN_PRIORITY.NORMAL,
  });

  safeEmitToQueue(queue._id.toString(), "token:added", { queueId: queue._id.toString(), tokenId: token._id.toString() });
  safeEmitPublicTrackInvalidation(queue._id.toString());

  res.status(201).json({
    queueId: queue._id.toString(),
    tokenId: token._id.toString(),
    tokenNumber: token.tokenNumber,
    status: token.status,
    trackUrl: `/track/${queue._id.toString()}/${token._id.toString()}`,
  });
});

module.exports = {
  joinQueue,
};
