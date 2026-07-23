const mongoose = require("mongoose");

const aiInsightCacheSchema = new mongoose.Schema(
  {
    queueId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Queue",
      required: true,
      index: true,
    },
    managerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    insightText: {
      type: String,
      required: true,
    },
    model: {
      type: String,
      default: "gemini-1.5-flash",
    },
    generatedAt: {
      type: Date,
      required: true,
      default: Date.now,
    },
  },
  { timestamps: true }
);

aiInsightCacheSchema.index({ queueId: 1, managerId: 1 }, { unique: true });

module.exports = mongoose.model("AIInsightCache", aiInsightCacheSchema);
