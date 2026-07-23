const mongoose = require("mongoose");
const { TOKEN_STATUS, TOKEN_PRIORITY, PRIORITY_WEIGHT } = require("../utils/constants");

const actionSnapshotSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ["serve", "cancel", "complete"],
    },
    previousStatus: {
      type: String,
      enum: Object.values(TOKEN_STATUS),
    },
    previousPosition: Number,
    previousServedAt: Date,
    previousCompletedAt: Date,
    previousCancelledAt: Date,
    actedAt: Date,
  },
  { _id: false }
);

const tokenSchema = new mongoose.Schema(
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
    tokenNumber: {
      type: Number,
      required: true,
    },
    personName: {
      type: String,
      required: true,
      trim: true,
    },
    priority: {
      type: String,
      enum: Object.values(TOKEN_PRIORITY),
      default: TOKEN_PRIORITY.NORMAL,
    },
    priorityWeight: {
      type: Number,
      default: PRIORITY_WEIGHT[TOKEN_PRIORITY.NORMAL],
    },
    position: {
      type: Number,
      required: true,
      default: 0,
    },
    status: {
      type: String,
      enum: Object.values(TOKEN_STATUS),
      default: TOKEN_STATUS.WAITING,
      index: true,
    },
    servedAt: Date,
    completedAt: Date,
    cancelledAt: Date,
    actionSnapshot: actionSnapshotSchema,
  },
  { timestamps: true }
);

tokenSchema.index({ queueId: 1, tokenNumber: 1 }, { unique: true });
tokenSchema.index({ queueId: 1, status: 1, position: 1 });

module.exports = mongoose.model("Token", tokenSchema);
