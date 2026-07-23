const rateLimit = require("express-rate-limit");

const defaultLimitResponse = {
  message: "Too many requests, please try again later",
};

const publicTrackLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
  message: defaultLimitResponse,
});

module.exports = {
  publicTrackLimiter,
};
