import type { Map } from "maplibre-gl";

const sourceId = "hk-terrain-dem";
const shadeId = "hk-terrain-shading";

/** Keep absolute model elevations: never add terrain elevation to 3D Tiles. */
export function enableTerrain(map: Map) {
  if (!map.getSource(sourceId)) {
    map.addSource(sourceId, {
      type: "raster-dem",
      tiles: [
        import.meta.env.VITE_TERRAIN_URL ||
          "https://s3.amazonaws.com/elevation-tiles-prod/terrarium/{z}/{x}/{y}.png",
      ],
      tileSize: 256,
      encoding: "terrarium",
      maxzoom: 14,
      attribution:
        '<a href="https://registry.opendata.aws/terrain-tiles/">Terrain: Mapzen / USGS / NOAA</a>',
    });
    const firstLabel = map
      .getStyle()
      .layers.find((layer) => layer.type === "symbol")?.id;
    map.addLayer(
      {
        id: shadeId,
        type: "hillshade",
        source: sourceId,
        paint: {
          "hillshade-exaggeration": 0.35,
          "hillshade-shadow-color": "#071215",
          "hillshade-highlight-color": "#71847e",
          "hillshade-accent-color": "#253f37",
        },
      },
      firstLabel,
    );
  }
  map.setLayoutProperty(shadeId, "visibility", "visible");
  map.setTerrain({ source: sourceId, exaggeration: 1 });
}

export function disableTerrain(map: Map) {
  if (!map.getStyle()) return;
  map.setTerrain(null);
  if (map.getLayer(shadeId))
    map.setLayoutProperty(shadeId, "visibility", "none");
}
