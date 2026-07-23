const Token = require("../models/Token");
const asyncHandler = require("../utils/asyncHandler");
const httpError = require("../utils/httpError");
const { TOKEN_STATUS } = require("../utils/constants");
const { calculateAverageServiceSeconds, estimatedWaitSeconds } = require("../utils/queueMath");

const getPublicTrackStatus = asyncHandler(async (req, res) => {
  const { queueId, tokenId } = req.params;

  const token = await Token.findOne({ _id: tokenId, queueId })
    .select("_id queueId tokenNumber status position createdAt servedAt completedAt updatedAt")
    .lean();

  if (!token) {
    throw httpError(404, "Token not found");
  }

  const queueTokens = await Token.find({ queueId })
    .select("_id status position createdAt servedAt completedAt")
    .lean();

  const waitingTokens = queueTokens.filter((item) => item.status === TOKEN_STATUS.WAITING);
  const avgServiceSeconds = calculateAverageServiceSeconds(queueTokens);

  let positionInQueue = null;
  let waitSeconds = 0;

  if (token.status === TOKEN_STATUS.WAITING) {
    positionInQueue = token.position;
    waitSeconds = estimatedWaitSeconds(token, waitingTokens, avgServiceSeconds);
  } else if (token.status === TOKEN_STATUS.SERVING) {
    positionInQueue = 0;
  }

  res.json({
    tracking: {
      queueId: token.queueId.toString(),
      tokenId: token._id.toString(),
      tokenNumber: token.tokenNumber,
      status: token.status,
      positionInQueue,
      estimatedWaitSeconds: waitSeconds,
      lastUpdatedAt: token.updatedAt,
    },
  });
});

module.exports = {
  getPublicTrackStatus,
};
