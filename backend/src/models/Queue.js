const mongoose = require("mongoose");

const queueCounterSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 80,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { _id: true }
);

const queueSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    nameNormalized: {
      type: String,
      required: true,
      trim: true,
    },
    managerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    capacity: {
      type: Number,
      min: 1,
      default: null,
    },
    isArchived: {
      type: Boolean,
      default: false,
      index: true,
    },
    archivedAt: {
      type: Date,
      default: null,
    },
    counters: {
      type: [queueCounterSchema],
      default: [{ name: "Counter 1", isActive: true }],
    },
  },
  { timestamps: true }
);

queueSchema.index({ managerId: 1, nameNormalized: 1 }, { unique: true });

module.exports = mongoose.model("Queue", queueSchema);
