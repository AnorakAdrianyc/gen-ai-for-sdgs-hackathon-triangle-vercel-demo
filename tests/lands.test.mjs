import test from "node:test";
import assert from "node:assert/strict";
import { createServer } from "node:http";
import { once } from "node:events";
import { createLandsMiddleware, identifyUpstreamUrl } from "../server/lands.mjs";
import { GET as identifyGet } from "../api/lands/identify.js";

test("identify route accepts the reported Kowloon point and rejects a bad one", async () => {
  assert.equal(identifyUpstreamUrl(0, 0), null);
  const upstream = identifyUpstreamUrl(837664.169, 820990.98);
  assert.equal(upstream.hostname, "www.map.gov.hk");
  assert.equal(upstream.searchParams.get("x"), "837664.169");
  assert.equal(upstream.searchParams.get("y"), "820990.98");

  const originalFetch = globalThis.fetch;
  let seen = "";
  globalThis.fetch = async (url) => {
    seen = String(url);
    return new Response(JSON.stringify({ results: [] }), {
      status: 200,
      headers: { "content-type": "application/json" },
    });
  };
  try {
    const response = await identifyGet(
      new Request(
        "https://example.test/api/lands/identify?x=837664.169&y=820990.980",
      ),
    );
    assert.equal(response.status, 200);
    assert.match(seen, /\/gs\/api\/v1\.0\.0\/identify\?/);
    assert.equal(await response.json().then((body) => Array.isArray(body.results)), true);
    const rejected = await identifyGet(
      new Request("https://example.test/api/lands/identify?x=1&y=2"),
    );
    assert.equal(rejected.status, 400);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("proxy rejects invalid coordinates, unlisted paths, writes and missing keys", async () => {
  const middleware = createLandsMiddleware({});
  const server = createServer(
    (req, res) => void middleware(req, res, () => res.writeHead(404).end()),
  );
  server.listen(0, "127.0.0.1");
  await once(server, "listening");
  const base = `http://127.0.0.1:${server.address().port}`;
  try {
    for (const [path, status, method] of [
      ["/api/lands/identify", 400, "GET"],
      ["/api/lands/identify?x=NaN&y=817198", 400, "GET"],
      ["/api/lands/identify?x=0&y=817198", 400, "GET"],
      ["/api/lands/3d/unknown/tileset.json", 400, "GET"],
      ["/api/lands/3d/3dtiles/f2/tileset.json", 400, "GET"],
      ["/api/lands/3d/3dsd/WGS84/building/%2fsecret", 400, "GET"],
      ["/api/lands/3d/3dsd/WGS84/building/tileset.json", 503, "GET"],
      ["/api/lands/identify?x=835665&y=817198", 405, "POST"],
    ]) {
      const response = await fetch(base + path, { method });
      assert.equal(response.status, status, path);
      await response.text();
    }
  } finally {
    server.closeAllConnections();
    await new Promise((resolve) => server.close(resolve));
  }
});

test("proxy caches complete tiles, preserves versions, and never exposes the key", async (t) => {
  const originalFetch = globalThis.fetch;
  let upstreamCalls = 0;
  t.mock.method(globalThis, "fetch", async (url, options) => {
    const target = new URL(url);
    if (target.hostname !== "data.map.gov.hk")
      return originalFetch(url, options);
    upstreamCalls++;
    assert.equal(target.searchParams.get("key"), "test-secret");
    assert.equal(target.searchParams.get("v"), "1.2.3");
    return new Response('{"root":{}}', {
      headers: { "content-type": "application/json" },
    });
  });
  const middleware = createLandsMiddleware({ LANDSD_API_KEY: "test-secret" });
  const server = createServer(
    (req, res) => void middleware(req, res, () => res.writeHead(404).end()),
  );
  server.listen(0, "127.0.0.1");
  await once(server, "listening");
  try {
    const url = `http://127.0.0.1:${server.address().port}/api/lands/3d/3dsd/WGS84/building/tileset.json?v=1.2.3`;
    for (const expected of ["MISS", "HIT"]) {
      const response = await originalFetch(url);
      assert.equal(response.headers.get("x-lands-cache"), expected);
      assert.equal((await response.text()).includes("test-secret"), false);
    }
    assert.equal(upstreamCalls, 1);
  } finally {
    server.closeAllConnections();
    await new Promise((resolve) => server.close(resolve));
  }
});
