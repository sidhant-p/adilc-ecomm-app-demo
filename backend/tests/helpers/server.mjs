import { spawn } from "node:child_process";
import { randomUUID } from "node:crypto";
import { rm } from "node:fs/promises";
import net from "node:net";
import path from "node:path";

const HOST = "127.0.0.1";
const START_TIMEOUT_MS = 10000;

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export async function startServer(options = {}) {
  const { cleanDb = false, extraEnv = {} } = options;
  const jwtSecret = Object.prototype.hasOwnProperty.call(options, "jwtSecret")
    ? options.jwtSecret
    : "test-secret";
  const databaseUrl = Object.prototype.hasOwnProperty.call(options, "databaseUrl")
    ? options.databaseUrl
    : `sqlite:///./backend/ecomm-${randomUUID()}.db`;
  const repoRoot = process.cwd();
  const port = await getFreePort();
  const baseUrl = `http://${HOST}:${port}`;
  const dbPath = path.join(repoRoot, "backend", "ecomm.db");

  if (cleanDb) {
    await rm(dbPath, { force: true });
  }

  const env = {
    ...process.env,
    DATABASE_URL: databaseUrl,
    JWT_SECRET: jwtSecret,
    ...extraEnv,
  };

  if (jwtSecret === undefined) {
    delete env.JWT_SECRET;
  }

  const proc = spawn(
    "python",
    ["-m", "uvicorn", "backend.main:app", "--host", HOST, "--port", String(port), "--log-level", "warning"],
    { cwd: repoRoot, env, stdio: ["ignore", "pipe", "pipe"] }
  );

  let stderr = "";
  proc.stderr.on("data", (chunk) => {
    stderr += chunk.toString();
  });

  const started = await waitForServer(proc, baseUrl, stderr);
  if (!started.ok) {
    throw new Error(`Server failed to start: ${started.error}\n${stderr}`);
  }

  return { proc, baseUrl };
}

async function waitForServer(proc, baseUrl, initialStderr) {
  const start = Date.now();
  let stderr = initialStderr ?? "";

  proc.stderr.on("data", (chunk) => {
    stderr += chunk.toString();
  });

  while (Date.now() - start < START_TIMEOUT_MS) {
    if (proc.exitCode !== null) {
      return { ok: false, error: `process exited with ${proc.exitCode}` };
    }

    try {
      const response = await fetch(`${baseUrl}/docs`);
      if (response.ok) {
        return { ok: true };
      }
    } catch {
      // Keep waiting until timeout.
    }
    await wait(200);
  }

  return { ok: false, error: `timed out waiting for ${baseUrl}` };
}

export async function stopServer(server) {
  if (!server?.proc || server.proc.exitCode !== null) {
    return;
  }

  server.proc.kill("SIGTERM");
  await new Promise((resolve) => {
    server.proc.once("exit", resolve);
    setTimeout(() => {
      if (server.proc.exitCode === null) {
        server.proc.kill("SIGKILL");
      }
    }, 2000);
  });
}

async function getFreePort() {
  return new Promise((resolve, reject) => {
    const server = net.createServer();
    server.listen(0, HOST, () => {
      const address = server.address();
      if (!address || typeof address === "string") {
        reject(new Error("Could not determine free port"));
        return;
      }
      const { port } = address;
      server.close(() => resolve(port));
    });
    server.on("error", reject);
  });
}

export async function requestJson(server, method, route, body, headers = {}) {
  const response = await fetch(`${server.baseUrl}${route}`, {
    method,
    headers: {
      "content-type": "application/json",
      ...headers,
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });

  let json = null;
  const text = await response.text();
  const contentType = response.headers.get("content-type") ?? "";
  if (text && contentType.includes("application/json")) {
    json = JSON.parse(text);
  }

  return { status: response.status, json, text, headers: response.headers };
}
