const Token = require("../models/Token");
const asyncHandler = require("../utils/asyncHandler");
const {
  calculateAverageWaitSeconds,
  calculateAverageServiceSeconds,
  getLongestWaitingToken,
  createQueueTrend,
  createStatusDistribution,
  createHourlyTraffic,
} = require("../utils/queueMath");
const { getOwnedQueue } = require("./queueController");

const getAnalyticsSummary = asyncHandler(async (req, res) => {
  const queue = await getOwnedQueue(req.params.queueId, req.user.id);
  const tokens = await Token.find({ queueId: queue._id }).lean();

  const counts = {
    total: tokens.length,
    waiting: tokens.filter((t) => t.status === "waiting").length,
    serving: tokens.filter((t) => t.status === "serving").length,
    completed: tokens.filter((t) => t.status === "completed").length,
    cancelled: tokens.filter((t) => t.status === "cancelled").length,
  };

  const summary = {
    ...counts,
    avgWaitTimeSec: calculateAverageWaitSeconds(tokens),
    avgServiceTimeSec: calculateAverageServiceSeconds(tokens),
    longestWaitingToken: getLongestWaitingToken(tokens),
  };

  res.json({ summary });
});

const getQueueTrend = asyncHandler(async (req, res) => {
  const queue = await getOwnedQueue(req.params.queueId, req.user.id);
  const tokens = await Token.find({ queueId: queue._id }).lean();
  res.json({ trend: createQueueTrend(tokens, 12) });
});

const getStatusDistribution = asyncHandler(async (req, res) => {
  const queue = await getOwnedQueue(req.params.queueId, req.user.id);
  const tokens = await Token.find({ queueId: queue._id }).lean();
  res.json({ statusDistribution: createStatusDistribution(tokens) });
});

const getHourlyTraffic = asyncHandler(async (req, res) => {
  const queue = await getOwnedQueue(req.params.queueId, req.user.id);
  const tokens = await Token.find({ queueId: queue._id }).lean();
  const hourlyTraffic = createHourlyTraffic(tokens);
  const peak = hourlyTraffic.reduce((acc, cur) => (cur.count > acc.count ? cur : acc), { hour: 0, count: 0 });

  res.json({ hourlyTraffic, peakHour: peak.hour, peakCount: peak.count });
});

module.exports = {
  getAnalyticsSummary,
  getQueueTrend,
  getStatusDistribution,
  getHourlyTraffic,
};
