const ActivityLog = require("../models/ActivityLog");
const asyncHandler = require("../utils/asyncHandler");

const listActivityLogs = asyncHandler(async (req, res) => {
  const page = Math.max(1, Number(req.query.page || 1));
  const pageSize = Math.min(100, Math.max(1, Number(req.query.pageSize || 25)));
  const skip = (page - 1) * pageSize;

  const [logs, total] = await Promise.all([
    ActivityLog.find({ managerId: req.user.id }).sort({ createdAt: -1 }).skip(skip).limit(pageSize).lean(),
    ActivityLog.countDocuments({ managerId: req.user.id }),
  ]);

  res.json({
    logs,
    pagination: {
      page,
      pageSize,
      total,
      totalPages: Math.max(1, Math.ceil(total / pageSize)),
      hasNextPage: page * pageSize < total,
      hasPreviousPage: page > 1,
    },
  });
});

module.exports = {
  listActivityLogs,
};
