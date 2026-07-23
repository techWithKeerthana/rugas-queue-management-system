const ActivityLog = require("../models/ActivityLog");

async function logActivity({ managerId, action, message, queueId = null, tokenId = null, metadata = {} }) {
  if (!managerId || !action || !message) {
    return;
  }

  await ActivityLog.create({
    managerId,
    action,
    message,
    queueId,
    tokenId,
    metadata,
  });
}

module.exports = {
  logActivity,
};
