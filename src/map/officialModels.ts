import { AmbientLight, DirectionalLight, LightingEffect } from "@deck.gl/core";
import { MapboxOverlay } from "@deck.gl/mapbox";
import { Tile3DLayer } from "@deck.gl/geo-layers";
import { Tiles3DLoader } from "@loaders.gl/3d-tiles";
import type { Map } from "maplibre-gl";

export type ModelMode = "basic" | "spatial" | "visual";
export function mountOfficialModels(
  map: Map,
  mode: ModelMode,
  onStatus: (message: string) => void,
) {
  let disposed = false;
  let hasContent = false;
  let failed = false;
  const paths =
    mode === "spatial"
      ? ["3dsd/WGS84/building", "3dsd/WGS84/infrastructure"]
      : ["3dtiles/f2"];
  const setBasic = (visible: boolean) => {
    if (map.getLayer("hk-buildings-3d"))
      map.setLayoutProperty(
        "hk-buildings-3d",
        "visibility",
        visible ? "visible" : "none",
      );
  };
  if (mode === "basic") {
    setBasic(true);
    onStatus("基本建築圖層");
    return () => {};
  }
  onStatus("正在載入地政總署 3D 模型…");
  setBasic(false);
  const timer = window.setTimeout(() => {
    if (!disposed && !hasContent)
      onStatus("模型仍在載入，請靠近陸地放大；亦可切回基本建築。");
  }, 30000);
  const error = () => {
    if (!disposed) {
      failed = true;
      onStatus(
        "部分模型無法載入，請重試或切回基本建築；檢查伺服器 key 及連線。",
      );
    }
    return true;
  };
  const overlay = new MapboxOverlay({
    interleaved: false,
    effects: [
      new LightingEffect({
        ambient: new AmbientLight({ color: [255, 255, 255], intensity: 2 }),
        sun: new DirectionalLight({
          color: [255, 255, 255],
          intensity: 3,
          direction: [-1, -2, -3],
        }),
      }),
    ],
    useDevicePixels: Math.min(window.devicePixelRatio, 1.5),
    onError: error,
    layers: paths.map(
      (path) =>
        new Tile3DLayer({
          id: `lands-${path}`,
          data: `/api/lands/3d/${path}/tileset.json`,
          loaders: [Tiles3DLoader],
          loadOptions: {
            basis: {
              workerUrl: new URL("/codecs/basis-worker.js", location.origin)
                .href,
              format: "auto",
            },
            modules: Object.fromEntries(
              [
                "basis_encoder.js",
                "basis_encoder.wasm",
                "basis_transcoder.js",
                "basis_transcoder.wasm",
              ].map((file) => [
                file,
                new URL(`/codecs/${file}`, location.origin).href,
              ]),
            ),
            "3d-tiles": { loadGLTF: true },
            tileset: {
              maximumScreenSpaceError: mode === "visual" ? 64 : 32,
              maximumMemoryUsage: 96,
              maxRequests: 2,
              throttleRequests: true,
            },
          },
          pickable: false,

          onTileLoad: (tile) => {
            if (!tile.content?.gltf && !tile.content?.positions) return;
            if (!disposed && !hasContent) {
              hasContent = true;
              clearTimeout(timer);
              if (!failed) onStatus("模型已載入 · 移動地圖以載入其他區域");
            }
          },
          onTileError: error,
          onError: error,
        }),
    ),
  });
  map.addControl(overlay);
  return () => {
    disposed = true;
    clearTimeout(timer);
    if (map.hasControl(overlay)) map.removeControl(overlay);
    setBasic(true);
  };
}
