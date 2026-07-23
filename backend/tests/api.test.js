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

async function createQueue(token, name = "Main Queue", capacity = null) {
  const res = await request(app)
    .post("/api/queues")
    .set("Authorization", `Bearer ${token}`)
    .send({ name, capacity });

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

  test("duplicate active token names are blocked when adding token", async () => {
    const token = await createAuthedUser();
    const queue = await createQueue(token, "Duplicate Queue");

    await addToken(token, queue._id, "Aarav", "normal");
    const duplicateRes = await request(app)
      .post(`/api/queues/${queue._id}/tokens`)
      .set("Authorization", `Bearer ${token}`)
      .send({ personName: "aarav", priority: "vip" });

    expect(duplicateRes.status).toBe(409);
    expect(duplicateRes.body.message).toMatch(/already active/i);
  });

  test("queue capacity blocks adding new active tokens once full", async () => {
    const token = await createAuthedUser();
    const queue = await createQueue(token, "Capacity Queue", 2);

    await addToken(token, queue._id, "One", "normal");
    await addToken(token, queue._id, "Two", "normal");

    const overCapRes = await request(app)
      .post(`/api/queues/${queue._id}/tokens`)
      .set("Authorization", `Bearer ${token}`)
      .send({ personName: "Three", priority: "normal" });

    expect(overCapRes.status).toBe(409);
    expect(overCapRes.body.message).toMatch(/capacity reached/i);
  });

  test("token search and pagination return expected filtered and paged results", async () => {
    const token = await createAuthedUser();
    const queue = await createQueue(token, "Search Queue");

    await addToken(token, queue._id, "Nisha", "normal");
    await addToken(token, queue._id, "Nikhil", "normal");
    await addToken(token, queue._id, "Rahul", "normal");

    const pageRes = await request(app)
      .get(`/api/queues/${queue._id}/tokens?page=2&pageSize=1`)
      .set("Authorization", `Bearer ${token}`);

    expect(pageRes.status).toBe(200);
    expect(pageRes.body.tokens).toHaveLength(1);
    expect(pageRes.body.pagination.total).toBe(3);
    expect(pageRes.body.pagination.totalPages).toBe(3);
    expect(pageRes.body.pagination.page).toBe(2);

    const searchRes = await request(app)
      .get(`/api/queues/${queue._id}/tokens?search=nik`)
      .set("Authorization", `Bearer ${token}`);

    expect(searchRes.status).toBe(200);
    expect(searchRes.body.tokens).toHaveLength(1);
    expect(searchRes.body.tokens[0].personName).toBe("Nikhil");
  });

  test("daily/weekly/monthly reports and CSV/PDF exports return valid output", async () => {
    const token = await createAuthedUser();
    const queue = await createQueue(token, "Reports Queue");

    await Token.insertMany([
      {
        queueId: queue._id,
        managerId: queue.managerId,
        tokenNumber: 1,
        personName: "Day One",
        priority: "normal",
        priorityWeight: 0,
        position: 1,
        status: "completed",
        createdAt: new Date("2026-01-01T10:00:00.000Z"),
        servedAt: new Date("2026-01-01T10:05:00.000Z"),
        completedAt: new Date("2026-01-01T10:10:00.000Z"),
      },
      {
        queueId: queue._id,
        managerId: queue.managerId,
        tokenNumber: 2,
        personName: "Day Two",
        priority: "normal",
        priorityWeight: 0,
        position: 2,
        status: "cancelled",
        createdAt: new Date("2026-01-09T10:00:00.000Z"),
        cancelledAt: new Date("2026-01-09T10:07:00.000Z"),
      },
    ]);

    const dailyRes = await request(app)
      .get(`/api/queues/${queue._id}/analytics/reports?period=daily`)
      .set("Authorization", `Bearer ${token}`);
    expect(dailyRes.status).toBe(200);
    expect(dailyRes.body.period).toBe("daily");
    expect(dailyRes.body.rows.length).toBe(2);

    const weeklyRes = await request(app)
      .get(`/api/queues/${queue._id}/analytics/reports?period=weekly`)
      .set("Authorization", `Bearer ${token}`);
    expect(weeklyRes.status).toBe(200);
    expect(weeklyRes.body.period).toBe("weekly");

    const monthlyRes = await request(app)
      .get(`/api/queues/${queue._id}/analytics/reports?period=monthly`)
      .set("Authorization", `Bearer ${token}`);
    expect(monthlyRes.status).toBe(200);
    expect(monthlyRes.body.period).toBe("monthly");

    const csvRes = await request(app)
      .get(`/api/queues/${queue._id}/analytics/reports/export.csv?period=daily`)
      .set("Authorization", `Bearer ${token}`);
    expect(csvRes.status).toBe(200);
    expect(csvRes.headers["content-type"]).toContain("text/csv");
    expect(csvRes.text).toContain("period_start");

    const pdfRes = await request(app)
      .get(`/api/queues/${queue._id}/analytics/reports/export.pdf?period=daily`)
      .set("Authorization", `Bearer ${token}`);
    expect(pdfRes.status).toBe(200);
    expect(pdfRes.headers["content-type"]).toContain("application/pdf");
  });
});
