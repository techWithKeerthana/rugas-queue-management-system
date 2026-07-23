require("dotenv").config();

const bcrypt = require("bcryptjs");
const { connectDB, disconnectDB } = require("../config/db");
const User = require("../models/User");
const Queue = require("../models/Queue");
const Token = require("../models/Token");
const { TOKEN_PRIORITY, TOKEN_STATUS, PRIORITY_WEIGHT } = require("../utils/constants");

async function seed() {
  if (!process.env.MONGO_URI) {
    throw new Error("MONGO_URI is required to run seed script");
  }

  await connectDB(process.env.MONGO_URI);

  await Promise.all([User.deleteMany({}), Queue.deleteMany({}), Token.deleteMany({})]);

  const passwordHash = await bcrypt.hash("Password123", 10);
  const manager = await User.create({
    name: "Demo Manager",
    email: "manager@queueflow.dev",
    passwordHash,
  });

  const queues = await Queue.insertMany([
    {
      name: "General Support",
      nameNormalized: "general support",
      managerId: manager._id,
    },
    {
      name: "Billing",
      nameNormalized: "billing",
      managerId: manager._id,
    },
    {
      name: "Priority Desk",
      nameNormalized: "priority desk",
      managerId: manager._id,
    },
  ]);

  const now = new Date();
  await Token.insertMany([
    {
      queueId: queues[0]._id,
      managerId: manager._id,
      tokenNumber: 1,
      personName: "Riya",
      priority: TOKEN_PRIORITY.EMERGENCY,
      priorityWeight: PRIORITY_WEIGHT[TOKEN_PRIORITY.EMERGENCY],
      position: 1,
      status: TOKEN_STATUS.WAITING,
    },
    {
      queueId: queues[0]._id,
      managerId: manager._id,
      tokenNumber: 2,
      personName: "Arjun",
      priority: TOKEN_PRIORITY.VIP,
      priorityWeight: PRIORITY_WEIGHT[TOKEN_PRIORITY.VIP],
      position: 2,
      status: TOKEN_STATUS.WAITING,
    },
    {
      queueId: queues[0]._id,
      managerId: manager._id,
      tokenNumber: 3,
      personName: "Nina",
      priority: TOKEN_PRIORITY.NORMAL,
      priorityWeight: PRIORITY_WEIGHT[TOKEN_PRIORITY.NORMAL],
      position: 3,
      status: TOKEN_STATUS.SERVING,
      servedAt: new Date(now.getTime() - 4 * 60 * 1000),
    },
    {
      queueId: queues[0]._id,
      managerId: manager._id,
      tokenNumber: 4,
      personName: "David",
      priority: TOKEN_PRIORITY.SENIOR,
      priorityWeight: PRIORITY_WEIGHT[TOKEN_PRIORITY.SENIOR],
      position: 4,
      status: TOKEN_STATUS.CANCELLED,
      cancelledAt: new Date(now.getTime() - 15 * 60 * 1000),
    },
    {
      queueId: queues[1]._id,
      managerId: manager._id,
      tokenNumber: 1,
      personName: "Fatima",
      priority: TOKEN_PRIORITY.NORMAL,
      priorityWeight: PRIORITY_WEIGHT[TOKEN_PRIORITY.NORMAL],
      position: 1,
      status: TOKEN_STATUS.COMPLETED,
      servedAt: new Date(now.getTime() - 45 * 60 * 1000),
      completedAt: new Date(now.getTime() - 35 * 60 * 1000),
    },
    {
      queueId: queues[1]._id,
      managerId: manager._id,
      tokenNumber: 2,
      personName: "Kabir",
      priority: TOKEN_PRIORITY.NORMAL,
      priorityWeight: PRIORITY_WEIGHT[TOKEN_PRIORITY.NORMAL],
      position: 2,
      status: TOKEN_STATUS.WAITING,
    },
    {
      queueId: queues[2]._id,
      managerId: manager._id,
      tokenNumber: 1,
      personName: "Esha",
      priority: TOKEN_PRIORITY.SENIOR,
      priorityWeight: PRIORITY_WEIGHT[TOKEN_PRIORITY.SENIOR],
      position: 1,
      status: TOKEN_STATUS.WAITING,
    },
  ]);

  // eslint-disable-next-line no-console
  console.log("Seed complete");
  // eslint-disable-next-line no-console
  console.log("Demo login: manager@queueflow.dev / Password123");

  await disconnectDB();
}

seed().catch(async (error) => {
  // eslint-disable-next-line no-console
  console.error(error);
  await disconnectDB();
  process.exit(1);
});
