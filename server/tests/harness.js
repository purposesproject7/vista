// Shared setup for feature tests: a throwaway database, the real server
// started against it, and logged-in API calls.
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";

export const PASSWORD = "feature-test-pass";
export const SUDO_ID = "SUDO_FEATURE_TEST";

const URI = process.env.TEST_MONGO_URI;
let server;
let api;
const tokens = {};

/** Connect to and wipe the test database. */
export async function openDb() {
  assert.ok(URI, "Set TEST_MONGO_URI to a throwaway database");
  const dbName = new URL(URI.replace(/^mongodb(\+srv)?:/, "http:")).pathname.slice(1);
  // Strict on purpose: a plain "test" database is what Atlas URIs without a
  // name default to, i.e. likely real data.
  assert.match(dbName, /_feature_test$/, `TEST_MONGO_URI database "${dbName}" must end in "_feature_test" (it gets dropped)`);
  await mongoose.connect(URI);
  await mongoose.connection.dropDatabase();
}

export const hashedPassword = () => bcrypt.hash(PASSWORD, 10);

/** Start the real server on `port` and log each email in, keyed by its local part. */
export async function startServer(port, emails) {
  server = spawn(process.execPath, ["index.js"], {
    cwd: fileURLToPath(new URL("..", import.meta.url)),
    env: {
      ...process.env, MONGO_URI: URI, PORT: String(port), HOST: "127.0.0.1", NODE_ENV: "test",
      ADMIN_EMPLOYEE_ID: SUDO_ID,
      // A model that cannot load: accepting a title skips the (non-fatal)
      // embedding step instead of downloading a model.
      EMBEDDING_MODEL: "none/none",
    },
    stdio: "ignore",
  });
  for (let i = 0; ; i++) {
    try { if ((await fetch(`http://127.0.0.1:${port}/health`)).ok) break; } catch {}
    assert.ok(i < 60, "server did not start");
    await new Promise((r) => setTimeout(r, 500));
  }
  api = `http://127.0.0.1:${port}/api`;
  for (const email of emails) {
    const res = await fetch(`${api}/auth/login`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ emailId: email, password: PASSWORD }),
    });
    const who = email.split("@")[0];
    tokens[who] = (await res.json()).token;
    assert.ok(tokens[who], `${who} could not log in`);
  }
}

export async function call(who, method, path, body) {
  const res = await fetch(api + path, {
    method,
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${tokens[who]}` },
    body: body && JSON.stringify(body),
  });
  return { status: res.status, body: await res.json() };
}

export async function shutdown() {
  server?.kill();
  if (mongoose.connection.readyState === 1) {
    await mongoose.connection.dropDatabase();
    await mongoose.disconnect();
  }
}
