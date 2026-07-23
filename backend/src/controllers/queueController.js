const Queue = require("../models/Queue");
const Token = require("../models/Token");
const asyncHandler = require("../utils/asyncHandler");
const httpError = require("../utils/httpError");
const { logActivity } = require("../services/activityLogService");

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

  await logActivity({
    managerId: req.user.id,
    queueId: queue._id,
    action: "queue_created",
    message: `Queue created: ${queue.name}`,
    metadata: { capacity: queue.capacity },
  });

  res.status(201).json({ queue });
});

const listQueues = asyncHandler(async (req, res) => {
  const status = req.query.status || "active";
  const query = { managerId: req.user.id };
  if (status === "active") {
    query.isArchived = false;
  } else if (status === "archived") {
    query.isArchived = true;
  }

  const queues = await Queue.find(query).sort({ createdAt: -1 }).lean();
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

  await logActivity({
    managerId: req.user.id,
    queueId: queue._id,
    action: "queue_deleted",
    message: `Queue deleted: ${queue.name}`,
  });

  res.json({ message: "Queue deleted" });
});

const archiveQueue = asyncHandler(async (req, res) => {
  const queue = await Queue.findOne({ _id: req.params.queueId, managerId: req.user.id });
  if (!queue) {
    throw httpError(404, "Queue not found");
  }

  queue.isArchived = true;
  queue.archivedAt = new Date();
  await queue.save();

  await logActivity({
    managerId: req.user.id,
    queueId: queue._id,
    action: "queue_archived",
    message: `Queue archived: ${queue.name}`,
  });

  res.json({ queue });
});

const unarchiveQueue = asyncHandler(async (req, res) => {
  const queue = await Queue.findOne({ _id: req.params.queueId, managerId: req.user.id });
  if (!queue) {
    throw httpError(404, "Queue not found");
  }

  queue.isArchived = false;
  queue.archivedAt = null;
  await queue.save();

  await logActivity({
    managerId: req.user.id,
    queueId: queue._id,
    action: "queue_unarchived",
    message: `Queue unarchived: ${queue.name}`,
  });

  res.json({ queue });
});

async function getOwnedQueue(queueId, managerId) {
  const queue = await Queue.findOne({ _id: queueId, managerId });
  if (!queue) {
    throw httpError(404, "Queue not found");
  }
  return queue;
}

function assertQueueMutable(queue) {
  if (queue.isArchived) {
    throw httpError(409, "Queue is archived and cannot be modified");
  }
}

module.exports = {
  createQueue,
  listQueues,
  getQueue,
  deleteQueue,
  archiveQueue,
  unarchiveQueue,
  getOwnedQueue,
  assertQueueMutable,
};
