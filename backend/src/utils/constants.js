const TOKEN_STATUS = {
  WAITING: "waiting",
  SERVING: "serving",
  COMPLETED: "completed",
  CANCELLED: "cancelled",
};

const TOKEN_PRIORITY = {
  NORMAL: "normal",
  SENIOR: "senior",
  VIP: "vip",
  EMERGENCY: "emergency",
};

const PRIORITY_WEIGHT = {
  [TOKEN_PRIORITY.NORMAL]: 0,
  [TOKEN_PRIORITY.SENIOR]: 1,
  [TOKEN_PRIORITY.VIP]: 2,
  [TOKEN_PRIORITY.EMERGENCY]: 3,
};

module.exports = {
  TOKEN_STATUS,
  TOKEN_PRIORITY,
  PRIORITY_WEIGHT,
};
