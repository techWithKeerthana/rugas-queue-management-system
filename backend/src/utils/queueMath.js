const dayjs = require("dayjs");
const { TOKEN_STATUS } = require("./constants");

function secondsDiff(start, end) {
  return Math.max(0, dayjs(end).diff(dayjs(start), "second"));
}

function average(nums) {
  if (!nums.length) {
    return 0;
  }
  return Math.round(nums.reduce((acc, cur) => acc + cur, 0) / nums.length);
}

function calculateAverageWaitSeconds(tokens) {
  const values = tokens
    .filter((t) => t.servedAt)
    .map((t) => secondsDiff(t.createdAt, t.servedAt));
  return average(values);
}

function calculateAverageServiceSeconds(tokens) {
  const values = tokens
    .filter((t) => t.servedAt && t.completedAt)
    .map((t) => secondsDiff(t.servedAt, t.completedAt));
  return average(values);
}

function getLongestWaitingToken(tokens) {
  const waiting = tokens.filter((t) => t.status === TOKEN_STATUS.WAITING);
  if (!waiting.length) {
    return null;
  }

  const sorted = waiting.sort((a, b) => a.createdAt - b.createdAt);
  const token = sorted[0];

  return {
    tokenId: token._id.toString(),
    tokenNumber: token.tokenNumber,
    personName: token.personName,
    waitingSeconds: secondsDiff(token.createdAt, new Date()),
  };
}

function estimatedWaitSeconds(token, waitingTokens, avgServiceSeconds) {
  const sorted = [...waitingTokens].sort((a, b) => a.position - b.position);
  const idx = sorted.findIndex((t) => t._id.toString() === token._id.toString());
  if (idx < 0) {
    return 0;
  }

  const averagePerToken = avgServiceSeconds || 180;
  return idx * averagePerToken;
}

function createHourlyTraffic(tokens) {
  const buckets = Array(24).fill(0);
  tokens.forEach((token) => {
    const hour = dayjs(token.createdAt).hour();
    buckets[hour] += 1;
  });

  return buckets.map((count, hour) => ({ hour, count }));
}

function createStatusDistribution(tokens) {
  const status = {
    waiting: 0,
    serving: 0,
    completed: 0,
    cancelled: 0,
  };

  tokens.forEach((token) => {
    status[token.status] += 1;
  });

  return Object.entries(status).map(([name, value]) => ({ name, value }));
}

function createQueueTrend(tokens, hours = 12) {
  const now = dayjs();
  const points = [];

  for (let i = hours - 1; i >= 0; i -= 1) {
    const start = now.subtract(i, "hour").startOf("hour");
    const end = start.endOf("hour");

    const created = tokens.filter(
      (token) => dayjs(token.createdAt).isAfter(start) && dayjs(token.createdAt).isBefore(end)
    ).length;

    const removed = tokens.filter((token) => {
      const terminalAt = token.completedAt || token.cancelledAt;
      return terminalAt && dayjs(terminalAt).isAfter(start) && dayjs(terminalAt).isBefore(end);
    }).length;

    const waitingAtEnd = tokens.filter((token) => {
      const createdAt = dayjs(token.createdAt);
      if (createdAt.isAfter(end)) {
        return false;
      }

      const terminalAt = token.completedAt || token.cancelledAt;
      if (!terminalAt) {
        return token.status === TOKEN_STATUS.WAITING || token.status === TOKEN_STATUS.SERVING;
      }
      return dayjs(terminalAt).isAfter(end);
    }).length;

    points.push({
      label: start.format("HH:00"),
      created,
      removed,
      queueLength: waitingAtEnd,
    });
  }

  return points;
}

module.exports = {
  calculateAverageWaitSeconds,
  calculateAverageServiceSeconds,
  getLongestWaitingToken,
  estimatedWaitSeconds,
  createHourlyTraffic,
  createStatusDistribution,
  createQueueTrend,
};
