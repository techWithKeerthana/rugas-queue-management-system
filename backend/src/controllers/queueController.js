const Queue = require("../models/Queue");
const Token = require("../models/Token");
const asyncHandler = require("../utils/asyncHandler");
const httpError = require("../utils/httpError");

function normalizeQueueName(name) {
  return name.trim().toLowerCase().replace(/\s+/g, " ");
}

const createQueue = asyncHandler(async (req, res) => {
  const { name, capacity } = req.body;
  const nameNormalized = normalizeQueueName(name);

  const existing = await Queue.findOne({
    managerId: req.user.id,
    nameNormalized,
  }).lean();
  if (existing) {
    throw httpError(409, "Queue name already exists");
  }

  const queue = await Queue.create({
    name: name.trim(),
    nameNormalized,
    managerId: req.user.id,
    capacity: capacity ?? null,
  });

  res.status(201).json({ queue });
});

const listQueues = asyncHandler(async (req, res) => {
  const queues = await Queue.find({ managerId: req.user.id }).sort({ createdAt: -1 }).lean();
  res.json({ queues });
});

const getQueue = asyncHandler(async (req, res) => {
  const queue = await Queue.findOne({ _id: req.params.queueId, managerId: req.user.id }).lean();
  if (!queue) {
    throw httpError(404, "Queue not found");
  }

  const counts = await Token.aggregate([
    { $match: { queueId: queue._id } },
    { $group: { _id: "$status", count: { $sum: 1 } } },
  ]);

  res.json({
    queue,
    counts: counts.reduce((acc, item) => {
      acc[item._id] = item.count;
      return acc;
    }, {}),
  });
});

const deleteQueue = asyncHandler(async (req, res) => {
  const queue = await Queue.findOneAndDelete({ _id: req.params.queueId, managerId: req.user.id });
  if (!queue) {
    throw httpError(404, "Queue not found");
  }

  await Token.deleteMany({ queueId: queue._id });

  res.json({ message: "Queue deleted" });
});

async function getOwnedQueue(queueId, managerId) {
  const queue = await Queue.findOne({ _id: queueId, managerId });
  if (!queue) {
    throw httpError(404, "Queue not found");
  }
  return queue;
}

module.exports = {
  createQueue,
  listQueues,
  getQueue,
  deleteQueue,
  getOwnedQueue,
};
