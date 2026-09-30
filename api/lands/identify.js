import { identifyUpstreamUrl } from "../../server/lands.mjs";

export async function GET(request) {
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
