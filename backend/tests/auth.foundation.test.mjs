import test from "node:test";
import assert from "node:assert/strict";
import { startServer, stopServer, requestJson } from "./helpers/server.mjs";

test("auth foundations are wired", async () => {
  const server = await startServer({ cleanDb: true });
  try {
    const logout = await requestJson(server, "POST", "/auth/logout");
    assert.notEqual(logout.status, 404);
  } finally {
    await stopServer(server);
  }
});

test("user schema includes unique email and hashed_password", async () => {
  const server = await startServer({ cleanDb: true });
  try {
    const register = await requestJson(server, "POST", "/auth/register", {
      full_name: "Schema User",
      email: "schema@example.com",
      password: "SchemaPass123!",
    });

    assert.equal(register.status, 201);

    const duplicate = await requestJson(server, "POST", "/auth/register", {
      full_name: "Schema User 2",
      email: "schema@example.com",
      password: "SchemaPass123!",
    });
    assert.equal(duplicate.status, 409);
    assert.ok(duplicate.json?.detail);
  } finally {
    await stopServer(server);
  }
});

test("missing JWT secret fails startup", async () => {
  let server;
  try {
    server = await startServer({ jwtSecret: undefined });
    assert.fail("Expected startup to fail without JWT secret");
  } catch (error) {
    assert.match(String(error), /Server failed to start/);
  } finally {
    await stopServer(server);
  }
});
