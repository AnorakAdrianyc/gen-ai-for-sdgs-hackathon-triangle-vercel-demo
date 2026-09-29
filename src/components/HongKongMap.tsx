import { useEffect, useRef, useState } from "react";
import { Map, NavigationControl } from "maplibre-gl";
import { applyDarkAppearance } from "../map/appearance";
import { addBuildings } from "../map/buildings";
import { initialCamera, mapConfig } from "../map/config";

export function HongKongMap() {
  const container = useRef<HTMLDivElement>(null);
  const mapRef = useRef<Map | null>(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    if (!container.current) return;
    setLoading(true);
    setMessage(null);
    let map: Map;
    try {
      map = new Map({
        container: container.current,
        style: mapConfig.styleUrl,
        ...initialCamera,
        minZoom: 2,
        maxZoom: 20,
        maxPitch: 75,
        canvasContextAttributes: { antialias: true },
      });
    } catch {
      setLoading(false);
      setMessage(
        "The map could not start. Enable WebGL and hardware acceleration in your browser.",
      );
      return;
    }
    mapRef.current = map;
    map.addControl(
      new NavigationControl({ visualizePitch: true }),
      "top-right",
    );
    map.touchZoomRotate.enableRotation();
    map.touchPitch.enable();
    map
      .getCanvas()
      .setAttribute(
        "aria-label",
        "Interactive 3D map of Hong Kong. Use arrow keys to pan, plus and minus to zoom, and Shift with arrow keys to rotate or tilt.",
      );

    map.on("style.load", () => {
      applyDarkAppearance(map);
      if (!addBuildings(map)) {
        setMessage(
          "This map style has no configured building source. Check VITE_BUILDING_SOURCE in your environment.",
        );
      }
    });
    map.on("load", () => setLoading(false));
    map.on("error", () => {
      setLoading(false);
      setMessage(
        "Some map resources could not load. Check your connection and map configuration, then retry.",
      );
    });
    const timeout = window.setTimeout(() => {
      if (!map.loaded()) {
        setLoading(false);
        setMessage(
          "The map is taking longer than expected. Check your connection, then retry.",
        );
      }
    }, 20000);
    const observer = new ResizeObserver(() => map.resize());
    observer.observe(container.current);

    return () => {
      window.clearTimeout(timeout);
      observer.disconnect();
      mapRef.current = null;
      map.remove();
    };
  }, [attempt]);

  const resetCamera = () => {
    const reducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    mapRef.current?.easeTo({
      ...initialCamera,
      duration: reducedMotion ? 0 : 1000,
    });
  };

  return (
    <main className="relative h-dvh w-full overflow-hidden bg-[#101719] text-slate-100">
      <div ref={container} className="absolute inset-0" />
      <div className="pointer-events-none absolute left-5 top-5 max-w-[calc(100%-100px)] rounded-xl border border-white/10 bg-[#101719]/90 px-5 py-4 shadow-xl backdrop-blur-md sm:left-7 sm:top-7">
        <p className="mb-1 text-[10px] font-medium uppercase tracking-[0.24em] text-teal-300">
          Victoria Harbour
        </p>
        <h1 className="text-xl font-medium tracking-tight">
          Hong Kong{" "}
          <span
            className="ml-2 text-base font-normal text-slate-400"
            lang="zh-Hant"
          >
            香港
          </span>
        </h1>
      </div>
      <button
        type="button"
        onClick={resetCamera}
        disabled={loading}
        title="Reset to the Victoria Harbour view"
        className="absolute right-[10px] top-[116px] flex h-10 w-10 items-center justify-center rounded-md border border-white/15 bg-[#182126] text-slate-100 shadow-lg transition hover:bg-slate-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-300 disabled:opacity-40"
        aria-label="Reset camera"
      >
        <svg
          aria-hidden="true"
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M3 10a9 9 0 1 1 2.7 8.4M3 4v6h6" />
        </svg>
      </button>
      <p className="pointer-events-none absolute bottom-9 left-5 hidden rounded-md bg-[#101719]/85 px-3 py-2 text-[11px] text-slate-300 sm:block">
        Drag to explore <span className="mx-2 text-slate-600">/</span> Scroll to
        zoom <span className="mx-2 text-slate-600">/</span> Right-drag to rotate
        & tilt
      </p>
      {loading && (
        <p
          role="status"
          className="absolute bottom-16 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-lg border border-white/10 bg-[#101719]/95 px-4 py-3 text-sm text-slate-300"
        >
          Loading Hong Kong…
        </p>
      )}
      {message && (
        <div
          role="alert"
          className="absolute bottom-16 left-1/2 w-[calc(100%-40px)] max-w-md -translate-x-1/2 rounded-xl border border-amber-300/25 bg-[#182126] p-4 text-sm text-slate-200 shadow-xl"
        >
          <p>{message}</p>
          <button
            type="button"
            onClick={() => setAttempt((value) => value + 1)}
            className="mt-3 rounded bg-slate-700 px-3 py-1.5 font-medium hover:bg-slate-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-teal-300"
          >
            Retry map
          </button>
        </div>
      )}
    </main>
  );
}
