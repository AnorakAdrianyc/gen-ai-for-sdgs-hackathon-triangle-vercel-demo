import type { Map } from "maplibre-gl";

/** deck.gl 9.4 reads the MapLibre 5 transform location. MapLibre 6 moved it
 * into its camera; Painter still exposes the live rendered transform.
 * Keep this read-only bridge isolated until deck.gl supports v6 natively.
 */
export function bridgeDeckCamera(map: Map) {
  if ("transform" in map) return () => {};
  Object.defineProperty(map, "transform", {
    configurable: true,
    get: () => map.painter.transform,
  });
  return () => {
    Reflect.deleteProperty(map, "transform");
  };
}
