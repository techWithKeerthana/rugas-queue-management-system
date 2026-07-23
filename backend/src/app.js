const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");

const authRoutes = require("./routes/authRoutes");
const publicTrackRoutes = require("./routes/publicTrackRoutes");
const queueRoutes = require("./routes/queueRoutes");
const tokenRoutes = require("./routes/tokenRoutes");
const analyticsRoutes = require("./routes/analyticsRoutes");
const activityLogRoutes = require("./routes/activityLogRoutes");
const { protect } = require("./middleware/authMiddleware");
const notFound = require("./middleware/notFound");
const errorHandler = require("./middleware/errorHandler");

function parseAllowedOrigins() {
  const configured = (process.env.FRONTEND_ORIGIN || "").trim();
  const defaults = ["http://localhost:5173", "http://localhost:5174"];
  if (!configured) {
    return defaults;
  }

  return configured
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);
}

function createApp() {
  const app = express();

  const allowedOrigins = parseAllowedOrigins();
  app.use(
    cors({
      origin: (origin, callback) => {
        if (!origin || allowedOrigins.includes(origin)) {
          return callback(null, true);
        }
        return callback(new Error("CORS origin not allowed"));
      },
      credentials: true,
    })
  );
  app.use(helmet());
  app.use(express.json());

  if (process.env.NODE_ENV !== "test") {
    app.use(morgan("dev"));
  }

  app.get("/health", (req, res) => {
    res.json({ ok: true });
  });

  app.use("/api/auth", authRoutes);
  app.use("/api/public", publicTrackRoutes);
  app.use("/api/queues", protect, queueRoutes);
  app.use("/api/queues/:queueId/tokens", protect, tokenRoutes);
  app.use("/api/queues/:queueId/analytics", protect, analyticsRoutes);
  app.use("/api/activity-logs", protect, activityLogRoutes);

  app.use(notFound);
  app.use(errorHandler);

  return app;
}

module.exports = createApp;
