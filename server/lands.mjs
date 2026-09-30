import { Readable } from "node:stream";
import { TileCache } from "./tile-cache.mjs";

export function identifyUpstreamUrl(x, y) {
  if (
    !Number.isFinite(x) ||
    !Number.isFinite(y) ||
    x < 780000 ||
    x > 880000 ||
    y < 790000 ||
    y > 860000
  ) {
    return null;
  }
  const upstream = new URL("https://www.map.gov.hk/gs/api/v1.0.0/identify");
  upstream.searchParams.set("x", String(x));
  upstream.searchParams.set("y", String(y));
  upstream.searchParams.set("lang", "zh");
  return upstream;
}

export async function identifyResponse(request) {
  const url = new URL(request.url);
  const upstream = identifyUpstreamUrl(
    Number(url.searchParams.get("x")),
    Number(url.searchParams.get("y")),
  );
  if (!upstream) {
    return new Response("Invalid HK80 coordinates", {
      status: 400,
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    });
  }
  try {
    const response = await fetch(upstream, {
      signal: AbortSignal.timeout(20000),
    });
    if (!response.ok) {
      return new Response(
        `Lands Department service returned ${response.status}`,
        {
          status: response.status,
          headers: { "Content-Type": "text/plain; charset=utf-8" },
        },
      );
    }
    return new Response(response.body, {
      status: 200,
      headers: {
        "Content-Type":
          response.headers.get("content-type") ||
          "application/json; charset=utf-8",
        "Cache-Control": "public, max-age=60",
      },
    });
  } catch {
    return new Response("Lands Department service unavailable or timed out", {
      status: 502,
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    });
  }
}

export function createLandsMiddleware(env) {
  const cache = new TileCache();
  return async (req, res, next) => {
    const url = new URL(req.url || "/", "http://localhost");
    if (!url.pathname.startsWith("/api/lands/")) return next();
    if (req.method !== "GET") {
      res.writeHead(405).end();
      return;
    }
    let upstream;
    let cacheKey;
    if (url.pathname === "/api/lands/identify") {
      upstream = identifyUpstreamUrl(
        Number(url.searchParams.get("x")),
        Number(url.searchParams.get("y")),
      );
      if (!upstream) {
        res.writeHead(400).end("Invalid HK80 coordinates");
        return;
      }
    } else if (url.pathname.startsWith("/api/lands/3d/")) {
      const path = url.pathname.slice("/api/lands/3d/".length);
      if (
        !/^3dsd\/WGS84\/(building|infrastructure)\//.test(path) ||
        /%2e|%2f|%5c|\\/i.test(path)
      ) {
        res.writeHead(400).end();
        return;
      }
      if (!env.LANDSD_API_KEY) {
        res.writeHead(503).end("LANDSD_API_KEY is not configured");
        return;
      }
      upstream = new URL(path, "https://data.map.gov.hk/api/3d-data/");
      upstream.searchParams.set("key", env.LANDSD_API_KEY);
      const version = url.searchParams.get("v") || "";
      if (!/^[a-zA-Z0-9._-]{0,64}$/.test(version)) {
        res.writeHead(400).end("Invalid version");
        return;
      }
      if (version) upstream.searchParams.set("v", version);
      cacheKey = `${path}?v=${version}`;
      const cached = cache.get(cacheKey);
      if (cached) {
        res
          .writeHead(200, {
            "Content-Type": cached.contentType,
            "Cache-Control": "public, max-age=3600",
            "X-Lands-Cache": "HIT",
          })
          .end(cached.body);
        return;
      }
    } else {
      res.writeHead(404).end();
      return;
    }
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 45000);
    const abort = () => {
      if (!res.writableEnded) controller.abort();
    };
    res.on("close", abort);
    try {
      const response = await fetch(upstream, { signal: controller.signal });
      if (!response.ok) {
        res
          .writeHead(response.status, {
            "Content-Type": "text/plain; charset=utf-8",
          })
          .end(`Lands Department service returned ${response.status}`);
        return;
      }
      const contentType =
        response.headers.get("content-type") || "application/octet-stream";
      res.writeHead(200, {
        "X-Lands-Cache": "MISS",
        "Content-Type": contentType,
        "Cache-Control": url.pathname.includes("/3d/")
          ? "public, max-age=3600"
          : "public, max-age=60",
      });
      if (response.body) {
        const body = Readable.fromWeb(response.body);
        if (cacheKey) {
          let chunks = [];
          let size = 0;
          body.on("data", (chunk) => {
            size += chunk.length;
            if (size <= cache.maxEntryBytes) chunks.push(chunk);
            else chunks = [];
          });
          body.once("end", () => {
            if (size <= cache.maxEntryBytes && !controller.signal.aborted)
              cache.set(cacheKey, Buffer.concat(chunks), contentType);
          });
        }
        body.on("error", () => res.destroy());
        body.pipe(res);
        await new Promise((resolve) => {
          res.once("finish", resolve);
          res.once("close", resolve);
        });
      } else res.end();
    } catch {
      if (!res.headersSent)
        res
          .writeHead(502, { "Content-Type": "text/plain; charset=utf-8" })
          .end("Lands Department service unavailable or timed out");
      else res.destroy();
    } finally {
      clearTimeout(timer);
      res.off("close", abort);
    }
  };
}
