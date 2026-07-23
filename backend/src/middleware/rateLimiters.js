const rateLimit = require("express-rate-limit");
const { MemoryStore } = rateLimit;

const defaultLimitResponse = {
  message: "Too many requests, please try again later",
};

const publicTrackStore = new MemoryStore();
const publicJoinStore = new MemoryStore();

const publicTrackLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
  store: publicTrackStore,
  message: defaultLimitResponse,
});

const publicJoinLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  store: publicJoinStore,
  message: { message: "Too many join attempts, please try again later" },
});

function resetPublicRateLimiters() {
  publicTrackStore.resetAll();
  publicJoinStore.resetAll();
}

module.exports = {
  publicTrackLimiter,
  publicJoinLimiter,
  resetPublicRateLimiters,
};
