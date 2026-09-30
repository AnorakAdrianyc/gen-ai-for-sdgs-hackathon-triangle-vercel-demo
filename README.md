# Hong Kong 3D Map

## Building safety demo (static, Vercel)

`demo/` is a static building-safety desk: a schematic 3D map of sample buildings coloured by risk band, plus an interactive infographic of a multi-party dispatch network. It reads `demo/data/buildings.json` and does not call a map tile, Lands Department, or other API. Records are illustrative. Wang Fuk Court is context only and is not scored.

```sh
npm run demo
```

Open `http://127.0.0.1:4174` for the risk map and `http://127.0.0.1:4174/infographic` for the stakeholder network (`cleanUrls` on Vercel; locally the file is `infographic.html`).

`vercel.json` publishes the `demo/` folder and skips the Vite build. The MapLibre app below is still the local full map and needs network tiles.

A minimal full-window React + TypeScript map, built with Vite, MapLibre GL JS and Tailwind CSS. The default camera looks across Victoria Harbour at a 58° pitch. OpenFreeMap's dark vector style supplies land, coastline, water, roads and labels from OpenStreetMap-compatible data.

## Run locally

Use Node.js 24 LTS (the tests use built-in TypeScript support).

```sh
npm install
npm run dev
```

Open the local URL printed by Vite. The default OpenStreetMap buildings and Identify work without a key. The official 3D Spatial Data mode requires `LANDSD_API_KEY` in `.env.local`. Internet access is required for public vector tiles, styles, fonts and sprites; this is not an offline map. WebGL must be enabled.

```sh
npm run build    # TypeScript check and production build
npm run preview  # Serve the production build locally
npm run lint
npm run format
```

For the complete app, run `npm run build` then `npm start`. The Node server serves `dist/` and the same-origin Lands Department proxy on `127.0.0.1:4173` (override `HOST` and `PORT` for your deployment). A static-only host cannot provide Identify or official 3D models without an equivalent backend. `VITE_*` settings are embedded at build time; the server-only key is read at startup. Restart after changing it.

## Controls

- Drag to pan; scroll/pinch or use + / − to zoom.
- Right-drag or Ctrl-drag to rotate and tilt. On touch screens, use two fingers to rotate or tilt.
- The compass indicates north; click it to restore north-up and drag it to rotate.
- The reset button returns to the initial harbour camera.
- Focus the map canvas: arrow keys pan, + / − zoom, Shift + left/right rotate, and Shift + up/down change pitch.

## Configuration

Copy `.env.example` to `.env.local` if you want to change the map style, camera, or building schema. Invalid numeric settings fall back to the defaults. Restart Vite after editing environment files.

The default style is `https://tiles.openfreemap.org/styles/dark`; no token is needed. A replacement must be a MapLibre-compatible vector style with a building source. Set `VITE_BUILDING_SOURCE`, `VITE_BUILDING_SOURCE_LAYER`, and the height/base property names to match it. Heights must be numeric meters. If a provider requires a token, put its **public browser token**, restricted to your deployment domains, in `VITE_MAP_STYLE_URL` according to its documentation. Every `VITE_*` setting is visible to visitors: never put private credentials there.

## Building heights

The extrusion layer uses the provider's `render_height` and `render_min_height` values directly, without exaggeration or generated skyscrapers. Missing or nonnumeric heights resolve to zero, leaving those footprints flat. OpenMapTiles can derive render heights from OSM levels or provider defaults when surveyed heights are unavailable, so these values are source-based, not a guarantee of surveyed accuracy. Coverage varies by location and zoom. Buildings appear from zoom 13, below text labels. The basic mode uses a flat ground plane. Spatial mode adds elevation terrain at its true scale.

## Structure

```text
src/
  App.tsx                     App entry
  main.tsx                    React root and CSS imports
  styles.css                  Tailwind and basic MapLibre control styling
  components/HongKongMap.tsx   Map lifecycle, navigation, reset, loading/error UI
  map/config.ts               Environment settings and initial camera
  map/buildings.ts            Source-based 3D extrusion layer
  map/appearance.ts           Dark map colors and label contrast
```

MapLibre owns rendering and interaction; React does not re-render on camera movements. Cleanup removes the map and resize observer, including during development Strict Mode remounts.

## Data and references

Keep the map's built-in attribution visible. Map data and tile service terms apply:

- [OpenFreeMap](https://openfreemap.org/)
- [OpenStreetMap copyright and contributors](https://www.openstreetmap.org/copyright)
- [OpenMapTiles building schema](https://openmaptiles.org/schema/#building)
- [MapLibre 3D buildings example](https://maplibre.org/maplibre-gl-js/docs/examples/display-buildings-in-3d/)

## 官方 3D 模型與 Identify

- **3D Spatial Data**：載入地政總署的建築與基建 3D Tiles，保留原始模型幾何和高度。
- **Identify**：開啟後點選地圖，將 WGS84 轉為 HK80，查詢該地理位置的建築、地址與設施。這不是模型物件 ID 查詢；點選屋頂時的地面位置可能與建築位置不同。
- 支援載入、空結果、錯誤、重試、關閉查詢，以及切換模型後資源清理。

### Key 與服務

複製 `.env.example` 為 `.env.local`，設定 `LANDSD_API_KEY=你的地政總署key`。可從官方文件了解申請方式；文件亦提供公開範例 key 作評估，正式部署應使用自己的 key。本機若已有 `.env.local`，請只更新必要欄位，避免覆蓋其他設定。

Key 僅由 `server/lands.mjs` 加入官方請求，不會編入前端或傳給瀏覽器。不要改成 `VITE_LANDSD_API_KEY`。代理只允許指定的官方模型路徑和香港範圍的 Identify 座標；公開部署仍應依自己的流量需求設定限流。

| 服務     | 官方 URL                                                                      |
| -------- | ----------------------------------------------------------------------------- |
| 建築     | `https://data.map.gov.hk/api/3d-data/3dsd/WGS84/building/tileset.json`        |
| 基建     | `https://data.map.gov.hk/api/3d-data/3dsd/WGS84/infrastructure/tileset.json`  |
| Identify | `https://www.map.gov.hk/gs/api/v1.0.0/identify?x={HK80_X}&y={HK80_Y}&lang=zh` |

3D 模型使用 deck.gl 在 MapLibre 上疊加顯示。為控制記憶體和下載量，預設仍為基本建築，官方模式按視野逐步載入，採 4 px 畫面誤差門檻、每組模型 256 MB 快取預算與最多 8 個並行請求；首次載入可需數十秒。模型涵蓋範圍、更新時間與幾何精度依官方來源。記憶體壓力升高時可降低細節，以免無限制載入。建築改用淺藍灰建築示意材質，以實際面的法線計算方向光，強化牆面、屋頂與轉角的對比；不更改模型幾何和高度。遠處仍會使用簡化模型，原始資料中的形狀誤差不會因此自動修復。實景模式已移除。

Spatial 模式使用統一材質，因此停用 glTF 圖像下載／解碼，並在 GPU 上傳前移除不用的貼圖引用。嵌入模型二進位檔案的圖像位元組仍會隨模型下載，但不再執行 Basis/KTX2 貼圖解碼。保留實際頂點、索引、高度與模型位置。

伺服器對完整成功的 3D 回應提供 128 MB 記憶體 LRU 快取（單檔最多 16 MB、1 小時期限），並保留版本參數。大型檔案仍串流回傳，不加入快取；取消／失敗的回應不快取。`X-Lands-Cache: HIT/MISS` 可用於診斷，伺服器重啟會清空快取。瀏覽器也保留 1 小時的 HTTP 快取。

模型狀態區分已顯示與目前視野已補齊。開發模式 Console 的 `Spatial view settled in …` 記錄目前視野載入完成的時間（包含約 1 秒穩定觀察期），不能視為所有區域的效能保證。

### 新增模組與驗證

- `src/map/ArchitecturalScenegraphLayer.ts`：逐面明暗與統一建築材質。
- `src/map/officialModels.ts`：官方 3D Tiles、載入狀態、資源管理。
- `src/services/identify.ts`：座標轉換、可取消的查詢和回傳解析。
- `src/components/IdentifyPanel.tsx`：繁體中文結果面板。
- `server/lands.mjs`：固定上游的 server-only key 代理。
- `server/index.mjs`：production 靜態檔案與 API 伺服器。
- `npm test`：座標轉換、回傳解析及代理邊界測試。

完整擴充資料來源清單見 [香港地圖 API 清單](docs/HONG_KONG_APIS.zh-Hant.md)。

官方說明：[3D Spatial Data](https://portal.csdi.gov.hk/csdi-webpage/apidoc/3d-spatial-data-api)、[Identify](https://portal.csdi.gov.hk/csdi-webpage/apidoc/IdentifyAPI)。

## 山體與建築高度

Spatial 模式啟用 MapLibre `raster-dem` Terrarium 地形及 hillshade，倍率固定為 1。道路、地名和地表會貼合地形；官方建築與基建仍使用原有絕對高度，不額外加一次地面高度。deck.gl 與 MapLibre 共用 WebGL 深度，以處理山體與建築的前後遮擋。切回基本模式會關閉地形。

高程來源：[Mapzen Terrain Tiles / AWS](https://registry.opendata.aws/terrain-tiles/)，香港使用全球 DEM 覆蓋，無需 API key；可用 `VITE_TERRAIN_URL` 更換相同 Terrarium 編碼的來源（256 px、最高 zoom 14）。[來源與 attribution](https://github.com/tilezen/joerd/blob/master/docs/attribution.md) 包括 USGS / NOAA，亦顯示於地圖。

DEM 不是地政總署的精細地盤地形，來源解析度、年代及垂直基準可能與建築資料有差別。山坡整體會呈現，但個別地台、擋土牆、山路與建築底座仍可能有局部間隙／穿插；不以任意移動整幢建築掩蓋差異。若需要精確接地，下一步需換入官方精細 DTM 並確認高程基準。

`src/map/deckCompatibility.ts` 隔離了 deck.gl 9.4 對舊 MapLibre `transform` 路徑的相容處理，讀取 MapLibre 6 的即時渲染相機。已固定 MapLibre 6.11.2；升級任一渲染套件時需重新驗證山區平移、縮放和模式切換。
