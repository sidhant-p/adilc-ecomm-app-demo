import test from "node:test";
import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { rm } from "node:fs/promises";
import { startServer, stopServer, requestJson } from "./helpers/server.mjs";

const execFileAsync = promisify(execFile);
const DB_PATH = "backend/test-register.db";
const DB_URL = `sqlite:///./${DB_PATH}`;
const registerPayload = {
  full_name: "Test User",
  email: "test@example.com",
  password: "S3curePass!",
};

test("register endpoint supports create/duplicate and stores only hashed password", async () => {
  await rm(DB_PATH, { force: true });
  const server = await startServer({ databaseUrl: DB_URL });

  try {
    const register = await requestJson(server, "POST", "/auth/register", registerPayload);
    assert.equal(register.status, 201);
    assert.equal(typeof register.json?.id, "number");
    assert.equal(register.json?.email, registerPayload.email);
    assert.equal(register.json?.full_name, registerPayload.full_name);

    const duplicate = await requestJson(server, "POST", "/auth/register", registerPayload);
    assert.equal(duplicate.status, 409);
    assert.equal(typeof duplicate.json?.detail, "string");

    const query = [
      "import sqlite3",
      "conn=sqlite3.connect(r'backend/test-register.db')",
      "row=conn.execute(\"select hashed_password from users where email=?\", ('test@example.com',)).fetchone()",
      "print(row[0] if row else '')",
      "conn.close()",
    ].join(";");
    const { stdout } = await execFileAsync("python", ["-c", query], { cwd: process.cwd() });
    const storedHash = stdout.trim();
    assert.ok(storedHash.length > 0);
    assert.notEqual(storedHash, registerPayload.password);
  } finally {
    await stopServer(server);
    await rm(DB_PATH, { force: true });
  }
});
