# Acceso a datos de hotspots FIRMS MODIS y VIIRS (histórico 2000–presente y NRT): guía técnica para FireSync (estado al 13 nov 2026)

Notas de investigación. Convención: **[V]** = verificado directamente (página oficial, sondeo HTTP o API de metadatos, con URL); **[I]** = inferencia mía o conocimiento previo no re-verificado hoy. Los sondeos HTTP (HEAD, lectura parcial por Range, llamadas con una MAP_KEY inválida de prueba `INVALIDKEY0000`) se hicieron el 13 nov 2026. No se crearon cuentas ni se solicitaron keys.

---

## 1. FIRMS API: MAP_KEY, límites, endpoints, SOURCE, DAY_RANGE, DATE, formatos y factibilidad de bajar 2000–2026 por API

### Takeaway
La API FIRMS (versión 4.2.8) exige una MAP_KEY gratuita que se pide solo con un email (no requiere Earthdata Login), con un límite de 5000 transactions cada 10 minutos. Hoy el endpoint de área acepta **DAY_RANGE de 1 a 5** (no 10) y solo sirve **CSV**. El endpoint `country` figura como "not currently available". Bajar 2000–2026 completo por API a fuerza de ventanas de 5 días es posible pero torpe (~3900 llamadas y ~19 400 transactions-día para los 4 sensores). Para el histórico conviene usar los archivos anuales por país; la API queda para rellenar 2026 y NOAA-21, más el NRT reciente.

### Cited Findings
**Índice de la API y endpoints**
- [V] El índice de la API lista estos endpoints: `area` (hotspots por área, fecha y sensor, CSV); `countries` y `country`, ambos marcados como **"not currently available"** con link a un aviso de outages; `data_availability` (fechas disponibles de SP y NRT); `kml_fire_footprints`; `map_key`; `missing_data`. Versión de la API: **4.2.8**. Hay una página "API Code Examples" en `/academy/`. — [FIRMS API index](https://firms.modaps.eosdis.nasa.gov/api/)

**MAP_KEY**
- [V] "sign up for free MAP_KEY using your email". La key llega por email y la página no menciona Earthdata Login. Si el email ya está registrado, se "log in through /download" para reenviar, borrar o modificar la key. La key existe porque la generación de datos impone "heavy server resource demand". — [FIRMS API map_key](https://firms.modaps.eosdis.nasa.gov/api/map_key/)
- [V] Límite: "MAP_KEY limit is 5000 transactions / 10-minute interval". "Larger transactions may count as multiple requests (ex. requesting 7 days)". Se puede pedir más cupo contactando a FIRMS. Hay un botón "Check status" con las transactions disponibles. — [FIRMS API map_key](https://firms.modaps.eosdis.nasa.gov/api/map_key/); [FIRMS API area](https://firms.modaps.eosdis.nasa.gov/api/area/)
- [V, fuente de terceros] El conector de Microsoft Power Platform para FIRMS dice que "each day counts as one transaction" contra las 5000 por 10 minutos. Su acción "Check MAP_KEY" devuelve transaction limit, current transactions y transaction interval. No es documentación de NASA. — [Microsoft Learn: NASA FIRMS connector](https://learn.microsoft.com/en-us/connectors/nasafirms)
- [V, sondeo] El endpoint de status `https://firms.modaps.eosdis.nasa.gov/mapserver/mapkey_status/?MAP_KEY=<KEY>` existe. Con una key inválida responde HTTP 403 con el texto "MAP_KEY is invalid or your have exceeded your transaction/time limit. Please try again later." No vi la respuesta de una key válida. — sondeo HTTP propio a `https://firms.modaps.eosdis.nasa.gov/mapserver/mapkey_status/?MAP_KEY=INVALIDKEY0000`

**Endpoint de área (bbox)**
- [V] Patrones de URL:
  - `/api/area/csv/[MAP_KEY]/[SOURCE]/[AREA_COORDINATES]/[DAY_RANGE]` devuelve lo más reciente, "from TODAY to TODAY - (DAY_RANGE-1)".
  - `/api/area/csv/[MAP_KEY]/[SOURCE]/[AREA_COORDINATES]/[DAY_RANGE]/[DATE]` devuelve DAY_RANGE días a partir de DATE (formato YYYY-MM-DD).
  
  AREA_COORDINATES es `west,south,east,north` o `world` (= -180,-90,180,90). El ejemplo de Sudamérica es `-85,-57,-32,14`. **DAY_RANGE: entero 1..5.** Para ver fechas disponibles, la página remite a `/api/data_availability/`. — [FIRMS API area](https://firms.modaps.eosdis.nasa.gov/api/area/)
- [V] Valores de SOURCE aceptados hoy (9): `LANDSAT_NRT` (solo US/Canada), `MODIS_NRT`, `MODIS_SP`, `VIIRS_NOAA20_NRT`, `VIIRS_NOAA20_SP`, `VIIRS_NOAA21_NRT`, `VIIRS_NOAA21_SP`, `VIIRS_SNPP_NRT`, `VIIRS_SNPP_SP`. Los dos de SNPP siguen listados. — [FIRMS API area](https://firms.modaps.eosdis.nasa.gov/api/area/)
- [V] La documentación del área solo muestra endpoints `csv`. Sondeo: `/api/area/csv/INVALIDKEY0000/VIIRS_NOAA20_NRT/-74,-56,-53,-21/1` responde 400 "Invalid MAP_KEY." (la ruta es válida). `/api/area/json/...` responde 401 con una página HTML, así que no hay salida JSON. — [FIRMS API area](https://firms.modaps.eosdis.nasa.gov/api/area/); sondeo HTTP propio
- [V] La página no da un límite explícito de cuán atrás se puede consultar SP. Remite a data_availability. — [FIRMS API area](https://firms.modaps.eosdis.nasa.gov/api/area/)

**Otros endpoints**
- [V] data_availability: `/api/data_availability/csv/[MAP_KEY]/[SENSOR]`. SENSOR acepta `ALL`, `LANDSAT_NRT`, `MODIS_NRT`, `MODIS_SP`, `VIIRS_NOAA20_NRT`, `VIIRS_NOAA20_SP`, `VIIRS_NOAA21_NRT`, `VIIRS_NOAA21_SP`, `VIIRS_SNPP_NRT`, `VIIRS_SNPP_SP`. Devuelve CSV. La página web dio "Error in processing" al cargar las fechas, así que no pude leer min/max. — [FIRMS API data_availability](https://firms.modaps.eosdis.nasa.gov/api/data_availability/)
- [V] country: `/api/country/` respondió HTTP 400. La ruta `/api/country/csv/<KEY>/VIIRS_NOAA20_NRT/ARG/1` responde "Invalid API call." aun antes de validar la key, igual que `/api/countries/`. Esto concuerda con el "not currently available" del índice. — [FIRMS API index](https://firms.modaps.eosdis.nasa.gov/api/); sondeo HTTP propio
- [V, indirecto] Un Q&A de ARSET de febrero 2026 (snippet de búsqueda) dice que el country API se usaba tanto que afectaba el rendimiento del sitio de FIRMS, y que FIRMS evalúa formas más eficientes de servir esos datos. No pude extraer el texto del PDF. — [ARSET 2026 Adv. FIRMS Part 2 Q&A (ES)](https://d3vpnmsr9g81nw.cloudfront.net/s3fs-public/2026-02/arset-2026-advfirms-part2-qa-spanish.pdf)
- [V] kml_fire_footprints: `/api/kml_fire_footprints/[REGION]/[DATE_SPAN]/[SENSOR]` o la forma con query `?region=&date_span=&sensor=`.
  - REGION: `canada`, `alaska`, `usa_contiguous_and_hawaii`, `central_america`, `south_america`, `europe`, `northern_and_central_africa`, `southern_africa`, `russia_asia`, `south_asia`, `southeast_asia`, `australia_newzealand`.
  - DATE_SPAN: `24h`, `48h`, `72h`, `7d`.
  - SENSOR: `c6.1`, `landsat`, `suomi-npp-viirs-c2`, `noaa-20-viirs-c2`, `noaa-21-viirs-c2`.
  
  La página no menciona MAP_KEY. — [FIRMS API kml_fire_footprints](https://firms.modaps.eosdis.nasa.gov/api/kml_fire_footprints/)
- [V] missing_data: el breadcrumb dice "API / missing_dates". La página muestra tablas de días con datos faltantes por satélite, separadas en Standard y NRT. "The near real time (NRT) data is ONLY shown past the last available date of the standard data per satellite". La página no documenta un patrón de URL. `/api/missing_dates/` respondió "Invalid API call." — [FIRMS API missing_data](https://firms.modaps.eosdis.nasa.gov/api/missing_data/); sondeo HTTP propio
- [V] RT/URT: se eliminan "when corresponding NRT detections are processed" o cuando tienen más de 6 h. URT está disponible en "less than 60 seconds" solo para buena parte de US/Canada. — [FIRMS API area](https://firms.modaps.eosdis.nasa.gov/api/area/)

### Inferences
- [I] **Número de llamadas para bajar todo el histórico por API**, con DAY_RANGE=5 y una sola bbox (p. ej. Argentina `-73.6,-55.1,-53.6,-21.8`):

  | SOURCE | Período | Días | Llamadas |
  |---|---|---|---|
  | MODIS_SP + MODIS_NRT | 2000-11-01 → 2026-11-13 | ≈ 9 509 | ≈ 1 900 |
  | VIIRS_SNPP_SP | 2012-01-20 → 2026-11-02 | ≈ 5 400 | ≈ 1 080 |
  | VIIRS_NOAA20_SP | 2018-04-01 → hoy | ≈ 3 150 | ≈ 630 |
  | VIIRS_NOAA21_SP | 2023-03-01 → hoy | ≈ 1 350 | ≈ 270 |
  | **Total** | | **≈ 19 400** | **≈ 3 900** |

  Si cada día cuenta como 1 transaction (dato de terceros), son ~19 400 transactions: al menos 4 ventanas de 10 minutos, unos 40 minutos de mínimo teórico. En la práctica serían horas por la latencia de cada respuesta, y con riesgo de 403 por exceder el cupo. Además una bbox no es un polígono de país y habría que recortar. **Es factible, pero inferior a los CSV anuales por país** (sección 3).
- [I] **Uso razonable de la API en FireSync:**
  - Rellenar 2026 (no hay CSV por país de 2026): 2026-01-01 → hoy son ≈317 días, ≈64 llamadas por sensor.
  - Bajar el histórico de NOAA-21 (no hay CSV por país de NOAA-21): 2023-03-01 → 2025-12-31 son ≈1036 días, ≈208 llamadas.
  - Servir el NRT reciente, con DAY_RANGE ≤5.
  
  Todo eso entra holgado en el cupo.
- [I] La MAP_KEY no debe quedar expuesta en el frontend. Conviene un proxy o backend con caché.
- [I] Antes de mezclar SP y NRT, consultar `data_availability/csv/<KEY>/ALL` para saber dónde termina el SP de cada sensor.

### Gaps
- No pude ver los rangos min/max de data_availability: la página web dio error y no tengo key.
- No hay documentación oficial de NASA que diga exactamente cómo se cuentan las transactions (¿una por día pedido? ¿por volumen?). La única afirmación explícita, "cada día = 1", es de un conector de terceros.
- No hay fecha de restauración del country API.
- No sé si DAY_RANGE fue 1..10 en versiones anteriores. Lo recuerdo así, pero no lo pude verificar. Hoy es 1..5 [V].

---

## 2. Retiro de Suomi NPP (2 nov 2026) y otros cambios 2025–2026 que afectan el acceso

### Takeaway
Suomi NPP dejó de producir datos nuevos para FIRMS el 2 nov 2026. Lo planificado era a las 13:00 UTC; el FAQ de FIRMS dice que cesó a las 15:40 UTC. El histórico SNPP (20 ene 2012 – 2 nov 2026) sigue disponible, y `VIIRS_SNPP_NRT`/`VIIRS_SNPP_SP` siguen apareciendo como SOURCE válidos. Pero los feeds NRT de SNPP ya están vacíos y NASA pide cambiar a `VIIRS_NOAA20_NRT` / `VIIRS_NOAA21_NRT`. Los nombres de NOAA-20/21 no son nuevos, ya existían. Para continuidad VIIRS en FireSync: SNPP (2012–2026-11-02) + NOAA-20 (2018→) + NOAA-21 (2023→).

### Cited Findings
- [V] La alerta de Earthdata, emitida el 7 ago 2026, fija el cese de Suomi NPP en 13:00 UTC del 2 nov 2026 (2026/306), "subject to change". El slug de la URL dice "november-1-2026". — [Earthdata alert: Suomi NPP data product delivery cease](https://www.earthdata.nasa.gov/data/alerts-outages/suomi-npp-data-product-delivery-cease-november-1-2026)
- [V] Blog FIRMS (publicado 27 oct 2026, actualizado 3 nov 2026):
  - La producción y entrega de datos nuevos de Suomi NPP "will cease at 13:00 Universal Time (UTC) on November 2, 2026". "Historical data will continue to be available."
  - Quien use REST API, WMS/WFS o feeds CSV/SHP debe cambiar el parámetro de sensor de VIIRS_SNPP_NRT (o VIIRS_SNPP_SP) a VIIRS_NOAA20_NRT o VIIRS_NOAA21_NRT.
  - Las alertas por email de SNPP dejan de enviarse.
  - NOAA-20 y NOAA-21 (375 m, mismo plano orbital, ~50 min de separación) son "the best direct drop-in replacements".
  - MODIS (1 km) sigue disponible, pero se recomienda planificar la transición. Terra es la única pasada matutina y NASA investiga alternativas para cuando termine. No se dan fechas de fin de misión de Terra/Aqua.
  
  — [Earthdata blog: Transitioning from Suomi NPP VIIRS & OMPS](https://www.earthdata.nasa.gov/news/blog/transitioning-from-suomi-npp-viirs-omps-what-firms-users-need-know); [versión alternativa del mismo post](https://www.earthdata.nasa.gov/news/blog/transitioning-from-s-npp-viirs-omps-what-nasa-firms-users-need-know)
- [V] **Conflicto de hora:** el FAQ de FIRMS dice que la producción de Suomi NPP "ceased at 15:40 Universal Time (UTC) on November 2, 2026". El blog y la alerta dicen 13:00 UTC (planificado). — [FIRMS FAQ](https://www.earthdata.nasa.gov/data/tools/firms/faq)
- [V] El Archive Download lista "VIIRS S-NPP 375m: 20 January 2012 to 2 November 2026". — [FIRMS Archive Download](https://firms.modaps.eosdis.nasa.gov/download/)
- [V] El WMS info indica cobertura SNPP del 20 ene 2012 al 2 nov 2026. Las capas WMS estáticas "por satélite" listadas son solo NOAA-20 y NOAA-21. SNPP solo aparece como capa WMS-Time `fires_viirs_snpp`. — [FIRMS WMS info](https://firms2.modaps.eosdis.nasa.gov/mapserver/wms-info/)
- [V, sondeo] Al 13 nov 2026, `.../data/active_fire/suomi-npp-viirs-c2/csv/SUOMI_VIIRS_C2_South_America_7d.csv` pesa **112 bytes** (solo encabezado; Last-Modified 12 nov 2026). El equivalente de NOAA-20 pesa 5,8 MB y el de NOAA-21 5,4 MB. — sondeo HTTP propio (HEAD)
- [V] La API sigue listando VIIRS_SNPP_NRT y VIIRS_SNPP_SP como SOURCE, y data_availability sigue listando ambos sensores SNPP. — [FIRMS API area](https://firms.modaps.eosdis.nasa.gov/api/area/); [data_availability](https://firms.modaps.eosdis.nasa.gov/api/data_availability/)
- [V] La página de VIIRS 375 m tiene el banner "Suomi NPP is no longer delivering new data. Users must transition to alternative products." — [Earthdata VIIRS I-Band 375 m Active Fire](https://www.earthdata.nasa.gov/data/instruments/viirs/viirs-i-band-375-m-active-fire-data)
- [V, CMR] El registro CMR de `VJ214IMGTDL_NRT` v2 (NOAA-21 NRT, provider LANCEMODIS) tiene inicio temporal 2026-10-01, y el de `VJ114IMGTDL_NRT` 2024-10-01. — [NASA CMR API: VJ214IMGTDL_NRT](https://cmr.earthdata.nasa.gov/search/collections.umm_json?short_name=VJ214IMGTDL_NRT)
- [V] Otros cambios 2025–2026:
  - country/countries API "not currently available" ([FIRMS API index](https://firms.modaps.eosdis.nasa.gov/api/)).
  - DAY_RANGE 1..5 ([area](https://firms.modaps.eosdis.nasa.gov/api/area/)).
  - Login del Archive Download con Earthdata Login **o** código por email ([download](https://firms.modaps.eosdis.nasa.gov/download/)).
  - Earthdata Forum caído por mantenimiento (oct–nov 2026); las consultas van a earthdata-support@nasa.gov con "FIRMS" en el asunto ([blog](https://www.earthdata.nasa.gov/news/blog/transitioning-from-suomi-npp-viirs-omps-what-firms-users-need-know)).
  - Mantenimiento planificado de FIRMS el 13 ene 2026 y del 15–16 jun 2026 ([alerts](https://www.earthdata.nasa.gov/data/alerts-outages/planned-firms-maintenance-01-13-2026)).

### Inferences
- [I] La nota previa del equipo ("API source names moved to VIIRS_NOAA20_NRT / VIIRS_NOAA21_NRT") es imprecisa. Los nombres no se movieron. Lo que pasó es que SNPP dejó de recibir datos nuevos, y NASA recomienda usar los SOURCE de NOAA-20/21, que ya existían. Para el histórico SNPP, `VIIRS_SNPP_SP` (y los CSV por país `viirs-snpp`) siguen siendo la vía.
- [I] Cualquier serie VIIRS "continua" de FireSync va a tener un cambio de constelación: 1 satélite VIIRS en 2012–2018, 2 en 2018–2023, 3 en 2023–nov 2026 y 2 desde nov 2026. Sin normalización, el conteo de hotspots tiene saltos artificiales. Conviene deduplicar o normalizar por número de pasadas, o mostrar el calendario por satélite.
- [I] El retiro de SNPP probablemente se refleje en la fila "VIIRS S-NPP" de data_availability con max_date = 2026-11-02 (no verificado, sin key).

### Gaps
- No sé si FIRMS planea quitar `VIIRS_SNPP_NRT` del API. El blog no lo dice.
- Hay discrepancia 13:00 vs 15:40 UTC en la hora exacta de la última detección SNPP.
- No hay fechas de fin de Terra/Aqua (MODIS) en las fuentes consultadas.

---

## 3. FIRMS Archive Download, archivos anuales por país y feeds NRT CSV sin key

### Takeaway
Para FireSync, la vía más eficiente para el histórico son los **CSV anuales por país**: se descargan sin login por URL directa, existen para MODIS (2000–2025), VIIRS SNPP (2012–2025) y VIIRS NOAA-20 (2018–2025), pero **no para NOAA-21 ni para 2026**. Para Argentina suman ≈487 MiB de CSV. El Archive Download (login con Earthdata o código por email) cubre lo demás: NOAA-21, 2026 y polígonos a medida. Entrega por email, en CSV, SHP o JSON. Para el NRT de los últimos 1–7 días hay CSV regionales públicos sin key.

### Cited Findings
**Archive Download**
- [V] Login con "Earthdata Login" o "Login with code" (un código enviado por email). Sirve datos "older than the last 7 days" en Shapefile, CSV o JSON. Llega "an email with instructions on how to download your data". NRT se reemplaza por standard "with approximately a 5 month lag". Los burned area no están; se bajan por sftp de UMD. — [FIRMS Archive Download](https://firms.modaps.eosdis.nasa.gov/download/)
- [V] Coberturas por sensor según la misma página:

  | Sensor | Cobertura |
  |---|---|
  | MODIS C6.1 | 1 nov 2000 → presente |
  | VIIRS S-NPP 375 m | 20 ene 2012 → 2 nov 2026 |
  | VIIRS NOAA-20 375 m | 1 abr 2018 → presente |
  | VIIRS NOAA-21 375 m | 1 mar 2023 → presente |
  | LANDSAT 30 m | 20 jun 2022 → presente |

  — [FIRMS Archive Download](https://firms.modaps.eosdis.nasa.gov/download/)
- [V] La página (renderizada sin JS) no detalla turnaround, límite de tamaño ni cantidad de pedidos. Tampoco describe cómo se selecciona la región (polígono, país o bbox). — [FIRMS Archive Download](https://firms.modaps.eosdis.nasa.gov/download/)

**CSV anuales por país**
- [V] La página `/country/` existe (es JS y no se renderizó). Patrones de URL verificados con HEAD (200, sin autenticación):
  - `https://firms.modaps.eosdis.nasa.gov/data/country/modis/{YYYY}/modis_{YYYY}_{Country}.csv`
  - `https://firms.modaps.eosdis.nasa.gov/data/country/viirs-snpp/{YYYY}/viirs-snpp_{YYYY}_{Country}.csv`
  - `https://firms.modaps.eosdis.nasa.gov/data/country/viirs-jpss1/{YYYY}/viirs-jpss1_{YYYY}_{Country}.csv` (NOAA-20)
  - ZIP global por año: `https://firms.modaps.eosdis.nasa.gov/data/country/zips/{sensor}_{YYYY}_all_countries.zip`
  
  — sondeo HTTP propio; [FIRMS Archive Download](https://firms.modaps.eosdis.nasa.gov/download/) (link "Download yearly summary by country [.csv]")
- [V, sondeo] **Argentina: años disponibles y tamaños** (Content-Length):
  - **MODIS 2000–2025:** existen todos y 2026 da 404. 2000: 0,58 MB (año parcial, desde nov). 2003: 9,3 MB. 2020: 10,0 MB (máximo). 2023: 3,9 MB. 2025: 3,9 MB. Total ≈130,2 MiB.
  - **VIIRS SNPP 2012–2025:** existen todos y 2026 da 404. 2012: 15,2 MB. 2020: 36,0 MB (máximo). 2022: 25,1 MB. 2023: 13,8 MB. 2025: 13,7 MB. Total ≈221,1 MiB.
  - **VIIRS NOAA-20 2018–2025:** existen todos y 2026 da 404. 2018: 10,7 MB. 2020: 35,8 MB. 2023: 13,5 MB. 2025: 14,0 MB. Total ≈135,7 MiB.
  - **NOAA-21:** 404 para `viirs-jpss2`, `viirs-noaa21`, `viirs-noaa-21` y `viirs-j2` (2024 y zip 2025). No hay archivos por país de NOAA-21.
  - **Fechas de modificación:** MODIS 2000–2022 se regeneró el 4 dic 2024; VIIRS 2012–2024 el 24 jun 2025; los archivos 2025 el **10 oct 2026**.
  
  — sondeo HTTP propio (HEAD) sobre `https://firms.modaps.eosdis.nasa.gov/data/country/...`
- [V, sondeo] Tamaños de los ZIP globales: `modis_2023_all_countries.zip` 81,8 MB; `viirs-jpss1_2023_all_countries.zip` 379,6 MB; `modis_2025` 64,8 MB; `viirs-snpp_2025` 327,3 MB; `viirs-jpss1_2025` 328,6 MB; `viirs-jpss2_2025` da 404. — sondeo HTTP propio
- [V, sondeo] Esquema real de los CSV por país (primeras líneas leídas por Range):
  - MODIS: `latitude,longitude,brightness,scan,track,acq_date,acq_time,satellite,instrument,confidence,version,bright_t31,frp,daynight,type`. Ejemplo de valores: `satellite`=Terra/Aqua, `confidence` 0–100, `version`=61.03, `type`=0.
  - VIIRS NOAA-20: `latitude,longitude,bright_ti4,scan,track,acq_date,acq_time,satellite,instrument,confidence,version,bright_ti5,frp,daynight,type`. Ejemplo: `satellite`=N20, `confidence`=n (l/n/h), `version`=2.
  
  — sondeo HTTP propio sobre [modis_2023_Argentina.csv](https://firms.modaps.eosdis.nasa.gov/data/country/modis/2023/modis_2023_Argentina.csv) y [viirs-jpss1_2023_Argentina.csv](https://firms.modaps.eosdis.nasa.gov/data/country/viirs-jpss1/2023/viirs-jpss1_2023_Argentina.csv)
- [V] Un hilo del Earthdata Forum dice que no hay forma de obtener el registro standard completo como un solo CSV. — [Earthdata Forum: MODIS/VIIRS fire standard products?](https://forum.earthdata.nasa.gov/viewtopic.php?p=24649) (vía snippet de búsqueda)

**Feeds NRT CSV públicos (sin MAP_KEY)**
- [V, sondeo] HEAD 200 sin auth el 13 nov 2026:
  - `.../data/active_fire/modis-c6.1/csv/MODIS_C6_1_South_America_7d.csv` (1,56 MB)
  - `.../MODIS_C6_1_Global_7d.csv` (6,7 MB)
  - `.../noaa-20-viirs-c2/csv/J1_VIIRS_C2_South_America_7d.csv` (5,8 MB)
  - `.../J1_VIIRS_C2_Global_7d.csv` (37,0 MB)
  - `.../noaa-21-viirs-c2/csv/J2_VIIRS_C2_South_America_7d.csv` (5,4 MB)
  - `.../J2_VIIRS_C2_Global_24h.csv` (7,6 MB)
  
  Todos se actualizan cada pocos minutos (Last-Modified 13 nov 2026 ~23:40–23:47 GMT). Base: `https://firms.modaps.eosdis.nasa.gov/data/active_fire/`. — sondeo HTTP propio

### Inferences
- [I] Los sufijos `_24h`, `_48h` y `_7d` y los nombres de región (`South_America`, `Global`, etc.) siguen el patrón FIRMS clásico. Verifiqué `_7d` y `_24h`; `_48h` no lo probé.
- [I] Los CSV por país parecen ser datos **SP** (`version` 61.03 / 2, columna `type`). Los de 2025, regenerados el 10 oct 2026, probablemente ya son SP completos o casi completos, dado el lag de SP de 2–5 meses. No lo pude confirmar sin descargar el archivo.
- [I] Los archivos por país recortan por frontera terrestre, así que no incluyen detecciones offshore fuera del país. Para Argentina alcanza.
- [I] **Plan recomendado para Argentina:**
  1. Bajar los 48 CSV por país (≈487 MiB): MODIS 26 años + SNPP 14 + NOAA-20 8.
  2. NOAA-21 2023-03 → 2025 y todos los sensores 2026-01-01 → hoy−7d: Archive Download (polígono de Argentina) o API area con *_SP/*_NRT.
  3. Últimos 7 días: feeds NRT públicos o API NRT.
- [I] **Para Sudamérica:** bajar los CSV por país de los ~13 países, más o menos 2–3× el tamaño de Brasil (ver sección 7). Los ZIP `all_countries` no convienen: hay que bajar el mundo entero (≈65–380 MB comprimido por año y sensor).

### Gaps
- Turnaround, límites de tamaño y forma exacta de selección de región del Archive Download: la página es JS y no lo documenta en texto.
- No sé si el Archive Download permite subir un polígono propio o solo país/bbox.
- No sé si existe algún nombre de carpeta para NOAA-21 que no haya probado.
- No pude confirmar si los CSV por país 2025 son 100% SP.

---

## 4. Earthdata Login: qué lo requiere

### Takeaway
Earthdata Login **no** hace falta para la API de FIRMS (MAP_KEY por email), ni para los CSV anuales por país, ni para los feeds NRT públicos. El Archive Download acepta Earthdata Login **o** un código por email. Sí lo requieren las carpetas de archivos diarios NRT de LANCE (nrt3) y los gránulos L2/L3 de LP DAAC / Earthdata Cloud (MOD14, VNP14IMG, etc.).

### Cited Findings
- [V] MAP_KEY solo con email; la página no menciona Earthdata Login. — [FIRMS API map_key](https://firms.modaps.eosdis.nasa.gov/api/map_key/)
- [V] Archive Download: "Earthdata Login" u "Enter CODE emailed to:" / "Login with code". — [FIRMS Archive Download](https://firms.modaps.eosdis.nasa.gov/download/)
- [V] FAQ, sobre los archivos de texto diarios: "you will need an Earthdata Login to download data from this folder". — [FIRMS FAQ](https://www.earthdata.nasa.gov/data/tools/firms/faq)
- [V, sondeo] Los CSV por país y los feeds `data/active_fire/...` respondieron 200 a HEAD sin credenciales. `https://nrt3.modaps.eosdis.nasa.gov/archive/FIRMS/` respondió 200 con HTML; no inspeccioné si era una página de login. — sondeo HTTP propio
- [V] Los productos L2 MOD14/MYD14 C6.1 y VNP14IMG/VJ114IMG/VJ214IMG v002 están en el provider `LPCLOUD` (Earthdata Cloud, us-west-2). — [NASA CMR API (MOD14)](https://cmr.earthdata.nasa.gov/search/collections.umm_json?short_name=MOD14)

### Inferences
- [I] Crear una cuenta Earthdata Login (urs.earthdata.nasa.gov) es gratis e inmediato tras verificar el email, según mi conocimiento previo; no lo verifiqué hoy. Para la hackathon solo es necesaria si usan gránulos L2/L3 o las carpetas nrt3.

### Gaps
- No verifiqué la velocidad de alta de cuentas Earthdata Login ni sus requisitos actuales (2026).

---

## 5. Fuentes de nivel inferior: LP DAAC/LAADS, LANCE, CMR, earthaccess, Earthdata Cloud

### Takeaway
Los productos L2 de fuego, que son la base del SP de FIRMS, están catalogados en CMR bajo **LPCLOUD** (LP DAAC en Earthdata Cloud, AWS us-west-2), con DOIs propios. Los NRT de LANCE están bajo LANCEMODIS. MCD14ML no aparece en CMR. Para FireSync, los gránulos L2 son overkill: los vectores FIRMS ya traen lat/lon por hotspot.

### Cited Findings
- [V, CMR] Productos encontrados:

  | Producto | Provider | Concept ID | DOI | Inicio | Nube |
  |---|---|---|---|---|---|
  | MOD14 v061 | LPCLOUD | C2271754179-LPCLOUD | 10.5067/MODIS/MOD14.061 | 2000-02-24 | us-west-2 |
  | MYD14 v061 | LPCLOUD | C2278858993-LPCLOUD | 10.5067/MODIS/MYD14.061 | 2002-07-04 | us-west-2 |
  | VNP14IMG v002 | LPCLOUD | C2734202914-LPCLOUD | 10.5067/VIIRS/VNP14IMG.002 | 2012-01-17 | us-west-2 |
  | VJ114IMG v002 | LPCLOUD | C2734197957-LPCLOUD | 10.5067/VIIRS/VJ114IMG.002 | 2018-01-01 | us-west-2 |
  | VJ214IMG v002 | LPCLOUD | C2831626262-LPCLOUD | 10.5067/VIIRS/VJ214IMG.002 | 2023-02-10 | us-west-2 |
  | VNP14A1 v002 (L3 diario 1 km) | LPCLOUD | — | 10.5067/VIIRS/VNP14A1.002 | — | — |
  | VJ114A1 v002 | LPCLOUD | — | 10.5067/VIIRS/VJ114A1.002 | — | — |
  | MOD14 / MYD14 v6.1NRT | LANCEMODIS | — | 10.5067/MODIS/MOD14.NRT.061, 10.5067/MODIS/MYD14.NRT.061 | — | — |
  | MCD14DL v6.1NRT | LANCEMODIS | — | 10.5067/FIRMS/MODIS/MCD14DL.NRT.0061 | — | — |
  | VNP14IMGTDL_NRT v2 | LANCEMODIS | — | 10.5067/FIRMS/VIIRS/VNP14IMGT_NRT.002 | — | — |
  | VJ114IMGTDL_NRT v2 | LANCEMODIS | — | 10.5067/FIRMS/VIIRS/VJ114IMGT_NRT.002 | — | — |
  | VJ214IMGTDL_NRT v2 | LANCEMODIS | — | 10.5067/FIRMS/VIIRS/VJ214IMGT_NRT.002 | — | — |

  — [CMR collections search](https://cmr.earthdata.nasa.gov/search/collections.umm_json?short_name=VJ114IMG) (misma consulta con cada short_name)
- [V, CMR] Una búsqueda por `short_name=MCD14ML` no devolvió colecciones. — [CMR MCD14ML](https://cmr.earthdata.nasa.gov/search/collections.umm_json?short_name=MCD14ML)
- [V] El aviso de cese de Suomi NPP incluye a LP DAAC y LAADS DAAC entre los centros afectados. — [Earthdata alert](https://www.earthdata.nasa.gov/data/alerts-outages/suomi-npp-data-product-delivery-cease-november-1-2026)

### Inferences
- [I] Con `earthaccess` (Python) se buscaría así: `earthaccess.login()` (requiere Earthdata Login), luego `earthaccess.search_data(short_name="VJ114IMG", version="002", bounding_box=(-73.6,-55.1,-53.6,-21.8), temporal=("2024-01-01","2024-01-31"))` y después `earthaccess.download(...)` o `earthaccess.open(...)` (este último solo es eficiente dentro de us-west-2). Es mi conocimiento de la librería ([docs](https://earthaccess.readthedocs.io/)); no lo probé hoy.
- [I] Los L2 (NetCDF/HDF por gránulo de 5–6 min) pesan GB por día a escala global. Para un calendario de quema no aportan sobre los CSV FIRMS. Solo valen la pena para reprocesar QA o recuperar píxeles que el NRT filtra (p. ej. nocturnos de baja confianza en SAMA).
- [I] Por CMR, los L2 de fuego ya no figuran bajo LAADS sino bajo LPCLOUD. Esto podría ser una migración reciente y conviene confirmarlo en la web de LAADS.

### Gaps
- No verifiqué si LAADS DAAC sigue sirviendo MOD14/VNP14IMG en paralelo.
- No encontré DOI ni distribuidor CMR de MCD14ML (el SP vectorial MODIS).

---

## 6. Catálogos abiertos: Microsoft Planetary Computer, Google Earth Engine, AWS

### Takeaway
Planetary Computer solo tiene fuego **MODIS raster** (modis-14A1-061, modis-14A2-061, más modis-64A1-061 de burned area) y **ninguna colección VIIRS de fuego**. GEE tiene el dataset `FIRMS`, que es el **NRT MCD14DL rasterizado a 1 km** (no es SP ni puntos), además de rasters diarios VIIRS NRT de NOAA-20 y SNPP y VNP14A1 v002. Es útil para visualización, pero no para un CSV de hotspots armonizado. Además rigen los términos de GEE (noncommercial con tiers de cuota).

### Cited Findings
- [V, STAC API] De las 139 colecciones de Planetary Computer, las que matchean "fire/viirs/14A/burn" son solo `modis-14A1-061`, `modis-14A2-061` y `modis-64A1-061`. — [PC STAC collections](https://planetarycomputer.microsoft.com/api/stac/v1/collections)
- [V, STAC API] `modis-14A1-061` ("MODIS Thermal Anomalies/Fire Daily"):
  - Temporal desde 2000-02-18.
  - Assets: QA, hdf, MaxFRP, sample, FireMask, metadata.
  - Campo `license`="proprietary".
  - `msft:region`=westeurope (storage account `modiseuwest`, container `modis-061`).
  - Descripción: L3 de 1 km, cada archivo trae 8 días de datos diarios.
  
  `modis-14A2-061` es el 8-day. — [PC STAC modis-14A1-061](https://planetarycomputer.microsoft.com/api/stac/v1/collections/modis-14A1-061); [PC STAC modis-14A2-061](https://planetarycomputer.microsoft.com/api/stac/v1/collections/modis-14A2-061)
- [V] GEE `FIRMS`:
  - "contains the LANCE fire detection product in rasterized form", basado en MOD14/MYD14 vía LANCE (MCD14DL NRT); cada fuego es "the centroid of a 1km pixel".
  - Disponibilidad 2000-11-01 → 2026-11-11, cadencia diaria.
  - Bandas `T21`, `confidence` y `line_number`.
  - El NRT "not considered to be of science quality".
  - Cita el DOI C6 `10.5067/FIRMS/MODIS/MCD14DL.NRT.006`.
  - Si se entrega LANCE/FIRMS a terceros, hay que seguir las guías de citation/disclaimer de LANCE.
  
  — [GEE catalog: FIRMS](https://developers.google.com/earth-engine/datasets/catalog/FIRMS)
- [V] GEE `NASA/LANCE/NOAA20_VIIRS/C2`: raster diario 375 m de VJ114IMGTDL_NRT, desde 2023-10-08, DOI 10.5067/FIRMS/VIIRS/VJ114IMGT_NRT.002. Existe también `NASA/LANCE/SNPP_VIIRS/C2`. Las páginas localizadas no coinciden en la fecha de fin. — [GEE NASA_LANCE_NOAA20_VIIRS_C2](https://developers.google.com/earth-engine/datasets/catalog/NASA_LANCE_NOAA20_VIIRS_C2?hl=de)
- [V] GEE `NASA/VIIRS/002/VNP14A1`: diario 1 km, bandas FireMask, MaxFRP y QA. Disponibilidad listada 2012-01-19 → 2026-03-31 (según el snippet; varía por versión de página). DOI 10.5067/VIIRS/VNP14A1.002. `NOAA/VIIRS/001/VNP14A1` está deprecated. — [GEE NASA_VIIRS_002_VNP14A1](https://developers.google.com/earth-engine/datasets/catalog/NASA_VIIRS_002_VNP14A1)
- [V] GEE noncommercial:
  - Elegibles: nonprofits, instituciones académicas, medios y algunos gobiernos; individuos solo con fines noncommercial.
  - No se puede monetizar ni hacer trabajo contratado.
  - Tiers de cuota (Community, Contributor, Partner).
  - Pasar a commercial es permanente.
  
  — [Earth Engine noncommercial](https://earthengine.google.com/noncommercial); [Noncommercial tiers](https://developers.google.com/earth-engine/guides/noncommercial_tiers)
- [V] Existe un catálogo comunitario de GEE (no oficial) con vectores FIRMS NRT archivados MODIS/VIIRS. — [GEE Community Catalog: FIRMS vector](https://gee-community-catalog.org/projects/firms_vector/)

### Inferences
- [I] En Planetary Computer, los assets de Blob se firman con `planetary_computer.sign()` / `sign_inplace` (SAS token anónimo, sin cuenta). Es conocimiento previo, no re-verificado. El "proprietary" de STAC es un placeholder; los datos MODIS son NASA open/CC0 (sección 9).
- [I] Ni PC ni GEE dan hotspots vectoriales SP armonizados MODIS+VIIRS. Para FireSync, la fuente primaria debe ser FIRMS directo. GEE/PC solo tendrían sentido para un fondo raster (FireMask) o para validar.
- [I] AWS Open Data: los L2/L3 de LP DAAC están en Earthdata Cloud (S3 us-west-2) con acceso vía Earthdata Login, no como bucket anónimo. No encontré un mirror anónimo de los vectores FIRMS en AWS Open Data.

### Gaps
- No verifiqué si existe `VJ114A1` o `VJ214A1` en GEE, ni un dataset LANCE NOAA-21 en GEE.
- No encontré un mirror AWS Open Data de hotspots FIRMS (no busqué a fondo en registry.opendata.aws).
- No verifiqué la página humana de Planetary Computer (renderiza con JS).

---

## 7. Volúmenes de datos y factibilidad de preprocesar (Argentina / Sudamérica / global)

### Takeaway
Argentina 2000–2025 suma ≈487 MiB de CSV, unas **6 millones de filas** (MODIS ≈1,7 M; SNPP ≈2,8 M; NOAA-20 ≈1,7 M). Se convierte a Parquet/DuckDB en minutos, no horas. Globalmente, un año VIIRS de un satélite son ≈1,6–1,7 GiB de CSV (~20 M filas) y un año MODIS ≈355–370 MiB (~4,5 M filas). Sudamérica en un año: MODIS 52–76 MiB y VIIRS 194–306 MiB por satélite.

### Cited Findings
- [V, sondeo] Argentina, totales de CSV por país: MODIS 2000–2025 ≈130,2 MiB; VIIRS SNPP 2012–2025 ≈221,1 MiB; VIIRS NOAA-20 2018–2025 ≈135,7 MiB. — sondeo HTTP propio (HEAD) en `https://firms.modaps.eosdis.nasa.gov/data/country/...`
- [V, sondeo] Tamaños **descomprimidos** sumados de todos los CSV por país, leídos del central directory de los ZIP con lectura parcial por Range:

  | Archivo | Global (todas las entradas) | Sudamérica (13 países + Guayana Francesa) |
  |---|---|---|
  | `modis_2023_all_countries.zip` | 355,4 MiB (209 entradas) | 51,6 MiB (Brasil 27,5; Bolivia 7,8; Venezuela 5,1; Argentina 3,7; Paraguay 2,7) |
  | `viirs-snpp_2023` | 1637,4 MiB | 193,7 MiB (Brasil 102,2; Bolivia 27,3; Venezuela 21,1; Argentina 13,1) |
  | `viirs-jpss1_2023` | 1643,5 MiB | 193,8 MiB |
  | `modis_2024` | 368,8 MiB | 76,2 MiB (Brasil 40,6; Bolivia 16,6) |
  | `viirs-jpss1_2024` | 1736,7 MiB | 305,6 MiB (Brasil 155,0; Bolivia 73,6; Venezuela 30,6) |

  — sondeo HTTP propio sobre [modis_2023_all_countries.zip](https://firms.modaps.eosdis.nasa.gov/data/country/zips/modis_2023_all_countries.zip) y equivalentes
- [V, sondeo] Ratio de compresión ZIP ≈4,5× (MODIS 2023: 355 MiB → 78 MiB; NOAA-20 2023: 1643 MiB → 362 MiB). — sondeo HTTP propio
- [V, sondeo] Una fila de CSV pesa ~80–82 bytes, según las líneas de muestra de MODIS y VIIRS (sección 3). — sondeo HTTP propio
- [V] El sample del tutorial FIRMS, VIIRS SNPP global de ~20 h (12 jul 2023), pesa ~6 MB. — [FIRMS Academy: Data Ingest](https://firms.modaps.eosdis.nasa.gov/content/academy/data_ingest/firms_data_ingest.html)
- [V, sondeo] Feeds NRT de 7 días al 13 nov 2026: Sudamérica MODIS 1,56 MB, NOAA-20 5,8 MB, NOAA-21 5,4 MB; global MODIS 6,7 MB y NOAA-20 37,0 MB. — sondeo HTTP propio
- [V] FIRMS eligió el producto VIIRS 375 m por "the greater number of fires detected". — [Earthdata VIIRS 375 m](https://www.earthdata.nasa.gov/data/instruments/viirs/viirs-i-band-375-m-active-fire-data)

### Inferences
- [I] **Filas estimadas**, a ~81 B/fila MODIS y ~82 B/fila VIIRS:
  - Argentina: MODIS 2023 ≈48 k, 2020 ≈123 k (máximo), total 2000–2025 ≈1,7 M. NOAA-20 2023 ≈164 k, 2020 ≈436 k. Total Argentina ≈6,3 M filas.
  - Global 2023: MODIS ≈4,6 M; SNPP ≈20,9 M; NOAA-20 ≈21,0 M.
  - Sudamérica 2023: MODIS ≈0,67 M; VIIRS ≈2,5 M por satélite. Sudamérica 2024 (año de mucha quema): MODIS ≈1,0 M; NOAA-20 ≈3,9 M.
- [I] **VIIRS genera ~4–5× más filas que MODIS por satélite.** Argentina 2023: 13,5 MB vs 3,9 MB. Hay que tenerlo en cuenta al armonizar conteos.
- [I] **Histórico completo de Sudamérica** con los 4 sensores: del orden de 80–100 M filas y ~7–8 GB de CSV. En Parquet (zstd) quedaría en ~1–1,5 GB. Es factible en una noche si la descarga es buena, pero para la hackathon conviene limitarse a Argentina o pre-agregar.
- [I] **Pre-agregación para el calendario:** un cubo diario por celda (p. ej. H3 res 5–6 o grilla 0,1°) × sensor × día reduce millones de filas a cientos de miles. Para el CSV de descarga se puede guardar el detalle en GeoParquet particionado por año y sensor.
- [I] **DuckDB:** `read_csv_auto` sobre ~500 MB tarda segundos a pocos minutos en una laptop. El cuello de botella es la descarga (~0,5 GB para Argentina), no el cómputo.

### Gaps
- No tengo conteos oficiales de filas por año: los estimé desde bytes. Para obtenerlos exactos hay que descargar los archivos (con permiso).
- No verifiqué tamaños de ZIP de todos los años (solo 2023, 2024 y 2025) ni el histórico de Sudamérica completo.

---

## 8. Latencia NRT vs RT/URT vs SP, cuándo SP reemplaza a NRT y consistencia al mezclar

### Takeaway
- NRT: ≤3 h, "best effort".
- RT: ~30 min. URT: <1–5 min, solo US/Canada; se borran a las 6 h o cuando llega el NRT.
- SP reemplaza a NRT con un lag que FIRMS indica distinto según la página: "~5 months" en Download y "2–3 month lag" en el FAQ.

Al mezclar hay diferencias de versión (6.1NRT vs 61.03; 2.0NRT vs 2) y de filtrado: el NRT VIIRS elimina los nocturnos de baja confianza en la SAMA, que cubre Argentina.

### Cited Findings
- [V] NRT "within 3 hours of observation" (best effort); RT ~30 min; URT ~5 min. Otra sección del FAQ dice que URT llega en un minuto, así que el FAQ es inconsistente. "Standard ML files [...] available through FIRMS with a 2-3 month lag". "The primary difference between these products comes down to speed versus accuracy." — [FIRMS FAQ](https://www.earthdata.nasa.gov/data/tools/firms/faq)
- [V] "NRT data are replaced with standard science quality data [...] with approximately a 5 month lag". — [FIRMS Archive Download](https://firms.modaps.eosdis.nasa.gov/download/)
- [V] RT/URT se eliminan al procesarse el NRT o a las 6 h. URT está disponible en "less than 60 seconds" para gran parte de US/Canada. — [FIRMS API area](https://firms.modaps.eosdis.nasa.gov/api/area/)
- [V] En la página missing_data, el NRT solo se muestra a partir de la última fecha SP disponible de cada satélite. — [FIRMS API missing_data](https://firms.modaps.eosdis.nasa.gov/api/missing_data/)
- [V] SAMA: los píxeles nocturnos de baja confianza VIIRS ocurren solo en ~11°E–110°W, 7°N–55°S, y "have been removed from the NRT data distributed by FIRMS". — [Earthdata VIIRS 375 m](https://www.earthdata.nasa.gov/data/instruments/viirs/viirs-i-band-375-m-active-fire-data); también [GEE NASA_LANCE_NOAA20_VIIRS_C2](https://developers.google.com/earth-engine/datasets/catalog/NASA_LANCE_NOAA20_VIIRS_C2?hl=de)
- [V] Las alertas por email NRT se envían en ~3 h para MODIS y ~4 h para VIIRS. — [FIRMS FAQ](https://www.earthdata.nasa.gov/data/tools/firms/faq)
- [V, sondeo] Valores de `version` en los CSV SP por país: MODIS `61.03`, VIIRS `2`. — sondeo HTTP propio

### Inferences
- [I] Toda Argentina (≈22°S–55°S, 53°W–74°W) cae dentro de la región SAMA. Por eso, en la serie VIIRS de FireSync, el tramo SP puede tener nocturnos `l` que el tramo NRT no tiene. Para consistencia: filtrar `confidence != 'l'` de noche en toda la serie, o directamente excluir la confianza baja.
- [I] Regla de ingesta sugerida: guardar `source_product` (SP/NRT), `version` y `satellite`. Al llegar SP nuevo, reemplazar el NRT del mismo rango de fechas por sensor, sin unir ambos (si no, hay duplicados). Usar data_availability para conocer el corte.
- [I] Los NRT de MODIS no tienen la columna `type` (0 vegetación presunta, 1 volcán, 2 otra fuente estática terrestre, 3 offshore), que sí trae el SP. Lo sé por conocimiento previo; verifiqué que la columna existe en los CSV por país. Esto afecta los filtros de fuentes estáticas.
- [I] El lag efectivo actual parece de 2–5 meses: los archivos por país de 2025 se regeneraron el 10 oct 2026.

### Gaps
- Hay una contradicción entre "2–3 month lag" (FAQ) y "approximately 5 month lag" (Download) y no está resuelta. data_availability daría la fecha real.
- No encontré documentación cuantitativa de cuántas detecciones cambian entre NRT y SP.

---

## 9. Licencias, citas, DOIs y etiqueta de uso

### Takeaway
Los datos NASA son abiertos: CC0 por defecto para misiones NASA, sin restricciones, aunque se pide fuertemente citarlos y reconocer a NASA y FIRMS. No encontré ninguna cláusula de "no redistribuir". Al redistribuir datos LANCE/FIRMS hay que incluir o linkear el disclaimer de LANCE. La etiqueta es respetar el cupo de MAP_KEY y, para tráfico alto, usar GIBS o servir copia propia.

### Cited Findings
- [V] "Unless marked otherwise, data provided from a NASA-led mission are licensed as Creative Commons Zero (CC0)". Se pide "cite the datasets within the text of the publication" y "data users are very strongly urged to cite the data used". "NASA material may not be used to suggest or imply endorsement by NASA." — [Earthdata Data Use Guidance](https://www.earthdata.nasa.gov/engage/open-data-services-software-policies/data-use-guidance)
- [V] Página MCD14DL: "This dataset is openly shared, without restriction, in accordance with the EOSDIS Data Use and Citation Guidance". Formatos listados: TXT, SHP, KML, WMS; "only the TXT and SHP files contain all the attributes". DOI C6.1 `10.5067/FIRMS/MODIS/MCD14DL.NRT.0061`, que reemplazó a `...NRT.006` en abril 2021. **La cita de ejemplo de esa página tiene el título mal puesto ("VIIRS (NOAA-21/JPSS-2)...").** — [Earthdata MCD14DL](https://www.earthdata.nasa.gov/learn/find-data/near-real-time/firms/mcd14dl); [MODAPS MCD14DL](https://modaps.modaps.eosdis.nasa.gov/services/about/products/c61-nrt/MCD14DL-NRT.html)
- [V] FAQ de FIRMS: para publicaciones, "We acknowledge the use of imagery from the NASA LANCE FIRMS..." (con link y mención a ESDIS); para captions, "NASA FIRMS". "NASA promotes full and open sharing of data". Hay que leer el LANCE Disclaimer. — [FIRMS FAQ](https://www.earthdata.nasa.gov/data/tools/firms/faq)
- [V] GEE FIRMS: si se provee data LANCE/FIRMS a terceros, hay que seguir las guías LANCE de citation, acknowledgements y disclaimer, e incluir o linkear el disclaimer. — [GEE catalog: FIRMS](https://developers.google.com/earth-engine/datasets/catalog/FIRMS)
- [V, CMR] DOIs oficiales:

  | Producto | DOI |
  |---|---|
  | MCD14DL NRT C6.1 | 10.5067/FIRMS/MODIS/MCD14DL.NRT.0061 |
  | VNP14IMGTDL_NRT | 10.5067/FIRMS/VIIRS/VNP14IMGT_NRT.002 |
  | VJ114IMGTDL_NRT | 10.5067/FIRMS/VIIRS/VJ114IMGT_NRT.002 |
  | VJ214IMGTDL_NRT | 10.5067/FIRMS/VIIRS/VJ214IMGT_NRT.002 |
  | MOD14 | 10.5067/MODIS/MOD14.061 |
  | MYD14 | 10.5067/MODIS/MYD14.061 |
  | VNP14IMG | 10.5067/VIIRS/VNP14IMG.002 |
  | VJ114IMG | 10.5067/VIIRS/VJ114IMG.002 |
  | VJ214IMG | 10.5067/VIIRS/VJ214IMG.002 |

  — [CMR](https://cmr.earthdata.nasa.gov/search/collections.umm_json?short_name=VNP14IMG)
- [V] Paper base de VIIRS 375 m: Schroeder et al. (2014), RSE 143, doi:10.1016/j.rse.2013.12.008. — [Earthdata VIIRS 375 m](https://www.earthdata.nasa.gov/data/instruments/viirs/viirs-i-band-375-m-active-fire-data)
- [V] Etiqueta: la MAP_KEY existe por "heavy server resource demand". Para "+1000s/minute", FIRMS recomienda NASA GIBS WMS/WMTS/MVT o descargar los datos y montar un servicio propio. El country API se deshabilitó por exceso de uso (ver sección 1). — [FIRMS map_key](https://firms.modaps.eosdis.nasa.gov/api/map_key/); [FIRMS WMS/WFS tutorial](https://www.earthdata.nasa.gov/learn/tutorials/firms-information-web-mapping-service-wms-web-feature-service-wfs)

### Inferences
- [I] Texto de acknowledgement sugerido para FireSync. Es la redacción habitual de FIRMS que recuerdo; verificar la forma exacta en el FAQ: "We acknowledge the use of data and/or imagery from NASA's Fire Information for Resource Management System (FIRMS) (https://earthdata.nasa.gov/firms), part of NASA's Earth Science Data and Information System (ESDIS)." Agregar los DOIs de cada producto usado. Para el histórico SP MODIS la cita es MCD14ML; para VIIRS SP, VNP14IMG/VJ114IMG/VJ214IMG.
- [I] Redistribuir el CSV filtrado en la app está permitido (CC0 / "without restriction"), con cita y link al disclaimer.

### Gaps
- No obtuve el texto completo y literal del acknowledgement de FIRMS: el FAQ venía truncado en la extracción.
- No encontré el DOI de MCD14ML (SP vectorial MODIS) ni de los productos SP vectoriales VIIRS que distribuye FIRMS, si es que existen como colección aparte.
- No leí el texto del LANCE Disclaimer.

---

## 10. FIRMS WMS / WFS en Leaflet o MapLibre

### Takeaway
Hay WMS (EPSG:4326 y 3857, actualizado cada 15 min) con capas 24h/48h/72h/7d por sensor, WMS-Time (hasta 31 días por request, incluido `fires_viirs_snpp` para histórico) y WFS por región. Todo requiere MAP_KEY y consume el mismo cupo de 5000 transactions por 10 minutos. Para mucho tráfico conviene GIBS o tiles propios.

### Cited Findings
- [V] WMS:
  - Patrón: `https://firms.modaps.eosdis.nasa.gov/mapserver/wms/fires/YourMapKey/<layer>/?REQUEST=GetMap&WIDTH=...&HEIGHT=...&BBOX=...`. Existe GetCapabilities. Proyecciones EPSG:4326 y EPSG:3857 (900913). Actualización cada 15 minutos.
  - Capas: `fires_viirs_24|48|72|7`, `fires_viirs_noaa20_*`, `fires_viirs_noaa21_*`, `fires_modis_*`, `fires_aqua_*`, `fires_terra_*`, `fires_landsat_*`; time-since-detection `tsd_4_*` y `tsd_9_*` (viirs, noaa20, noaa21, modis, landsat); `modis_burned_area` (con mes `2020-01`).
  - WMS-Time: capas `fires_modis`, `fires_terra`, `fires_aqua`, `fires_viirs`, `fires_viirs_snpp`, `fires_viirs_noaa20`, `fires_viirs_noaa21`, con `TIME=YYYY-MM-DD` o `TIME=inicio/fin`, hasta 31 días por request. Sin datos devuelve una imagen en blanco.
  - Requiere MAP_KEY; el límite es 5000 transactions por 10 minutos.
  
  — [FIRMS WMS info](https://firms2.modaps.eosdis.nasa.gov/mapserver/wms-info/)
- [V] Ejemplo oficial: `https://firms.modaps.eosdis.nasa.gov/mapserver/wms/fires/<YourMapKey>/fires_viirs_noaa20_7/?REQUEST=GetMap&WIDTH=1024&HEIGHT=512&BBOX=-180,-90,180,90`. WFS: VIIRS y MODIS 24h y 7d; LANDSAT 24h y 7d. "Users must register to obtain a MapKey". Para "+1000s/minute", usar GIBS o un servicio propio. — [FIRMS WMS/WFS tutorial](https://www.earthdata.nasa.gov/learn/tutorials/firms-information-web-mapping-service-wms-web-feature-service-wfs)
- [V, sondeo] `https://firms.modaps.eosdis.nasa.gov/mapserver/wfs/South_America/<KEY>/?SERVICE=WFS&REQUEST=GetCapabilities` respondió 200 `text/xml` a HEAD (con key inválida; no inspeccioné el contenido). — sondeo HTTP propio
- [V] Existe un tutorial para ingerir el WFS de FIRMS en QGIS. — [Ingest FIRMS WFS in QGIS](https://earthdata.nasa.gov/learn/tutorials/ingest-firms-wfs-qgis-customize-symbology)

### Inferences
- [I] Leaflet (sin probar):
  ```js
  L.tileLayer.wms('https://firms.modaps.eosdis.nasa.gov/mapserver/wms/fires/MAP_KEY/', {
    layers: 'fires_viirs_noaa20_24', format: 'image/png', transparent: true, version: '1.1.1'
  }).addTo(map);
  ```
  Para histórico: `layers: 'fires_viirs_noaa20', TIME: '2026-10-01/2026-10-31'`.
- [I] MapLibre: fuente `raster` con tiles `.../mapserver/wms/fires/MAP_KEY/?SERVICE=WMS&REQUEST=GetMap&VERSION=1.1.1&LAYERS=fires_modis_24&SRS=EPSG:3857&BBOX={bbox-epsg-3857}&WIDTH=256&HEIGHT=256&FORMAT=image/png&TRANSPARENT=true`.
- [I] Cada tile es una request contra el cupo. Con varios usuarios, 5000 por 10 min se agotan rápido y la key queda expuesta en el cliente. Para la demo es mejor renderizar los puntos propios (GeoJSON/vector tiles desde DuckDB) y usar WMS solo como capa opcional, o pasar por un proxy con caché.

### Gaps
- No verifiqué los `outputFormat` del WFS (GeoJSON/CSV) ni la lista exacta de nombres de región del WFS.
- No verifiqué si WMS y WFS cuentan una transaction por tile o por request.

---

## 11. Verificación de afirmaciones previas del equipo

### Takeaway
Las afirmaciones previas son en su mayoría **incorrectas o incompletas**. Las descargas FIRMS no requieren necesariamente Earthdata Login. FIRMS sí documenta MAP_KEY y cuotas (5000 transactions por 10 minutos). La cita es recomendada y obligatoria al redistribuir. Los formatos "text, shapefile, KML, WMS" son correctos para la ficha de producto NRT, pero incompletos.

### Cited Findings
- [V] **"FIRMS downloads require Earthdata Login": falso o parcial.**
  - El Archive Download acepta Earthdata Login **o** un código por email ([Download](https://firms.modaps.eosdis.nasa.gov/download/)).
  - La MAP_KEY se obtiene solo con email ([map_key](https://firms.modaps.eosdis.nasa.gov/api/map_key/)).
  - Los CSV por país y los feeds NRT `data/active_fire` se bajan sin auth (sondeo HEAD).
  - Solo las carpetas de archivos diarios NRT requieren Earthdata Login ([FAQ](https://www.earthdata.nasa.gov/data/tools/firms/faq)).
- [V] **"the page does not indicate quotas/request limits nor mention an API key": falso para la API y los mapservers.** Las páginas de la API dicen "MAP_KEY limit is 5000 transactions / 10-minute interval" ([area](https://firms.modaps.eosdis.nasa.gov/api/area/), [map_key](https://firms.modaps.eosdis.nasa.gov/api/map_key/)). Es **cierto solo para la página del Archive Download**, que no indica cuotas ni turnaround ([Download](https://firms.modaps.eosdis.nasa.gov/download/)).
- [V] **"data sharing requires citing the source": correcto en espíritu.** NASA "very strongly urge[s]" citar ([Data Use Guidance](https://www.earthdata.nasa.gov/engage/open-data-services-software-policies/data-use-guidance)). Al pasar datos LANCE/FIRMS a terceros hay que seguir las guías de citación y disclaimer de LANCE ([GEE FIRMS](https://developers.google.com/earth-engine/datasets/catalog/FIRMS)). La licencia base es CC0, así que no es un requisito legal estricto.
- [V] **"formats for the VIIRS SNPP product: text, shapefile, KML, WMS": verificado para la ficha MCD14DL** ("TXT, SHP, KML, and WMS"; solo TXT y SHP tienen todos los atributos) ([MCD14DL](https://www.earthdata.nasa.gov/learn/find-data/near-real-time/firms/mcd14dl)). La página VIIRS 375 m solo dice "GIS formats" ([VIIRS 375 m](https://www.earthdata.nasa.gov/data/instruments/viirs/viirs-i-band-375-m-active-fire-data)). FIRMS además ofrece CSV (API y archivos por país), JSON y SHP (Archive), KML footprints y WFS.

### Inferences
- [I] Es muy probable que la ficha VNP14IMGTDL_NRT liste los mismos formatos que MCD14DL, pero no la abrí ([MODAPS VNP14IMGTDL_NRT](https://modaps.modaps.eosdis.nasa.gov/services/about/products/viirs-land-c2-nrt/vnp14imgtdl_nrt.html)).

### Gaps
- No abrí la ficha específica de VNP14IMGTDL_NRT para confirmar su lista de formatos.

---

## 12. Herramientas recomendadas y snippets (Python / DuckDB / GeoParquet)

### Takeaway
El stack sugerido es pandas o DuckDB para ingesta, la extensión `spatial` de DuckDB y GeoParquet para recortar por polígono y exportar, y httpx/requests con backoff para la API. Ningún snippet fue ejecutado (no hay Python instalado en esta máquina); todos son [I] y deben probarse.

### Cited Findings
- [V] El tutorial FIRMS usa `pd.read_csv(url)` y combina `acq_date` con `acq_time` (rellenado con ceros) usando `pd.to_datetime(..., format='%Y-%m-%d %H%M')`. — [FIRMS Academy: Data Ingest](https://firms.modaps.eosdis.nasa.gov/content/academy/data_ingest/firms_data_ingest.html)
- [V] Las bounding boxes regionales oficiales están en `https://firms.modaps.eosdis.nasa.gov/active_fire/coordinates.html`. — [FIRMS Academy: Data Ingest](https://firms.modaps.eosdis.nasa.gov/content/academy/data_ingest/firms_data_ingest.html)
- [V] Patrones de URL de la API y de los CSV por país usados abajo: ver secciones 1 y 3.

### Inferences
- [I] **Llamada a la API de área (Python, sin probar):**
  ```python
  import io, time, requests, pandas as pd
  MAP_KEY = "..."  # desde variable de entorno, nunca en el frontend
  BBOX = "-73.6,-55.1,-53.6,-21.8"  # Argentina aprox. (W,S,E,N)
  def firms_area(source, day_range=5, date=None):
      url = f"https://firms.modaps.eosdis.nasa.gov/api/area/csv/{MAP_KEY}/{source}/{BBOX}/{day_range}"
      if date: url += f"/{date}"           # YYYY-MM-DD; devuelve date .. date+day_range-1
      r = requests.get(url, timeout=120)
      if r.status_code == 403:             # cupo agotado / key inválida
          time.sleep(600); r = requests.get(url, timeout=120)
      r.raise_for_status()
      df = pd.read_csv(io.StringIO(r.text))
      df["source"] = source
      return df
  # status del cupo:
  # requests.get(f"https://firms.modaps.eosdis.nasa.gov/mapserver/mapkey_status/?MAP_KEY={MAP_KEY}").json()
  # disponibilidad:
  # pd.read_csv(f"https://firms.modaps.eosdis.nasa.gov/api/data_availability/csv/{MAP_KEY}/ALL")
  ```
  Para rellenar 2026: iterar `date` desde 2026-01-01 en pasos de 5 días, para cada SOURCE: `MODIS_SP`/`MODIS_NRT`, `VIIRS_NOAA20_SP`/`_NRT`, `VIIRS_NOAA21_SP`/`_NRT` y `VIIRS_SNPP_SP`/`_NRT` (este último hasta 2026-11-02).
- [I] **Carga de CSV anuales por país con DuckDB (sin probar):**
  ```python
  import duckdb
  con = duckdb.connect("firesync.duckdb")
  con.execute("INSTALL spatial; LOAD spatial;")
  base = "https://firms.modaps.eosdis.nasa.gov/data/country"
  modis = [f"{base}/modis/{y}/modis_{y}_Argentina.csv" for y in range(2000, 2026)]
  n20   = [f"{base}/viirs-jpss1/{y}/viirs-jpss1_{y}_Argentina.csv" for y in range(2018, 2026)]
  snpp  = [f"{base}/viirs-snpp/{y}/viirs-snpp_{y}_Argentina.csv" for y in range(2012, 2026)]
  con.execute("INSTALL httpfs; LOAD httpfs;")
  con.execute(f"""
    CREATE TABLE modis AS
    SELECT latitude, longitude, acq_date::DATE AS acq_date, lpad(acq_time::VARCHAR,4,'0') AS acq_time,
           satellite, 'MODIS' AS sensor, confidence::VARCHAR AS confidence, frp, daynight, type,
           version::VARCHAR AS version
    FROM read_csv({modis}, union_by_name=true, types={{'confidence':'VARCHAR','version':'VARCHAR'}});
  """)
  # análogo para VIIRS (bright_ti4/bright_ti5, confidence l/n/h); luego UNION ALL en una tabla 'hotspots'
  con.execute("""COPY (SELECT *, ST_Point(longitude, latitude) AS geom FROM modis)
                 TO 'modis_arg.parquet' (FORMAT PARQUET, COMPRESSION ZSTD);""")
  ```
  Conviene bajar primero los CSV a disco (≈0,5 GB para Argentina) y leer local, en vez de usar httpfs en cada arranque. Para recortar por un polígono provincial: `ST_Read('provincias.geojson')` + `ST_Within`.
- [I] **Esquema armonizado sugerido:** `date`, `datetime_utc`, `lat`, `lon`, `sensor` (MODIS/VIIRS), `satellite` (Terra/Aqua/N/N20/N21), `confidence_norm` (MODIS: <30 → low, 30–79 → nominal, ≥80 → high; VIIRS: l/n/h), `frp`, `daynight`, `type`, `product_level` (SP/NRT), `version`. El calendario se agrega como `count(*)` y `sum(frp)` por día × región (o celda H3) × sensor.
- [I] **GeoParquet:** `geopandas.GeoDataFrame(df, geometry=gpd.points_from_xy(df.longitude, df.latitude), crs=4326).to_parquet("x.parquet")`. Alternativa: DuckDB spatial ≥1.1 con `COPY ... (FORMAT PARQUET)` y columna geometry, que escribe metadatos GeoParquet.

### Gaps
- Ningún snippet fue ejecutado; hay que validar los tipos de columnas (p. ej. `confidence` numérico vs texto, `acq_time` como int) y el comportamiento de `read_csv` con listas de URLs.
- Los umbrales de confianza MODIS (30/80) son la convención habitual de FIRMS según mi conocimiento; no los verifiqué hoy en la página de atributos.
