const Token = require("../models/Token");
const asyncHandler = require("../utils/asyncHandler");
const dayjs = require("dayjs");
const PDFDocument = require("pdfkit");
const {
  calculateAverageWaitSeconds,
  calculateAverageServiceSeconds,
  getLongestWaitingToken,
  createQueueTrend,
  createStatusDistribution,
  createHourlyTraffic,
} = require("../utils/queueMath");
const { getOwnedQueue } = require("./queueController");

function secondsDiff(start, end) {
  return Math.max(0, dayjs(end).diff(dayjs(start), "second"));
}

function avg(values) {
  if (!values.length) {
    return 0;
  }
  return Math.round(values.reduce((acc, cur) => acc + cur, 0) / values.length);
}

function periodStartFor(date, period) {
  if (period === "weekly") {
    return dayjs(date).startOf("week");
  }
  if (period === "monthly") {
    return dayjs(date).startOf("month");
  }
  return dayjs(date).startOf("day");
}

function periodEndFor(date, period) {
  if (period === "weekly") {
    return dayjs(date).endOf("week");
  }
  if (period === "monthly") {
    return dayjs(date).endOf("month");
  }
  return dayjs(date).endOf("day");
}

function buildReportRows(tokens, period) {
  const buckets = new Map();

  for (const token of tokens) {
    const periodStart = periodStartFor(token.createdAt, period);
    const key = periodStart.toISOString();
    if (!buckets.has(key)) {
      buckets.set(key, {
        periodStart: periodStart.toISOString(),
        periodEnd: periodEndFor(token.createdAt, period).toISOString(),
        totalTokens: 0,
        waiting: 0,
        serving: 0,
        completed: 0,
        cancelled: 0,
        waitSamples: [],
        serviceSamples: [],
      });
    }

    const bucket = buckets.get(key);
    bucket.totalTokens += 1;
    bucket[token.status] += 1;

    if (token.servedAt) {
      bucket.waitSamples.push(secondsDiff(token.createdAt, token.servedAt));
    }
    if (token.servedAt && token.completedAt) {
      bucket.serviceSamples.push(secondsDiff(token.servedAt, token.completedAt));
    }
  }

  return [...buckets.values()]
    .sort((a, b) => dayjs(a.periodStart).valueOf() - dayjs(b.periodStart).valueOf())
    .map((row) => ({
      periodStart: row.periodStart,
      periodEnd: row.periodEnd,
      totalTokens: row.totalTokens,
      waiting: row.waiting,
      serving: row.serving,
      completed: row.completed,
      cancelled: row.cancelled,
      avgWaitTimeSec: avg(row.waitSamples),
      avgServiceTimeSec: avg(row.serviceSamples),
    }));
}

function toCSV(rows) {
  const headers = [
    "period_start",
    "period_end",
    "total_tokens",
    "waiting",
    "serving",
    "completed",
    "cancelled",
    "avg_wait_time_sec",
    "avg_service_time_sec",
  ];

  const lines = [headers.join(",")];
  for (const row of rows) {
    lines.push(
      [
        row.periodStart,
        row.periodEnd,
        row.totalTokens,
        row.waiting,
        row.serving,
        row.completed,
        row.cancelled,
        row.avgWaitTimeSec,
        row.avgServiceTimeSec,
      ].join(",")
    );
  }
  return `${lines.join("\n")}\n`;
}

async function createPDFBuffer(rows, queueName, period) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 40 });
    const chunks = [];

    doc.on("data", (chunk) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    doc.fontSize(18).text("Queue Analytics Report", { underline: true });
    doc.moveDown(0.5);
    doc.fontSize(12).text(`Queue: ${queueName}`);
    doc.text(`Period: ${period}`);
    doc.text(`Generated: ${new Date().toISOString()}`);
    doc.moveDown();

    rows.forEach((row, idx) => {
      doc.fontSize(11).text(
        `${idx + 1}. ${row.periodStart} to ${row.periodEnd} | Total: ${row.totalTokens} | Waiting: ${row.waiting} | Serving: ${row.serving} | Completed: ${row.completed} | Cancelled: ${row.cancelled} | AvgWait: ${row.avgWaitTimeSec}s | AvgService: ${row.avgServiceTimeSec}s`
      );
      doc.moveDown(0.3);
    });

    doc.end();
  });
}

async function reportData(queueId, period, from, to) {
  const filter = { queueId };
  if (from || to) {
    filter.createdAt = {};
    if (from) {
      filter.createdAt.$gte = dayjs(from).startOf("day").toDate();
    }
    if (to) {
      filter.createdAt.$lte = dayjs(to).endOf("day").toDate();
    }
  }

  const tokens = await Token.find(filter).lean();
  return buildReportRows(tokens, period);
}

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

const getPeriodicReport = asyncHandler(async (req, res) => {
  const queue = await getOwnedQueue(req.params.queueId, req.user.id);
  const period = req.query.period || "daily";
  if (!["daily", "weekly", "monthly"].includes(period)) {
    return res.status(400).json({ message: "Invalid period. Use daily, weekly, or monthly" });
  }

  const rows = await reportData(queue._id, period, req.query.from, req.query.to);
  res.json({ period, rows });
});

const exportPeriodicReportCSV = asyncHandler(async (req, res) => {
  const queue = await getOwnedQueue(req.params.queueId, req.user.id);
  const period = req.query.period || "daily";
  if (!["daily", "weekly", "monthly"].includes(period)) {
    return res.status(400).json({ message: "Invalid period. Use daily, weekly, or monthly" });
  }

  const rows = await reportData(queue._id, period, req.query.from, req.query.to);
  const csv = toCSV(rows);
  res.setHeader("Content-Type", "text/csv; charset=utf-8");
  res.setHeader("Content-Disposition", `attachment; filename=report-${period}.csv`);
  res.send(csv);
});

const exportPeriodicReportPDF = asyncHandler(async (req, res) => {
  const queue = await getOwnedQueue(req.params.queueId, req.user.id);
  const period = req.query.period || "daily";
  if (!["daily", "weekly", "monthly"].includes(period)) {
    return res.status(400).json({ message: "Invalid period. Use daily, weekly, or monthly" });
  }

  const rows = await reportData(queue._id, period, req.query.from, req.query.to);
  const pdfBuffer = await createPDFBuffer(rows, queue.name, period);
  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", `attachment; filename=report-${period}.pdf`);
  res.send(pdfBuffer);
});

module.exports = {
  getAnalyticsSummary,
  getQueueTrend,
  getStatusDistribution,
  getHourlyTraffic,
  getPeriodicReport,
  exportPeriodicReportCSV,
  exportPeriodicReportPDF,
};
