const mongoose = require("mongoose");

const activityLogSchema = new mongoose.Schema(
  {
    managerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    queueId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Queue",
      default: null,
      index: true,
    },
    tokenId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Token",
      default: null,
    },
    action: {
      type: String,
      required: true,
      index: true,
    },
    message: {
      type: String,
      required: true,
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  { timestamps: true }
);

activityLogSchema.index({ managerId: 1, createdAt: -1 });

module.exports = mongoose.model("ActivityLog", activityLogSchema);
