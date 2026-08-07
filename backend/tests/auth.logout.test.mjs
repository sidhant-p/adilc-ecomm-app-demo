import test from "node:test";
import assert from "node:assert/strict";
import { startServer, stopServer, requestJson } from "./helpers/server.mjs";

test("logout returns explicit success payload", async () => {
  const server = await startServer();
  try {
    const response = await requestJson(server, "POST", "/auth/logout");
    assert.equal(response.status, 200);
    assert.deepEqual(response.json, { detail: "Logged out successfully" });
  } finally {
    await stopServer(server);
  }
});
