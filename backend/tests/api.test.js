const request = require("supertest");
const { MongoMemoryServer } = require("mongodb-memory-server-core");
const mongoose = require("mongoose");

jest.mock("../src/config/socket", () => ({
  safeEmitToQueue: jest.fn(),
}));

const createApp = require("../src/app");
const { connectDB, disconnectDB } = require("../src/config/db");
const Token = require("../src/models/Token");
const { safeEmitToQueue } = require("../src/config/socket");

let app;
let mongoServer;

jest.setTimeout(240000);

async function createAuthedUser() {
  const email = `manager${Date.now()}${Math.random()}@example.com`;
  const registerRes = await request(app).post("/api/auth/register").send({
    name: "Manager",
    email,
    password: "Password123",
  });

  return registerRes.body.token;
}

async function createQueue(token, name = "Main Queue") {
  const res = await request(app)
    .post("/api/queues")
    .set("Authorization", `Bearer ${token}`)
    .send({ name });

  return res.body.queue;
}

async function addToken(token, queueId, personName, priority = "normal") {
  const res = await request(app)
    .post(`/api/queues/${queueId}/tokens`)
    .set("Authorization", `Bearer ${token}`)
    .send({ personName, priority });

  return res.body;
}

beforeAll(async () => {
  process.env.NODE_ENV = "test";
  process.env.JWT_SECRET = "test-secret";

  mongoServer = await MongoMemoryServer.create({
    binary: { version: "7.0.14" },
  });

  await connectDB(mongoServer.getUri());
  app = createApp();
});

afterEach(async () => {
  safeEmitToQueue.mockClear();
  if (mongoose.connection.readyState === 1 && mongoose.connection.db) {
    await mongoose.connection.db.dropDatabase();
  }
});

afterAll(async () => {
  if (mongoose.connection.readyState !== 0) {
    await disconnectDB();
  }
  if (mongoServer) {
    await mongoServer.stop();
  }
});

describe("Queue token business logic", () => {
  test("priority ordering places emergency/vip/senior ahead of normal", async () => {
    const token = await createAuthedUser();
    const queue = await createQueue(token, "Priority Queue");

    await addToken(token, queue._id, "Normal A", "normal");
    await addToken(token, queue._id, "Normal B", "normal");
    await addToken(token, queue._id, "Senior", "senior");
    await addToken(token, queue._id, "VIP", "vip");
    const finalState = await addToken(token, queue._id, "Emergency", "emergency");

    const waiting = finalState.tokens.filter((t) => t.status === "waiting").sort((a, b) => a.position - b.position);
    expect(waiting.map((t) => t.priority)).toEqual(["emergency", "vip", "senior", "normal", "normal"]);
    expect(waiting.map((t) => t.position)).toEqual([1, 2, 3, 4, 5]);
  });

  test("serve/cancel/undo keeps status and timestamps consistent", async () => {
    const token = await createAuthedUser();
    const queue = await createQueue(token, "Undo Queue");

    const added = await addToken(token, queue._id, "Walk-in", "normal");
    const tokenId = added.tokens.find((t) => t.personName === "Walk-in")._id;

    const servedRes = await request(app)
      .patch(`/api/queues/${queue._id}/tokens/serve-top`)
      .set("Authorization", `Bearer ${token}`)
      .send();

    let servedToken = servedRes.body.tokens.find((t) => t._id === tokenId);
    expect(servedToken.status).toBe("serving");
    expect(servedToken.servedAt).toBeTruthy();

    const cancelledRes = await request(app)
      .patch(`/api/queues/${queue._id}/tokens/${tokenId}/cancel`)
      .set("Authorization", `Bearer ${token}`)
      .send();

    let cancelledToken = cancelledRes.body.tokens.find((t) => t._id === tokenId);
    expect(cancelledToken.status).toBe("cancelled");
    expect(cancelledToken.cancelledAt).toBeTruthy();

    const undoCancelRes = await request(app)
      .patch(`/api/queues/${queue._id}/tokens/${tokenId}/undo`)
      .set("Authorization", `Bearer ${token}`)
      .send();

    let undone = undoCancelRes.body.tokens.find((t) => t._id === tokenId);
    expect(undone.status).toBe("serving");
    expect(undone.servedAt).toBeTruthy();
    expect(undone.cancelledAt).toBeFalsy();

    const completeRes = await request(app)
      .patch(`/api/queues/${queue._id}/tokens/${tokenId}/complete`)
      .set("Authorization", `Bearer ${token}`)
      .send();

    const completedToken = completeRes.body.tokens.find((t) => t._id === tokenId);
    expect(completedToken.status).toBe("completed");
    expect(completedToken.completedAt).toBeTruthy();

    await addToken(token, queue._id, "Undo Serve", "normal");
    const serveSecondRes = await request(app)
      .patch(`/api/queues/${queue._id}/tokens/serve-top`)
      .set("Authorization", `Bearer ${token}`)
      .send();

    const secondToken = serveSecondRes.body.tokens.find((t) => t.personName === "Undo Serve");
    expect(secondToken.status).toBe("serving");

    const undoServeRes = await request(app)
      .patch(`/api/queues/${queue._id}/tokens/${secondToken._id}/undo`)
      .set("Authorization", `Bearer ${token}`)
      .send();

    undone = undoServeRes.body.tokens.find((t) => t._id === secondToken._id);
    expect(undone.status).toBe("waiting");
    expect(undone.servedAt).toBeFalsy();

    const dbToken = await Token.findById(secondToken._id).lean();
    expect(dbToken.status).toBe("waiting");
    expect(dbToken.servedAt).toBeFalsy();
    expect(dbToken.cancelledAt).toBeFalsy();
  });

  test("reorder persists exact waiting positions", async () => {
    const token = await createAuthedUser();
    const queue = await createQueue(token, "Reorder Queue");

    await addToken(token, queue._id, "One", "normal");
    await addToken(token, queue._id, "Two", "normal");
    const state = await addToken(token, queue._id, "Three", "normal");

    const waiting = state.tokens.filter((t) => t.status === "waiting").sort((a, b) => a.position - b.position);
    const reversedIds = waiting.map((t) => t._id).reverse();

    const reorderedRes = await request(app)
      .patch(`/api/queues/${queue._id}/tokens/reorder`)
      .set("Authorization", `Bearer ${token}`)
      .send({ orderedTokenIds: reversedIds });

    const reorderedWaiting = reorderedRes.body.tokens
      .filter((t) => t.status === "waiting")
      .sort((a, b) => a.position - b.position);

    expect(reorderedWaiting.map((t) => t._id)).toEqual(reversedIds);
    expect(reorderedWaiting.map((t) => t.position)).toEqual([1, 2, 3]);
  });

  test("socket events fire for add, reorder, serve, and cancel", async () => {
    const token = await createAuthedUser();
    const queue = await createQueue(token, "Realtime Queue");

    await addToken(token, queue._id, "A", "normal");
    await addToken(token, queue._id, "B", "normal");

    const listRes = await request(app)
      .get(`/api/queues/${queue._id}/tokens`)
      .set("Authorization", `Bearer ${token}`);

    const waitingIds = listRes.body.tokens
      .filter((item) => item.status === "waiting")
      .sort((a, b) => a.position - b.position)
      .map((item) => item._id);

    await request(app)
      .patch(`/api/queues/${queue._id}/tokens/reorder`)
      .set("Authorization", `Bearer ${token}`)
      .send({ orderedTokenIds: waitingIds.reverse() });

    const servedRes = await request(app)
      .patch(`/api/queues/${queue._id}/tokens/serve-top`)
      .set("Authorization", `Bearer ${token}`)
      .send();

    const serving = servedRes.body.tokens.find((item) => item.status === "serving");

    await request(app)
      .patch(`/api/queues/${queue._id}/tokens/${serving._id}/cancel`)
      .set("Authorization", `Bearer ${token}`)
      .send();

    const eventNames = safeEmitToQueue.mock.calls.map((call) => call[1]);
    expect(eventNames).toEqual(
      expect.arrayContaining(["token:added", "token:reordered", "token:served", "token:cancelled"])
    );
  });
});
