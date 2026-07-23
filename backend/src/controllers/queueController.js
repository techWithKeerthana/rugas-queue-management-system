const Queue = require("../models/Queue");
const Token = require("../models/Token");
const mongoose = require("mongoose");
const asyncHandler = require("../utils/asyncHandler");
const httpError = require("../utils/httpError");
const { TOKEN_STATUS } = require("../utils/constants");
const { logActivity } = require("../services/activityLogService");

function normalizeQueueName(name) {
  return name.trim().toLowerCase().replace(/\s+/g, " ");
}

function normalizeCounterName(name) {
  return String(name || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");
}

async function ensureQueueCounters(queue) {
  let changed = false;
  if (!Array.isArray(queue.counters)) {
    queue.counters = [];
    changed = true;
  }

  if (queue.counters.length === 0) {
    queue.counters.push({ name: "Counter 1", isActive: true });
    changed = true;
  }

  for (const counter of queue.counters) {
    if (!counter._id) {
      counter._id = new mongoose.Types.ObjectId();
      changed = true;
    }

    const trimmedName = String(counter.name || "").trim();
    if (!trimmedName) {
      counter.name = "Counter";
      changed = true;
    } else if (trimmedName !== counter.name) {
      counter.name = trimmedName;
      changed = true;
    }

    if (counter.isActive === undefined) {
      counter.isActive = true;
      changed = true;
    }
  }

  if (changed) {
    await queue.save();
  }
}

async function assertCounterNotServing(queueId, counterName) {
  const servingAtCounter = await Token.findOne({
    queueId,
    status: TOKEN_STATUS.SERVING,
    assignedCounter: counterName,
  })
    .select("_id")
    .lean();

  if (servingAtCounter) {
    throw httpError(409, `Cannot modify counter \"${counterName}\" while a token is being served there`);
  }
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
  const queue = await Queue.findOne({ _id: req.params.queueId, managerId: req.user.id });
  if (!queue) {
    throw httpError(404, "Queue not found");
  }

  await ensureQueueCounters(queue);

  const counts = await Token.aggregate([
    { $match: { queueId: queue._id } },
    { $group: { _id: "$status", count: { $sum: 1 } } },
  ]);

  res.json({
    queue: queue.toObject(),
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
  await ensureQueueCounters(queue);
  return queue;
}

function assertQueueMutable(queue) {
  if (queue.isArchived) {
    throw httpError(409, "Queue is archived and cannot be modified");
  }
}

const addQueueCounter = asyncHandler(async (req, res) => {
  const queue = await getOwnedQueue(req.params.queueId, req.user.id);
  assertQueueMutable(queue);

  const name = req.body.name.trim();
  const normalizedName = normalizeCounterName(name);
  const duplicate = queue.counters.some((counter) => normalizeCounterName(counter.name) === normalizedName);
  if (duplicate) {
    throw httpError(409, "Counter name already exists");
  }

  queue.counters.push({ name, isActive: true });
  await queue.save();

  await logActivity({
    managerId: req.user.id,
    queueId: queue._id,
    action: "queue_counter_added",
    message: `Counter added: ${name}`,
  });

  res.status(201).json({ queue });
});

const renameQueueCounter = asyncHandler(async (req, res) => {
  const queue = await getOwnedQueue(req.params.queueId, req.user.id);
  assertQueueMutable(queue);

  const counter = queue.counters.id(req.params.counterId);
  if (!counter) {
    throw httpError(404, "Counter not found");
  }

  await assertCounterNotServing(queue._id, counter.name);

  const name = req.body.name.trim();
  const normalizedName = normalizeCounterName(name);
  const duplicate = queue.counters.some(
    (item) => item._id.toString() !== counter._id.toString() && normalizeCounterName(item.name) === normalizedName
  );
  if (duplicate) {
    throw httpError(409, "Counter name already exists");
  }

  counter.name = name;
  await queue.save();

  await logActivity({
    managerId: req.user.id,
    queueId: queue._id,
    action: "queue_counter_renamed",
    message: `Counter renamed to ${name}`,
  });

  res.json({ queue });
});

const removeQueueCounter = asyncHandler(async (req, res) => {
  const queue = await getOwnedQueue(req.params.queueId, req.user.id);
  assertQueueMutable(queue);

  const counter = queue.counters.id(req.params.counterId);
  if (!counter) {
    throw httpError(404, "Counter not found");
  }

  const activeCounterCount = queue.counters.filter((item) => item.isActive !== false).length;
  if (activeCounterCount <= 1 && counter.isActive !== false) {
    throw httpError(409, "Queue must have at least one active counter");
  }

  await assertCounterNotServing(queue._id, counter.name);

  counter.deleteOne();
  await queue.save();

  await logActivity({
    managerId: req.user.id,
    queueId: queue._id,
    action: "queue_counter_removed",
    message: `Counter removed: ${counter.name}`,
  });

  res.json({ queue });
});

module.exports = {
  createQueue,
  listQueues,
  getQueue,
  deleteQueue,
  archiveQueue,
  unarchiveQueue,
  addQueueCounter,
  renameQueueCounter,
  removeQueueCounter,
  getOwnedQueue,
  assertQueueMutable,
};
