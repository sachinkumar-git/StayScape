process.env.NODE_ENV = "test";
process.env.MONGO_URL = process.env.TEST_MONGO_URL || "mongodb://127.0.0.1:27017/stayscape_test";
process.env.IMAGE_STORAGE = "local";

const request = require("supertest");
const mongoose = require("mongoose");
const env = require("../src/config/env");
const { connectDatabase, disconnectDatabase } = require("../src/config/database");
const createApp = require("../src/server");
const { toISODate, addDays, today } = require("../src/utils/dates");

const TINY_PNG = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=",
  "base64"
);

async function startApp() {
  const connection = await connectDatabase(env.mongoUrl);
  await connection.dropDatabase();
  await Promise.all(Object.values(mongoose.models).map((model) => model.syncIndexes()));
  return createApp({ mongoClient: connection.getClient() });
}

async function stopApp() {
  await mongoose.connection.dropDatabase();
  await disconnectDatabase();
}

async function csrfToken(agent) {
  const res = await agent.get("/api/session");
  return res.body.csrfToken;
}

async function send(agent, method, url, body) {
  const token = await csrfToken(agent);
  const req = agent[method](url).set("X-CSRF-Token", token);
  return body === undefined ? req : req.send(body);
}

async function signup(app, name, email, password = "correct-horse-1") {
  const agent = request.agent(app);
  const res = await send(agent, "post", "/api/auth/signup", { name, email, password });
  if (res.status !== 201) throw new Error(`Signup failed for ${email}: ${res.status}`);
  return agent;
}

const isoFromToday = (days) => toISODate(addDays(today(), days));

module.exports = { request, startApp, stopApp, csrfToken, send, signup, isoFromToday, TINY_PNG };
