const mongoose = require("mongoose");

const analyticsDailySchema = new mongoose.Schema(
  {
    queueId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Queue",
      required: true,
      index: true,
    },
    date: {
      type: Date,
      required: true,
      index: true,
    },
    avgWaitTimeSec: {
      type: Number,
      default: 0,
    },
    avgServiceTimeSec: {
      type: Number,
      default: 0,
    },
    totalServed: {
      type: Number,
      default: 0,
    },
    totalCancelled: {
      type: Number,
      default: 0,
    },
    peakHour: {
      type: Number,
      default: 0,
    },
    statusCounts: {
      waiting: { type: Number, default: 0 },
      serving: { type: Number, default: 0 },
      completed: { type: Number, default: 0 },
      cancelled: { type: Number, default: 0 },
    },
    hourlyCounts: {
      type: [Number],
      default: () => Array(24).fill(0),
    },
  },
  { timestamps: true }
);

analyticsDailySchema.index({ queueId: 1, date: 1 }, { unique: true });

module.exports = mongoose.model("AnalyticsDaily", analyticsDailySchema);
