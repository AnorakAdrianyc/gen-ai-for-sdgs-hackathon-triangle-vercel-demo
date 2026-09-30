import { useEffect, useRef, useState } from "react";
import {
  Map,
  NavigationControl,
  Marker,
  type MapMouseEvent,
} from "maplibre-gl";
import { applyDarkAppearance } from "../map/appearance";
import { addBuildings } from "../map/buildings";
import { initialCamera, mapConfig } from "../map/config";

import { mountOfficialModels, type ModelMode } from "../map/officialModels";
import { identify } from "../services/identify";
import { IdentifyPanel, type IdentifyState } from "./IdentifyPanel";

export function HongKongMap() {
  const container = useRef<HTMLDivElement>(null);
  const mapRef = useRef<Map | null>(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);

  const [ready, setReady] = useState(false);
  const [mode, setMode] = useState<ModelMode>("basic");
  const [modelStatus, setModelStatus] = useState("");
  const [modelAttempt, setModelAttempt] = useState(0);
  const [identifyEnabled, setIdentifyEnabled] = useState(false);
  const [selection, setSelection] = useState<IdentifyState | null>(null);
  const [queryAttempt, setQueryAttempt] = useState(0);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !ready) return;
    return mountOfficialModels(map, mode, setModelStatus);
  }, [ready, mode, modelAttempt]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !ready || !identifyEnabled) return;
    map.getCanvas().style.cursor = "crosshair";
    const click = (e: MapMouseEvent) =>
      setSelection({
        coordinate: [e.lngLat.lng, e.lngLat.lat],
        loading: true,
        facilities: [],
      });
    map.on("click", click);
    return () => {
      map.off("click", click);
      map.getCanvas().style.cursor = "";
    };
  }, [ready, identifyEnabled]);

  const longitude = selection?.coordinate[0];
  const latitude = selection?.coordinate[1];
  useEffect(() => {
    if (
      longitude === undefined ||
      latitude === undefined ||
      !mapRef.current ||
      !ready
    )
      return;
    const controller = new AbortController();
    const marker = new Marker({ color: "#5eead4" })
      .setLngLat([longitude, latitude])
      .addTo(mapRef.current);
    setSelection({
      coordinate: [longitude, latitude],
      loading: true,
      facilities: [],
    });
    void identify(longitude, latitude, controller.signal)
      .then((facilities) => {
        if (!controller.signal.aborted)
          setSelection({
            coordinate: [longitude, latitude],
            loading: false,
            facilities,
          });
      })
      .catch((error) => {
        if (!controller.signal.aborted)
          setSelection({
            coordinate: [longitude, latitude],
            loading: false,
            facilities: [],
            error:
              error instanceof Error ? error.message : "查詢失敗，請重試。",
          });
      });
    return () => {
      controller.abort();
      marker.remove();
    };
  }, [longitude, latitude, queryAttempt, ready]);

  useEffect(() => {
    if (!container.current) return;
    setLoading(true);
    setReady(false);
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
        pixelRatio: Math.min(window.devicePixelRatio, 2),
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
    map.on("load", () => {
      setLoading(false);
      setReady(true);
    });
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
      setReady(false);
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
      <div className="pointer-events-none absolute z-10 left-5 top-5 max-w-[calc(100%-100px)] rounded-xl border border-white/10 bg-[#101719]/90 px-5 py-4 shadow-xl backdrop-blur-md sm:left-7 sm:top-7">
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
      <section
        aria-label="地圖模型與查詢"
        className="absolute z-10 left-5 top-32 max-w-[calc(100%-90px)] rounded-xl border border-white/10 bg-[#101719]/95 p-3 shadow-xl sm:left-7"
      >
        <label
          htmlFor="model-mode"
          className="mb-2 block text-xs text-slate-400"
        >
          三維模型
        </label>
        <select
          id="model-mode"
          value={mode}
          onChange={(e) => setMode(e.target.value as ModelMode)}
          className="w-full rounded border border-white/15 bg-[#182126] px-3 py-2 text-sm"
        >
          <option value="basic">基本建築 · OpenStreetMap</option>
          <option value="spatial">3D Spatial Data · 建築與基建</option>
        </select>
        <p role="status" className="mt-2 max-w-64 text-xs text-slate-400">
          {modelStatus}
        </p>
        {mode !== "basic" && (
          <button
            onClick={() => setModelAttempt((n) => n + 1)}
            className="mt-2 text-xs text-teal-300 hover:underline"
          >
            重新載入模型
          </button>
        )}
        <label className="mt-3 flex cursor-pointer items-center gap-2 border-t border-white/10 pt-3 text-sm">
          <input
            type="checkbox"
            checked={identifyEnabled}
            onChange={(e) => {
              setIdentifyEnabled(e.target.checked);
              if (!e.target.checked) setSelection(null);
            }}
            className="accent-teal-300"
          />
          Identify · 點選查詢設施
        </label>
        {identifyEnabled && (
          <p className="mt-2 text-xs text-slate-400">
            點選地圖上的建築或設施位置
          </p>
        )}
      </section>
      {selection && (
        <IdentifyPanel
          state={selection}
          onClose={() => setSelection(null)}
          onRetry={() => setQueryAttempt((n) => n + 1)}
        />
      )}
      <a
        href="https://www.landsd.gov.hk/"
        target="_blank"
        rel="noreferrer"
        className="absolute z-10 bottom-9 right-3 rounded bg-[#101719]/90 px-3 py-2 text-[10px] text-slate-300"
      >
        © 地政總署 · Map from Lands Department
      </a>
      <button
        type="button"
        onClick={resetCamera}
        disabled={loading}
        title="Reset to the Victoria Harbour view"
        className="absolute z-10 right-[10px] top-[116px] flex h-10 w-10 items-center justify-center rounded-md border border-white/15 bg-[#182126] text-slate-100 shadow-lg transition hover:bg-slate-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-300 disabled:opacity-40"
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
      <p className="pointer-events-none absolute z-10 bottom-9 left-5 hidden rounded-md bg-[#101719]/85 px-3 py-2 text-[11px] text-slate-300 sm:block">
        Drag to explore <span className="mx-2 text-slate-600">/</span> Scroll to
        zoom <span className="mx-2 text-slate-600">/</span> Right-drag to rotate
        & tilt
      </p>
      {loading && (
        <p
          role="status"
          className="absolute z-10 bottom-16 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-lg border border-white/10 bg-[#101719]/95 px-4 py-3 text-sm text-slate-300"
        >
          Loading Hong Kong…
        </p>
      )}
      {message && (
        <div
          role="alert"
          className="absolute z-10 bottom-16 left-1/2 w-[calc(100%-40px)] max-w-md -translate-x-1/2 rounded-xl border border-amber-300/25 bg-[#182126] p-4 text-sm text-slate-200 shadow-xl"
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
