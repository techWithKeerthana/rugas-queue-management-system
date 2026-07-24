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
const AIInsightCache = require("../models/AIInsightCache");
const { generateQueueInsights } = require("../services/aiInsightsService");

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

function promiseWithTimeout(promise, timeoutMs) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error("Insights request timed out"));
    }, timeoutMs);

    promise
      .then((value) => {
        clearTimeout(timer);
        resolve(value);
      })
      .catch((error) => {
        clearTimeout(timer);
        reject(error);
      });
  });
}

async function buildInsightsPayload(queueId) {
  const tokens = await Token.find({ queueId }).lean();
  const trend = createQueueTrend(tokens, 12);
  const statusDistribution = createStatusDistribution(tokens);
  const hourlyTraffic = createHourlyTraffic(tokens);

  const summary = {
    totalTokens: tokens.length,
    waiting: tokens.filter((t) => t.status === "waiting").length,
    serving: tokens.filter((t) => t.status === "serving").length,
    completed: tokens.filter((t) => t.status === "completed").length,
    cancelled: tokens.filter((t) => t.status === "cancelled").length,
    avgWaitTimeSec: calculateAverageWaitSeconds(tokens),
    avgServiceTimeSec: calculateAverageServiceSeconds(tokens),
    longestWaitingToken: getLongestWaitingToken(tokens),
  };

  const peak = hourlyTraffic.reduce((acc, cur) => (cur.count > acc.count ? cur : acc), { hour: 0, count: 0 });

  return {
    summary,
    trend,
    statusDistribution,
    hourlyTraffic,
    peakHour: peak,
  };
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

const getAIInsights = asyncHandler(async (req, res) => {
  const queue = await getOwnedQueue(req.params.queueId, req.user.id);
  const refresh = req.query.refresh === "true";
  const maxAgeMs = 60 * 60 * 1000;

  const existing = await AIInsightCache.findOne({ queueId: queue._id, managerId: req.user.id }).lean();
  const isFresh = existing && Date.now() - new Date(existing.generatedAt).getTime() < maxAgeMs;

  if (existing && isFresh && !refresh) {
    return res.json({
      available: true,
      insightText: existing.insightText,
      generatedAt: existing.generatedAt,
      cached: true,
      stale: false,
    });
  }

  try {
    const payload = await buildInsightsPayload(queue._id);
    const timeoutMs = Number(process.env.INSIGHTS_TIMEOUT_MS || 12000);
    const generated = await promiseWithTimeout(generateQueueInsights(payload), timeoutMs);

    const saved = await AIInsightCache.findOneAndUpdate(
      { queueId: queue._id, managerId: req.user.id },
      {
        insightText: generated.insightText,
        model: generated.model,
        generatedAt: new Date(),
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    ).lean();

    return res.json({
      available: true,
      insightText: saved.insightText,
      generatedAt: saved.generatedAt,
      cached: false,
      stale: false,
    });
  } catch (error) {
    // Log precise failure context for production diagnostics (Gemini key/model/timeout/network).
    // Keep client response generic to avoid leaking provider or credential details.
    // eslint-disable-next-line no-console
    console.error("AI insights generation failed", {
      queueId: String(queue._id),
      managerId: String(req.user.id),
      message: error?.message,
      name: error?.name,
      stack: error?.stack,
      timeoutMs: Number(process.env.INSIGHTS_TIMEOUT_MS || 12000),
      model: process.env.GEMINI_MODEL || "gemini-1.5-flash",
      hasGeminiApiKey: Boolean(process.env.GEMINI_API_KEY),
    });

    if (existing) {
      return res.json({
        available: true,
        insightText: existing.insightText,
        generatedAt: existing.generatedAt,
        cached: true,
        stale: true,
        message: "Insights temporarily unavailable. Showing last generated insights.",
      });
    }

    return res.status(200).json({
      available: false,
      insightText: "Insights temporarily unavailable. Please try again shortly.",
      cached: false,
      stale: false,
      message: "Insights temporarily unavailable",
    });
  }
});

module.exports = {
  getAnalyticsSummary,
  getQueueTrend,
  getStatusDistribution,
  getHourlyTraffic,
  getPeriodicReport,
  exportPeriodicReportCSV,
  exportPeriodicReportPDF,
  getAIInsights,
};
