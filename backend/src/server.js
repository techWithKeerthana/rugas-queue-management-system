require("dotenv").config();

const http = require("http");
const { Server } = require("socket.io");
const jwt = require("jsonwebtoken");
const createApp = require("./app");
const { connectDB } = require("./config/db");
const { validateEnv } = require("./config/env");
const { setIo } = require("./config/socket");
const Token = require("./models/Token");

const PORT = process.env.PORT || 5000;

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

async function bootstrap() {
  validateEnv();
  await connectDB();

  const app = createApp();
  const server = http.createServer(app);
  const allowedOrigins = parseAllowedOrigins();

  const io = new Server(server, {
    cors: {
      origin: allowedOrigins,
      methods: ["GET", "POST", "PATCH", "DELETE"],
    },
  });

  io.use(async (socket, next) => {
    try {
      const mode = socket.handshake.auth?.mode;
      if (mode === "public-track") {
        const queueId = socket.handshake.auth?.queueId;
        const tokenId = socket.handshake.auth?.tokenId;

        if (!queueId || !tokenId) {
          return next(new Error("Unauthorized"));
        }

        const token = await Token.findOne({ _id: tokenId, queueId }).select("_id queueId").lean();
        if (!token) {
          return next(new Error("Unauthorized"));
        }

        socket.publicTrack = {
          queueId: queueId.toString(),
          tokenId: tokenId.toString(),
        };
        return next();
      }

      const token = socket.handshake.auth?.token;
      if (!token) {
        return next(new Error("Unauthorized"));
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      socket.user = { id: decoded.sub };
      return next();
    } catch (error) {
      return next(new Error("Unauthorized"));
    }
  });

  io.on("connection", (socket) => {
    if (socket.publicTrack?.queueId) {
      socket.join(`public:queue:${socket.publicTrack.queueId}`);
      return;
    }

    socket.on("queue:join", (queueId) => {
      socket.join(`queue:${queueId}`);
    });

    socket.on("queue:leave", (queueId) => {
      socket.leave(`queue:${queueId}`);
    });
  });

  setIo(io);

  server.listen(PORT, () => {
    // eslint-disable-next-line no-console
    console.log(`Backend listening on port ${PORT}`);
  });
}

bootstrap().catch((error) => {
  // eslint-disable-next-line no-console
  console.error(error);
  process.exit(1);
});
