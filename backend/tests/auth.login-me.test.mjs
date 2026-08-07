import test from "node:test";
import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { rm } from "node:fs/promises";
import { startServer, stopServer, requestJson } from "./helpers/server.mjs";

const execFileAsync = promisify(execFile);
const DB_PATH = "backend/test-login.db";
const DB_URL = `sqlite:///./${DB_PATH}`;
const userPayload = {
  full_name: "Login User",
  email: "login@example.com",
  password: "S3curePass!",
};

test("login and /me enforce JWT auth behavior", async () => {
  await rm(DB_PATH, { force: true });
  const server = await startServer({ databaseUrl: DB_URL, jwtSecret: "test-secret" });

  try {
    await requestJson(server, "POST", "/auth/register", userPayload);

    const validLogin = await requestJson(server, "POST", "/auth/login", {
      email: userPayload.email,
      password: userPayload.password,
    });
    assert.equal(validLogin.status, 200);
    assert.equal(validLogin.json?.token_type, "bearer");
    assert.ok(typeof validLogin.json?.access_token === "string");

    const invalidPassword = await requestJson(server, "POST", "/auth/login", {
      email: userPayload.email,
      password: "WrongPass!",
    });
    assert.equal(invalidPassword.status, 401);
    assert.equal(typeof invalidPassword.json?.detail, "string");

    const expiredTokenScript = [
      "from datetime import datetime, timedelta, timezone",
      "from jose import jwt",
      "token = jwt.encode({'sub':'login@example.com','exp': datetime.now(timezone.utc)-timedelta(minutes=1)}, 'test-secret', algorithm='HS256')",
      "print(token)",
    ].join(";");
    const expiredTokenOut = await execFileAsync("python", ["-c", expiredTokenScript], { cwd: process.cwd() });
    const expiredToken = expiredTokenOut.stdout.trim();

    const expiredResponse = await requestJson(
      server,
      "GET",
      "/auth/me",
      undefined,
      { authorization: `Bearer ${expiredToken}` }
    );
    assert.equal(expiredResponse.status, 401);
    assert.equal(typeof expiredResponse.json?.detail, "string");

    const meResponse = await requestJson(
      server,
      "GET",
      "/auth/me",
      undefined,
      { authorization: `Bearer ${validLogin.json.access_token}` }
    );
    assert.equal(meResponse.status, 200);
    assert.equal(meResponse.json?.email, userPayload.email);
    assert.equal(meResponse.json?.full_name, userPayload.full_name);

    const parts = validLogin.json.access_token.split(".");
    assert.equal(parts.length, 3);

    const header = JSON.parse(Buffer.from(parts[0], "base64url").toString("utf8"));
    const payload = JSON.parse(Buffer.from(parts[1], "base64url").toString("utf8"));
    const now = Math.floor(Date.now() / 1000);
    assert.equal(header.alg, "HS256");
    assert.ok(payload.exp > now);
    assert.ok(payload.exp <= now + 30 * 60);
  } finally {
    await stopServer(server);
    await rm(DB_PATH, { force: true });
  }
});
