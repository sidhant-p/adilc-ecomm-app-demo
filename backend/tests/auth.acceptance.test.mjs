import test from "node:test";
import assert from "node:assert/strict";
import { rm } from "node:fs/promises";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { startServer, stopServer, requestJson } from "./helpers/server.mjs";

const execFileAsync = promisify(execFile);
const DB_PATH = "backend/test-acceptance.db";
const DB_URL = `sqlite:///./${DB_PATH}`;
const userPayload = {
  full_name: "Acceptance User",
  email: "acceptance@example.com",
  password: "S3curePass!",
};

test("acceptance flow register->login->me->logout with expected errors", async () => {
  await rm(DB_PATH, { force: true });
  const server = await startServer({ databaseUrl: DB_URL, jwtSecret: "test-secret" });

  try {
    const register = await requestJson(server, "POST", "/auth/register", userPayload);
    assert.equal(register.status, 201);

    const duplicate = await requestJson(server, "POST", "/auth/register", userPayload);
    assert.equal(duplicate.status, 409);
    assert.equal(typeof duplicate.json?.detail, "string");

    const login = await requestJson(server, "POST", "/auth/login", {
      email: userPayload.email,
      password: userPayload.password,
    });
    assert.equal(login.status, 200);
    assert.ok(typeof login.json?.access_token === "string");

    const me = await requestJson(server, "GET", "/auth/me", undefined, {
      authorization: `Bearer ${login.json.access_token}`,
    });
    assert.equal(me.status, 200);
    assert.equal(me.json?.email, userPayload.email);

    const invalidToken = await requestJson(server, "GET", "/auth/me", undefined, {
      authorization: "Bearer definitely-invalid-token",
    });
    assert.equal(invalidToken.status, 401);
    assert.equal(typeof invalidToken.json?.detail, "string");

    const expiredTokenScript = [
      "from datetime import datetime, timedelta, timezone",
      "from jose import jwt",
      "token = jwt.encode({'sub':'acceptance@example.com','exp': datetime.now(timezone.utc)-timedelta(minutes=1)}, 'test-secret', algorithm='HS256')",
      "print(token)",
    ].join(";");
    const expiredTokenOut = await execFileAsync("python", ["-c", expiredTokenScript], { cwd: process.cwd() });
    const expiredToken = expiredTokenOut.stdout.trim();

    const expiredTokenResponse = await requestJson(server, "GET", "/auth/me", undefined, {
      authorization: `Bearer ${expiredToken}`,
    });
    assert.equal(expiredTokenResponse.status, 401);
    assert.equal(typeof expiredTokenResponse.json?.detail, "string");

    const logout = await requestJson(server, "POST", "/auth/logout");
    assert.equal(logout.status, 200);
    assert.deepEqual(logout.json, { detail: "Logged out successfully" });
  } finally {
    await stopServer(server);
    await rm(DB_PATH, { force: true });
  }
});
