import type { GeoJSONSource, Map } from "maplibre-gl";

export const DEMO_RISK_COLORS = {
  medium: "#ffe14a",
  high: "#ff3b30",
} as const;

type DemoRisk = keyof typeof DEMO_RISK_COLORS;

interface DemoBuilding {
  id: string;
  name: string;
  risk: DemoRisk;
  lng: number;
  lat: number;
  floors: number;
}

// Placed in the opening harbour view so the proof of concept is visible.
// These are sample markers, not surveyed buildings or official risk ratings.
const DEMO_BUILDINGS: DemoBuilding[] = [
  { id: "harbour-step", name: "Harbour Step Sample", risk: "medium", lng: 114.158, lat: 22.286, floors: 26 },
  { id: "pier-house", name: "Pier House Sample", risk: "medium", lng: 114.172, lat: 22.295, floors: 19 },
  { id: "beacon-block", name: "Beacon Block Sample", risk: "medium", lng: 114.185, lat: 22.302, floors: 21 },
  { id: "south-slope", name: "South Slope Sample", risk: "medium", lng: 114.148, lat: 22.275, floors: 16 },
  { id: "ridge-court", name: "Ridge Court Sample", risk: "high", lng: 114.165, lat: 22.308, floors: 18 },
  { id: "east-quay", name: "East Quay Sample", risk: "high", lng: 114.192, lat: 22.288, floors: 25 },
  { id: "north-terrace", name: "North Terrace Sample", risk: "high", lng: 114.175, lat: 22.278, floors: 28 },
  { id: "canal-house", name: "Canal House Sample", risk: "high", lng: 114.18, lat: 22.27, floors: 22 },
];

function footprint(lng: number, lat: number, meters: number): number[][] {
  const half = meters / 2;
  const latOffset = half / 111320;
  const lngOffset = half / (111320 * Math.cos((lat * Math.PI) / 180));
  return [
    [lng - lngOffset, lat - latOffset],
    [lng + lngOffset, lat - latOffset],
    [lng + lngOffset, lat + latOffset],
    [lng - lngOffset, lat + latOffset],
    [lng - lngOffset, lat - latOffset],
  ];
}

export function demoRiskGeoJson() {
  return {
    type: "FeatureCollection" as const,
    features: DEMO_BUILDINGS.map((building) => ({
      type: "Feature" as const,
      properties: {
        id: building.id,
        name: building.name,
        risk: building.risk,
        color: DEMO_RISK_COLORS[building.risk],
        height: building.floors * 3.2,
      },
      geometry: {
        type: "Polygon" as const,
        coordinates: [footprint(building.lng, building.lat, 70)],
      },
    })),
  };
}

export function addDemoRiskBuildings(map: Map): void {
  const data = demoRiskGeoJson();
  const existing = map.getSource("demo-risk");
  if (existing?.type === "geojson") {
    (existing as GeoJSONSource).setData(data);
    return;
  }
  map.addSource("demo-risk", { type: "geojson", data });
  const labelLayer = map
    .getStyle()
    .layers.find((layer) => layer.type === "symbol" && layer.layout?.["text-field"]);
  map.addLayer(
    {
      id: "demo-risk-buildings",
      type: "fill-extrusion",
      source: "demo-risk",
      paint: {
        "fill-extrusion-color": ["get", "color"],
        "fill-extrusion-height": ["get", "height"],
        "fill-extrusion-base": 0,
        "fill-extrusion-opacity": 0.95,
        "fill-extrusion-vertical-gradient": false,
      },
    },
    labelLayer?.id,
  );
}
