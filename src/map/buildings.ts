import type { ExpressionSpecification, Map } from "maplibre-gl";
import { mapConfig } from "./config";

export function addBuildings(map: Map): boolean {
  if (!map.getSource(mapConfig.buildingSource)) return false;
  if (map.getLayer("hk-buildings-3d")) return true;

  const height: ExpressionSpecification = [
    "max",
    0,
    ["to-number", ["get", mapConfig.heightProperty], 0],
  ];
  const base: ExpressionSpecification = [
    "min",
    height,
    ["max", 0, ["to-number", ["get", mapConfig.baseProperty], 0]],
  ];
  const labelLayer = map
    .getStyle()
    .layers.find(
      (layer) => layer.type === "symbol" && layer.layout?.["text-field"],
    );

  // Heights are meters from the provider; missing heights stay flat, never randomized.
  map.addLayer(
    {
      id: "hk-buildings-3d",
      source: mapConfig.buildingSource,
      "source-layer": mapConfig.buildingSourceLayer,
      type: "fill-extrusion",
      minzoom: 13,
      filter: [
        "all",
        [">", height, 0],
        ["!=", ["to-string", ["get", "hide_3d"]], "true"],
      ],
      paint: {
        "fill-extrusion-color": [
          "interpolate",
          ["linear"],
          height,
          0,
          "#283841",
          80,
          "#48616b",
          250,
          "#78979b",
          450,
          "#a0b8b5",
        ],
        "fill-extrusion-height": height,
        "fill-extrusion-base": base,
        "fill-extrusion-opacity": 0.95,
        "fill-extrusion-vertical-gradient": true,
      },
    },
    labelLayer?.id,
  );
  map.setLight({
    anchor: "viewport",
    color: "#d6eceb",
    intensity: 0.45,
    position: [1.5, 210, 45],
  });
  return true;
}
