# 香港 3D 地圖 API 與開放資料清單

整理日期：2026-09-29。以下保留討論中的候選項目；除另有註明，並非每個介面都已實測。API、圖磚服務及定期更新檔案分開看待，更新頻率及授權以官方文件為準。

## 地圖、三維模型及空間查詢

以下服務的官方入口：[CSDI 地圖 API 目錄](https://portal.csdi.gov.hk/csdi-webpage/apilist)。

| API／服務                                                                                               | 可加入的功能                                     |
| ------------------------------------------------------------------------------------------------------- | ------------------------------------------------ |
| [Location Search](https://portal.csdi.gov.hk/csdi-webpage/apidoc/LocationSearchAPI)                     | 中文地址、大廈、地標及設施搜尋                   |
| [Search Nearby](https://portal.csdi.gov.hk/csdi-webpage/apidoc/SearchNearbyAPI)                         | 指定位置附近 1 公里的設施                        |
| [Identify](https://portal.csdi.gov.hk/csdi-webpage/apidoc/IdentifyAPI)                                  | 查詢點選位置的建築及設施；輸入為 HK80 東距、北距 |
| [3D Spatial Data](https://portal.csdi.gov.hk/csdi-webpage/apidoc/3d-spatial-data-api)                   | 官方建築及基建三維模型                           |
| [3D Visualisation Map](https://portal.csdi.gov.hk/csdi-webpage/apidoc/3d-visualisation-map-api)         | 帶貼圖的城市三維模型                             |
| 3D Visualisation Map — Non-textured                                                                     | 不帶貼圖的三維模型                               |
| 3D Indoor Building Map                                                                                  | 已覆蓋建築的室內空間                             |
| [3D Indoor MTR Station Map](https://portal.csdi.gov.hk/csdi-webpage/apidoc/3d-indoor-mtr-station-map)   | 港鐵站樓層、室內空間及設施                       |
| [3D Pedestrian Route Search](https://portal.csdi.gov.hk/csdi-webpage/apidoc/3d-pedestrian-route-search) | 室內、室外及不同高度的步行路線                   |
| Imagery Map                                                                                             | 影像底圖                                         |
| Topographic Map                                                                                         | 官方地形底圖                                     |
| Vector Map                                                                                              | 官方向量底圖                                     |
| Map Label／Vector Map Label                                                                             | 地名標籤                                         |
| Streetscape 360                                                                                         | 有覆蓋位置的全景影像                             |
| Lot Index                                                                                               | 地段、政府撥地及短期租約土地                     |
| Land Parcel and Public Utility Number Search                                                            | 按地段及建築識別碼定位                           |

3D Spatial Data 及 3D Visualisation Map 使用 Cesium 3D Tiles，需向地政總署申請免費 API key。網頁顯示的範例 key 只用於本機試驗，不保證可作正式服務。正式申請：3dmap@landsd.gov.hk。官方模型不是 MapLibre 的一般 fill-extrusion 圖層，需額外的 3D Tiles 渲染器。

## 公共交通

| 資料源                                                                                                                                       | 功能／資料性質                                             |
| -------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------- |
| [九巴及龍運](https://data.gov.hk/en-data/dataset/hk-td-tis_21-etakmb)                                                                        | 路線、巴士站、ETA；ETA 約每分鐘更新                        |
| [城巴](https://www.citybus.com.hk/datagovhk/bus_eta_api_specifications.pdf)                                                                  | 車站、路線及下一班巴士，JSON                               |
| [新大嶼山巴士](https://www.nlb.com.hk/datagovhk/BusServiceOpenAPIMigrationGuideFrom1.0ToV2.0.pdf)                                            | 路線、車站、到站時間；使用 v2 API                          |
| [綠色專線小巴](https://www.td.gov.hk/en/transport_in_hong_kong/its/intelligent_transport_systems_strategy_review_and_/rtais/index.html)      | 小巴站點及到站資訊                                         |
| [港鐵列車](https://data.gov.hk/en-data/dataset/mtr-data2-nexttrain-data/resource/103472ed-01be-4dda-92c6-30530dee022f)                       | 列車到站資訊，包括機場快綫；每 10 秒更新                   |
| [輕鐵](https://data.gov.hk/en-data/dataset/mtr-lrnt_data-light-rail-nexttrain-data)                                                          | 各站預計到站時間；每 10 秒更新                             |
| [港鐵巴士](https://opendata.mtr.com.hk/doc/MTR_BUS_API_Spec_v1.13.pdf)                                                                       | 按路線查詢接駁巴士                                         |
| [新渡輪](https://www.sunferry.com.hk/eta/SunFerry_ETA_API_Specification_and_Data_Dictionary.pdf)                                             | 下一班渡輪 ETA，依服務覆蓋範圍                             |
| [跨境渡輪](https://data.gov.hk/en-data/dataset/hk-md-mardep-crossboundaryferryservices-arrive/resource/22679fe9-d9c4-4a62-8f01-af23bc2b0434) | 中港及港澳碼頭抵港航班；CSV，每 5 分鐘更新                 |
| [公共交通路線及收費](https://static.data.gov.hk/td/routes-fares-geojson/dataspec/ptroutefare_geojson_dataspec.pdf)                           | GeoJSON 等格式；路線、站序、票價；包括電車、渡輪及山頂纜車 |

ETA 不等於即時 GPS。若由 ETA 推算車輛動畫，必須標示為推算。電車有官方到站服務，但本次未核實一般開發者可直接使用的完整公開 API 文件。

## 道路及駕駛資訊

| 資料源                                                                                                                               | 功能／注意事項                     |
| ------------------------------------------------------------------------------------------------------------------------------------ | ---------------------------------- |
| [交通速度、流量及道路佔用率](https://static.data.gov.hk/td/traffic-speed-vol-occ/dataspec/dataspec_speed_vol_occ.pdf)                | 交通狀況著色；需對應探測器和道路   |
| [閉路電視 AI 交通數據](https://data.gov.hk/tc-data/dataset/hk-td-tis_32-traffic-data-aivas)                                          | 車速及流量數值                     |
| [交通情況快拍](https://data.gov.hk/en-data/dataset/hk-td-tis_2-traffic-snapshot-images)                                              | 攝影機位置與定期照片，非影片直播   |
| [停車場空位](https://resource.data.one.gov.hk/td/carpark/TD_Parking_Vacancy_Data_Specification.pdf)                                  | 參與停車場的空位與基本資料         |
| [特別交通消息](https://data.gov.hk/tc-data/dataset/hk-td-tis_1-special-traffic-news/resource/ddb332d8-0c28-42ca-a6da-110aed702d56)   | 事故及交通改道；不一定有精確座標   |
| [特別交通及運輸措施](https://data.gov.hk/sc-data/dataset/hk-td-tis_22-traffic-notices/resource/6d173b96-3857-43c7-9cd7-3a6bc5e46751) | 活動封路及臨時安排；XML            |
| [中電充電站](https://data.gov.hk/en-data/dataset/clp-team1-electric-vehicle-charging-stations)                                       | 充電站位置；不可假設每站有即時空位 |

## 天氣及環境

官方入口：[天文台開放數據目錄](https://www.hko.gov.hk/tc/abouthko/opendata_intro.htm)、[API 文件](https://www.hko.gov.hk/en/weatherAPI/doc/files/HKO_Open_Data_API_Documentation.pdf)。格式及更新頻率按資料集而異。

| 項目                                                                                               | 地圖應用                               |
| -------------------------------------------------------------------------------------------------- | -------------------------------------- |
| 本港地區氣溫                                                                                       | 測站溫度標記                           |
| 過去一小時雨量                                                                                     | 地區實測雨量                           |
| 天氣警告摘要及詳情                                                                                 | 風球、暴雨、雷暴警告                   |
| 風向、風速及陣風                                                                                   | 測站風向箭頭                           |
| 能見度                                                                                             | 低能見度觀測                           |
| 潮汐、水位及潮汐預報                                                                               | 沿岸測站水位                           |
| 閃電數據                                                                                           | 依可用空間與時間粒度顯示活動           |
| 本港及九天天氣預報                                                                                 | 預報資訊卡                             |
| 日出、日落時間                                                                                     | 城市光照效果                           |
| 香港暑熱指數                                                                                       | 暑熱資訊提示                           |
| [AQHI 空氣質素健康指數](https://data.gov.hk/en-data/dataset/hk-dpo-datagovhk2-city-dashboard-aqhi) | 監測站點位圖；連續熱力圖應標示插值估算 |

## 公共設施及城市資料

| 資料源                                                                                               | 功能／注意事項                                 |
| ---------------------------------------------------------------------------------------------------- | ---------------------------------------------- |
| [急症室等候時間及位置](https://portal.csdi.gov.hk/csdi-webpage/dataset/fhb_rcd_1636947932221_94410)  | 醫院資訊；約每 15 分鐘更新，保留分流及官方說明 |
| [醫院及診所目錄](https://www.healthbureau.gov.hk/download/opendata/c_2026_annual_open_data_plan.pdf) | 位置、地址、聯絡資訊；不代表即時接診能力       |
| [CSDI Dataset API](https://portal.csdi.gov.hk/csdi-webpage/info/how-to-use-csdi-portal)              | WFS、WMS、ArcGIS REST 地理資料服務             |
| [CSDI 資料集目錄](https://portal.csdi.gov.hk/csdi-webpage/DatasetList)                               | 行政區、土地、建築及公共設施主題               |
| [民政事務總署應急服務](https://www.had.gov.hk/en/public_services/emergency_services.htm)             | 庇護中心資料；本次未確認統一即時開放狀態 API   |

## 版本與實作注意

- 新大嶼山巴士使用 v2。
- [急症室 JSON 規格](https://www.ha.org.hk/opendata/Data-Specification-for-A%26E-Waiting-Time-tc.pdf)於 2025 年 10 月更新網址及欄位。
- AQHI 城市儀表板資料於 2026 年 7 月更換路徑。
- 地圖座標通常為 WGS84 經緯度，Identify 輸入為 HK80 米制座標，須正確轉換。
- 各服務的金鑰、跨域限制、來源標示及快取要求分別處理。
- 私密金鑰只放伺服器環境變數，不使用 VITE_ 前綴。

## 建議發展順序

| 方向     | 起步項目                                |
| -------- | --------------------------------------- |
| 實用搜尋 | Location Search → Nearby → 設施卡       |
| 逼真城市 | 3D Spatial Data／3D Visualisation Map   |
| 交通資訊 | 港鐵 ETA → 巴士 ETA → 交通快拍          |
| 步行導航 | 3D Pedestrian Route Search → 室內港鐵站 |
| 環境觀察 | 氣溫、雨量、風速 → AQHI                 |
