# Datos meteorológicos/climáticos para explicar picos de hotspots en FireSync + términos de uso de servicios no gubernamentales de EE. UU.

> Notas de investigación al 13-nov-2026. No es asesoramiento legal. Convención: **[V]** = verificado en la fuente citada (URL); **[I]** = inferencia propia o dato de conocimiento previo no re-verificado hoy; **[3P]** = dato de fuente secundaria/terceros (verificar). Caso demo: Chilecito, La Rioja (aprox. lat −29.16, lon −67.50), julio 2026.

---

## 1. Meteomatics Weather API (oferta hackathon): acceso, límites, profundidad histórica, parámetros, sintaxis, formatos y términos

### Takeaway
La cuenta hackathon se obtiene con el formulario de la página Meteomatics–NASA Space Apps 2026 (acceso inmediato, solo durante el challenge). Cada request que devuelve datos cuenta como 1 query, aunque pida hasta 10 parámetros y una serie temporal completa. Las 1.000 queries/día alcanzan con holgura para el demo. En Argentina no hay modelo nativo de 1 km (EURO1k/US1k cubren solo Europa/EE. UU.): el histórico es ERA5 (desde 1940) con downscaling estadístico a ~90 m. El riesgo principal es contractual: las GTC de Meteomatics AG (agosto 2026) prohíben "display… publication… or other dissemination" a terceros sin consentimiento escrito y limitan el derecho de uso a la duración del acuerdo. Para una app pública que siga online después del hackathon, Meteomatics es la opción menos segura legalmente.

### Cited Findings

**Acceso a la cuenta hackathon**
- [V] La página oficial de Meteomatics para el NASA Space Apps Challenge 2026 dice: "Please use ONLY the form on this page to access the Weather API. Doing so grants you data access immediately." Formulario: https://www.meteomatics.com/en/meteomatics-and-nasa-space-apps-challenge/#form. El acceso es gratuito y dura lo que dure el Space Apps Challenge; la página no da fechas exactas de fin. Para registrarse hay que aceptar las General Terms and Conditions y la Privacy Policy de Meteomatics — [Meteomatics & NASA Space Apps](https://meteomatics.com/en/meteomatics-and-nasa-space-apps-challenge)
- [V] La página de Global Offers de Space Apps 2026 exige login ("You must be logged in to view this content."), así que no pude leer el texto exacto de la oferta ni su link — [Space Apps Global Offers](https://www.spaceappschallenge.org/2026/global-offers/)
- [V] Meteomatics patrocina cada año el NASA Space Apps Challenge con acceso gratuito a su Weather API — [Meteomatics news: Ometeotl Crop Connect](https://meteomatics.com/en/news/ometeotl-crop-connect)
- [V] Fuera del hackathon existe la cuenta "Free Basic": 500 queries/día, sin límite de tiempo, 15 parámetros básicos, 1 sola ubicación por query, 50 queries/minuto y 10 en paralelo — [Meteomatics free basic account](https://meteomatics.com/en/sign-up-weather-api-free-basic-account); [Available Parameters](https://meteomatics.com/en/api/available-parameters)

**Qué significa "1.000 queries/día"**
- [V] Apéndice de la API: "Each query that is sent to the API which actually requests data increases your query count" (el límite lo fija el contrato). "You can request 10 locations and 10 parameters with one query." Con la "area option" se puede ampliar a 10.000 ubicaciones por query. Se recomienda no pasar de 2.000 caracteres por GET (POST no tiene ese límite). Una query que no termina en 5 minutos se corta con error 408. "The limits stated in your contract always take precedence" — [Meteomatics API Appendix](https://meteomatics.com/en/api/appendix)
- [V] El consumo y los límites se consultan en el endpoint `user_stats` y en formato JSON en https://api.meteomatics.com/user_stats_json — [Meta requests](https://www.meteomatics.com/en/api/request/meta-requests/) (vía resultado de búsqueda)

**Profundidad histórica y resolución (Argentina)**
- [V] `ecmwf-era5`: ERA5 con downscaling, "from 1940 to present", 0.0012° (~90 m), horario. Es decir, empieza en 1940, no en 1979 — [Meteomatics data sources](https://www.meteomatics.com/en/api/request/optional-parameters/data-source/)
- [V] `mm-euro1k` (EURO1k) cubre solo Europa, y `mm-us1k` (US1k) cubre EE. UU., parte del sur de Canadá y el Golfo de México. Ambos son nativos de 1 km, con downscaling a ~90 m y pronóstico de 72 h y 48 h respectivamente. La página no da detalles para Sudamérica — [Meteomatics data sources](https://www.meteomatics.com/en/api/request/optional-parameters/data-source/)
- [V] Los modelos globales (`ecmwf-ifs`, `ncep-gfs`, `dwd-icon-global`, `ecmwf-aifs`) se entregan a 0.0012° (~90 m) mediante downscaling con uso de suelo, suelo, terreno y datos astronómicos. `mix` combina radar, satélite, pronósticos, reanálisis, etc. La página no dice si `mix` es la fuente por defecto — [Meteomatics data sources](https://www.meteomatics.com/en/api/request/optional-parameters/data-source/)
- [V] `chc-chirps3`: precipitación de 1981 al presente, 0.05° (~5 km), diaria — [Meteomatics data sources](https://www.meteomatics.com/en/api/request/optional-parameters/data-source/)
- [V] Meteomatics anuncia "down to 90 m resolution" y un histórico "from 1940" basado en ERA5 — [Meteomatics llms-full.txt](https://www.meteomatics.com/llms-full.txt)

**Parámetros relevantes (nombres exactos)**
- [V] Confirmados en la guía de inicio: `t_2m:C`, `precip_1h:mm`, `wind_speed_10m:ms` — [Getting started](https://www.meteomatics.com/en/api/getting-started/)
- [V] Índices de riesgo de incendio documentados (página "Forest Fire Risk Indices"):
  - `forest_fire_warning:idx`: 0–1, calculado a partir de la humedad de tres capas de suelo. El riesgo sube por encima de 0.5.
  - `fosberg_fire_weather_index:idx`: 0–100. Usa solo el tiempo presente, sin condiciones previas, e indica riesgo de incendios de pastizal/arbustal.
  - `drought_index:idx`: de −4 a 4, basado en percentiles respecto de la media de años previos. Los valores negativos indican seco.
  - La página **no** lista FWI canadiense, FFMC, DMC, DC, ISI ni BUI, ni indica qué modelo o profundidad histórica tienen estos índices.
  — [Forest fire risk indices](https://www.meteomatics.com/en/api/available-parameters/weather-parameter/forest-fire-risk-indices/)
- [V] Hay categorías de parámetros para humedad, punto de rocío, viento, precipitación, evaporación (evapotranspiración), suelo (humedad del suelo) y estabilidad atmosférica. No hay categoría para VPD — [Available parameters](https://www.meteomatics.com/en/api/available-parameters/)

**Sintaxis URL**
- [V] Estructura: `api.meteomatics.com/validdatetime/parameters/locations/format?optionals`. Autenticación con usuario y contraseña recibidos por email. Ejemplos oficiales:
  - Punto: `https://api.meteomatics.com/2026-11-12T00:00:00Z/t_2m:C/52.520551,13.461804/html`
  - Serie horaria: `.../2026-11-12T00:00:00Z--2026-11-15T00:00:00Z:PT1H/t_2m:C,precip_1h:mm,wind_speed_10m:ms/52.520551,13.461804/json`
  - Grilla: `.../2026-11-12T00:00:00Z/t_2m:C/50,10_40,20:0.02,0.04/html`
  - Hay un URL Creator en https://meteomatics.com/url-creator/
  — [Getting started](https://www.meteomatics.com/en/api/getting-started/)
- [V] Formatos de respuesta: CSV, JSON, XML, PNG, WebP, GeoTIFF, HTML, HTML-Map y NetCDF — [Meteomatics llms-full.txt](https://www.meteomatics.com/llms-full.txt)

**Términos (Meteomatics AG GTC, versión "August 2026")**
- [3P] Según el imprint de Meteomatics, a empresas en la UE se les aplican las T&C de Meteomatics GmbH, a empresas en Suiza o fuera de la UE las de Meteomatics AG, y a empresas en el Reino Unido las de Meteomatics Ltd — [Meteomatics imprint](https://flightweather.meteomatics.com/en/imprint/) (vía snippet de búsqueda)
- [V] GTC AG:
  - 3.1.1: derecho de uso "non-exclusive and non-transferable".
  - 3.1.2: "limited temporally to the duration of the Agreement", además de un territorio y propósito acordados.
  - 3.2.1.3: prohíbe "display, loan, publication, transfer of possession or other dissemination" a terceros sin consentimiento previo por escrito.
  - 3.2.1.2: prohíbe obras derivadas basadas en especificaciones de Meteomatics.
  - 3.2.1.4: prohíbe quitar avisos de propiedad.
  - 9.1.2: uso "solely for internal business purpose" o el propósito del acuerdo.
  - 6.1–6.2: los servicios de prueba duran el plazo de la oferta, pueden discontinuarse en cualquier momento y se entregan "as is".
  - 15.2: renovación automática salvo aviso con 3 meses de antelación (aplica a contratos pagos).
  - 17.2: ley suiza.
  - No hay cláusula explícita sobre caching ni requisito de atribución específico.
  — [GTC Meteomatics AG](https://meteomatics.com/en/gtc-meteomatics-ag)

### Inferences
- [I] **Consumo en el demo**: una serie horaria de julio 2026 para un punto con hasta 10 parámetros cuesta 1 query. Calendario + panel de clima para un área ≈ 1–5 queries por consulta de usuario, así que 1.000/día alcanza si se cachea por (bbox, mes).
- [I] Las grillas (`lat_max,lon_min_lat_min,lon_max:res_lat,res_lon`, orden deducido del ejemplo `50,10_40,20:0.02,0.04`) probablemente superan el límite de 10 ubicaciones por query sin la "area option". No está confirmado si la cuenta hackathon la incluye. Plan B: hacer queries de punto en el centroide del área o en 3–10 puntos.
- [I] URL sugerida para el demo (verificar los nombres no confirmados con el URL Creator):
  `https://api.meteomatics.com/2026-07-01T00:00:00Z--2026-07-31T23:00:00Z:PT1H/t_2m:C,relative_humidity_2m:p,wind_speed_10m:ms,wind_gusts_10m_1h:ms,precip_1h:mm,fosberg_fire_weather_index:idx,forest_fire_warning:idx,drought_index:idx/-29.16,-67.50/json`
  - Diario: `...T12:00:00Z--...T12:00:00Z:P1D/precip_24h:mm,.../csv`. La sintaxis `P1D` es ISO 8601 y no la vi en el ejemplo oficial.
  - Los nombres `relative_humidity_2m:p`, `wind_gusts_10m_1h:ms` y `precip_24h:mm` vienen del brief del usuario y no los verifiqué en la lista alfabética.
- [I] La resolución "90 m" en Argentina es downscaling estadístico de modelos globales o de ERA5 (~31 km nativo). No agrega información meteorológica real a escala de 1 km. Conviene no presentarla como "1 km" en el pitch.
- [I] **Seguridad**: la autenticación es usuario/contraseña. No hay que ponerlos en el frontend. Conviene usar un proxy backend (Cloud Function/Firebase/Azure Function) o, si existe, un token OAuth de vida corta (no verificado).
- [I] **Riesgo legal**: mostrar datos de Meteomatics en una app pública ("display… publication") puede contradecir 3.2.1.3 salvo que la oferta hackathon lo permita (no encontré términos específicos del hackathon). Para el demo ante jueces el riesgo es bajo. Para dejar la app online después del hackathon conviene una de dos opciones: pedir permiso escrito a Meteomatics, o cambiar a Open-Meteo/ERA5 (CC BY 4.0). También conviene no conservar datos de Meteomatics cacheados tras el fin del acceso (3.1.2).
- [I] Si el equipo participa como personas físicas y no como "empresa", no está claro cuál de las GTC aplica. Asumo AG (fuera de la UE).

### Gaps
- Texto exacto de la oferta en Global Offers (requiere login) y si las "1.000 queries/día" incluyen la "area option", los índices de incendio o todos los modelos.
- Términos específicos del hackathon: si permiten exhibición pública, caching o uso posterior.
- Profundidad histórica y modelo subyacente de `fosberg_fire_weather_index:idx`, `forest_fire_warning:idx` y `drought_index:idx`, y si hay FWI canadiense o "fire danger" en la lista alfabética (no la revisé).
- Si las requests fallidas o meta-requests cuentan como query (el apéndice no lo dice).

---

## 2. Alternativas gratuitas (Open-Meteo, NASA POWER, ERA5/CDS, CEMS/EFFIS/GWIS FWI, SMN, CHIRPS): facilidad, latencia, cobertura y licencias

### Takeaway
Para un build de 2 días, la mejor base es **Open-Meteo Historical Weather API**: sin API key, ERA5/ERA5-Land con ~5 días de retraso, CC BY 4.0 y atribución "Weather data by Open-Meteo.com". El único límite es que el free tier es solo no comercial (10.000 llamadas/día). Para un índice de peligro de incendio "oficial" global, el **CEMS Fire danger indices historical** (FWI y sus componentes, 0.25°, diario desde 1940, CC-BY, DOI 10.24381/cds.0e89c522) es lo mejor, pero exige cuenta en EWDS/CDS y procesar NetCDF/GRIB. Hay que precalcularlo offline para el área demo. NASA POWER (gobierno de EE. UU., 1981→NRT, ~0.5°) es un buen respaldo sin restricciones comerciales. El SMN publica FWI diario para Argentina desde 2000, pero no encontré API.

### Cited Findings

**Open-Meteo Historical Weather API**
- [V] Endpoint `https://archive-api.open-meteo.com/v1/archive`. Fuentes y resoluciones:
  - ERA5: 0.25°, desde 1940, actualización diaria con 5 días de retraso.
  - ERA5-Land: 0.1°, desde 1950, 5 días de retraso.
  - ECMWF IFS: 9 km, desde 2017, sin retraso.
  - CERRA: solo Europa.
  — [Open-Meteo Historical Weather API](https://open-meteo.com/en/docs/historical-weather-api)
- [V] Variables relevantes:
  - Horarias: `temperature_2m`, `relative_humidity_2m`, `dew_point_2m`, `vapour_pressure_deficit`, `wind_speed_10m`, `wind_gusts_10m`, `precipitation`, `soil_moisture_*` y `et0_fao_evapotranspiration`.
  - Diarias: T máx/mín, HR media/máx/mín, `precipitation_sum`, `wind_speed_10m_max`, `wind_gusts_10m_max`, ET0 y humedad del suelo media.
  - Parámetros de consulta: `wind_speed_unit` (kmh por defecto, ms, mph, kn) y `timezone` (tz database o `auto`).
  — [Open-Meteo Historical Weather API](https://open-meteo.com/en/docs/historical-weather-api)
- [V] Citas de las fuentes: ERA5 (Hersbach et al. 2023, doi:10.24381/cds.adbb2d47) y ERA5-Land (Muñoz Sabater 2019, doi:10.24381/CDS.E2161BAC), con la línea "Generated using Copernicus Climate Change Service information…" — [Open-Meteo Historical Weather API](https://open-meteo.com/en/docs/historical-weather-api)
- [V] Términos:
  - Uso gratuito solo no comercial. Cuentan como no comercial los sitios privados o sin fines de lucro sin suscripciones ni anuncios, la investigación pública y el contenido educativo. Las donaciones están permitidas.
  - Límites: 600 llamadas/min, 5.000/h, 10.000/día y 300.000/mes, por IP y por aplicación. En hostings compartidos (Vercel, Netlify, Render) los límites pueden alcanzarse antes.
  - El uso comercial requiere plan pago.
  - Pueden bloquear sin aviso en caso de abuso.
  — [Open-Meteo Terms](https://open-meteo.com/en/terms)
- [V] Licencia CC BY 4.0: se puede compartir y adaptar, dando crédito, enlazando la licencia e indicando cambios. Ejemplo de atribución: "Weather data by Open-Meteo.com" con link a https://open-meteo.com/ junto a donde se muestran los datos. Las fuentes (C3S/Copernicus, ECMWF, etc.) tienen licencias propias. El código está bajo AGPLv3 — [Open-Meteo Licence](https://open-meteo.com/en/licence)

**NASA POWER (gobierno de EE. UU.)**
- [V] Endpoints `/api/temporal/daily/point` (hasta 20 parámetros por request) y `/api/temporal/daily/regional` (1 parámetro, grilla de 0.5°). Datos diarios UTC/LST desde el 01/01/1981 hasta Near Real Time. Formatos NetCDF, ASCII, JSON y CSV (ICASA solo para la comunidad AG). Ejemplo oficial: `/api/temporal/daily/point?parameters=T2M,PS,WS10M&community=AG&longitude=0&latitude=0&start=20170101&end=20170201&format=CSV` — [POWER Daily API](https://power.larc.nasa.gov/docs/services/api/temporal/daily/)
- [V] Responde 429 ante demasiadas requests. Las requests típicas tardan menos de un minuto — [POWER API overview](https://power.larc.nasa.gov/docs/services/api/)

**Copernicus ERA5 vía CDS/EWDS (licencia)**
- [V] Desde el 2 de julio de 2025, la "Licence to use Copernicus Products" del CDS, ADS y EWDS fue reemplazada por CC-BY 4.0. Hay que aceptar los términos por dataset (no aceptarlos implica perder el acceso) y actualizar `cdsapi` — [ECMWF Forum](https://forum.ecmwf.int/t/cc-by-licence-to-replace-licence-to-use-copernicus-products-on-02-july-2025/13464)
- [3P] La aceptación se hace en el formulario de descarga de cada dataset, no por `cdsapi`. Cita tipo: "Copernicus Climate Change Service (2023): ERA5 hourly data on single levels from 1940 to present… DOI: 10.24381/cds.adbb2d47" — [ECMWF Forum](https://forum.ecmwf.int/t/cc-by-licence-to-replace-licence-to-use-copernicus-products-on-02-july-2025/13464); [CASRAI guide](https://casrai.org/guides/copernicus-climate-data-store-c3s)

**CEMS / EFFIS / GWIS – Fire Weather Index**
- [V] Dataset "Fire danger indices historical data from the Copernicus Emergency Management Service":
  - Producido por ECMWF para EFFIS.
  - 15 índices: FWI, DSR, FFMC, DMC, DC, ISI, BUI, Burning index, ERC, KBDI, Fire danger index, etc.
  - Diario desde 1940 al presente, actualizado diariamente a medida que llega el forzante ERA5.
  - Tierra global a 0.25° (reanálisis); miembros de ensamble a 0.5°.
  - NetCDF/GRIB2, licencia CC-BY, DOI 10.24381/cds.0e89c522.
  - La página tiene Login/Register.
  — [EWDS cems-fire-historical-v1](https://ewds.climate.copernicus.eu/datasets/cems-fire-historical-v1)
- [3P] El pronóstico de GWIS calcula FWI a partir de ECMWF (8 km) con 1–9 días de horizonte. GWIS ofrece un "Data Download Service" (catálogo JRC), pero no encontré un endpoint REST público documentado — [GWIS fire danger forecast](https://gwis.jrc.ec.europa.eu/about-gwis/technical-background/fire-danger-forecast); [JRC data catalogue](https://data.jrc.ec.europa.eu/dataset/4b4f1ea6-da7b-4870-9be4-aa5b9a2a4b70); [GWIS data and services](https://gwis.jrc.ec.europa.eu/applications/data-and-services)
- [3P] Las páginas CEMS piden citar el dataset tal como indica el Data Store — [ECMWF Confluence CEMS fire](https://confluence.ecmwf.int/spaces/CEMS/pages/239344103/Fire+danger+indices+historical+data+from+the+Copernicus+Emergency+Management+Service)

**SMN Argentina – índice de peligro de incendios**
- [3P] El SMN mide el peligro de incendio con el FWI canadiense, implementado desde 2000. Publica mapas diarios para el día actual con proyección a 24, 48 y 72 h. Aclara que el FWI debe complementarse con el estado de combustibles vivos y con fenómenos que no contempla (vientos intensos, tormentas secas), y que los valores no significan lo mismo en todas las regiones — [La Voz (vía resultado de búsqueda)](https://grupoclarin-la-voz-prod.cdn.arcpublishing.com/ciudadanos/el-servicio-meteorologico-nacional-lanzo-un-indice-de-peligro-de-incendios-como-verlo-y-que-significa); [Servicio Nacional de Manejo del Fuego](https://www.argentina.gob.ar/interior/ambiente/fuego/servicio-nacional)

**CHIRPS**
- [3P] CHIRPS v3: la página del CHC dice que está en dominio público (registrado en Creative Commons) y a la vez menciona CC BY 4.0. DOI de datos 10.15780/G2JQ0P. CHIRPS v2 está en dominio público según metadatos de NOAA ERDDAP. Cita del algoritmo: Funk et al. 2015, Sci Data 2:150066 — [CHC CHIRPS](https://chc.ucsb.edu/node/497); [NOAA ERDDAP CHIRPS](https://coastwatch.pfeg.noaa.gov/erddap/griddap/chirps20GlobalDailyP05.html)
- [V] CHIRPS3 también está disponible dentro de Meteomatics (`chc-chirps3`, 0.05°, diario desde 1981) — [Meteomatics data sources](https://www.meteomatics.com/en/api/request/optional-parameters/data-source/)

**Tabla comparativa (build de 2 días)**

| Fuente | Esfuerzo de integración | Latencia | Cobertura/resolución en Argentina | Licencia para app pública | Fuente |
|---|---|---|---|---|---|
| Open-Meteo Historical (ERA5/ERA5-Land) | Muy bajo: REST/JSON, sin key | ~5 días (ERA5) | Global; 0.25° / 0.1° | CC BY 4.0. Gratis solo si no comercial | [docs](https://open-meteo.com/en/docs/historical-weather-api), [terms](https://open-meteo.com/en/terms) |
| Meteomatics (hackathon) | Bajo: REST, pero requiere auth y conviene un proxy | Casi tiempo real + histórico | Global con downscaling a ~90 m; 1 km nativo solo en EU/US | Restrictiva: sin difusión a terceros sin consentimiento | [GTC AG](https://meteomatics.com/en/gtc-meteomatics-ag) |
| NASA POWER | Bajo: REST/JSON, sin key | NRT (días, sin número exacto) | Global; ~0.5° | Gobierno de EE. UU. (ver Gaps) | [POWER daily](https://power.larc.nasa.gov/docs/services/api/temporal/daily/) |
| CEMS FWI histórico (EWDS) | Medio-alto: cuenta, aceptar licencia, cdsapi, NetCDF/GRIB | Diario, sigue a ERA5 | Global; 0.25° | CC-BY 4.0 | [EWDS](https://ewds.climate.copernicus.eu/datasets/cems-fire-historical-v1) |
| ERA5 crudo (CDS) | Medio-alto: cola de CDS, NetCDF | ~5 días (según Open-Meteo) | Global; 0.25° | CC-BY 4.0 | [ECMWF forum](https://forum.ecmwf.int/t/cc-by-licence-to-replace-licence-to-use-copernicus-products-on-02-july-2025/13464) |
| SMN FWI | Alto: solo mapas, sin API encontrada | Diario + pronóstico 72 h | Argentina | No verificada | [SNMF](https://www.argentina.gob.ar/interior/ambiente/fuego/servicio-nacional) |
| CHIRPS v3 | Medio: archivos raster; o vía Meteomatics | No verificada | Global 50°S–50°N; 0.05° | Dominio público / CC BY 4.0 | [CHC](https://chc.ucsb.edu/node/497) |

### Inferences
- [I] **Recomendación práctica**:
  - Usar Open-Meteo como fuente por defecto del panel "contexto meteorológico" (T máx, HR mín, viento/ráfaga máx, precipitación diaria y acumulada a 30 días, VPD máx, humedad del suelo y ET0), llamado desde el navegador o con cache server-side por (lat, lon, mes).
  - Usar Meteomatics solo como capa "sponsor" del demo (p. ej. `fosberg_fire_weather_index:idx` y `drought_index:idx`) detrás de un proxy.
  - Precalcular FWI CEMS para la caja de Chilecito (julio 2026, más una climatología de julio para comparar anomalías) y guardarlo como JSON estático, citando DOI y CC-BY.
- [I] Ejemplo Open-Meteo para el demo (los nombres diarios exactos de HR y VPD están deducidos de la doc; verificar):
  `https://archive-api.open-meteo.com/v1/archive?latitude=-29.16&longitude=-67.50&start_date=2026-07-01&end_date=2026-07-31&daily=temperature_2m_max,relative_humidity_2m_min,wind_speed_10m_max,wind_gusts_10m_max,precipitation_sum,et0_fao_evapotranspiration&timezone=America/Argentina/La_Rioja&wind_speed_unit=kmh`
  - Para ERA5-Land, el parámetro probable es `&models=era5_land` (no verificado).
- [I] Ejemplo NASA POWER (los nombres T2M_MAX, RH2M, WS10M_MAX y PRECTOTCORR vienen de conocimiento previo; solo T2M, PS y WS10M aparecen en la doc consultada):
  `https://power.larc.nasa.gov/api/temporal/daily/point?parameters=T2M_MAX,RH2M,WS10M_MAX,PRECTOTCORR&community=AG&longitude=-67.50&latitude=-29.16&start=20260701&end=20260731&format=JSON`
- [I] Si FireSync tuviera publicidad o un modelo pago, el free tier de Open-Meteo dejaría de aplicar. Un proyecto de hackathon sin anuncios encaja en "non-commercial".
- [I] Hostear el backend en serverless compartido (Vercel/Netlify) puede agotar antes el límite de Open-Meteo por IP compartida. Mejor llamar desde el cliente o cachear.
- [I] La página de licencia de Open-Meteo todavía menciona la "Copernicus licence" para C3S, aunque desde julio de 2025 Copernicus usa CC-BY 4.0. Es una diferencia menor, pero vale citar ambas fuentes.
- [I] Alternativa al FWI de CEMS: calcular FWI canadiense a partir de las variables diarias de Open-Meteo (T y HR al mediodía local, viento, lluvia 24 h) con una librería existente. Es factible, pero requiere arrancar los códigos (FFMC/DMC/DC) con días previos. No verifiqué librerías específicas.

### Gaps
- Latencia exacta de NASA POWER para meteorología y su política de cita y uso (no recuperada).
- Si EWDS o `cdsapi` permiten descarga anónima: casi seguro requiere cuenta, no lo verifiqué.
- Endpoint REST oficial de GWIS para FWI por punto. No lo encontré.
- Términos de uso de datos del SMN y si existe descarga o API del FWI. No los encontré.
- Latencia de CHIRPS3 (prelim vs. final). No verificada.

---

## 3. Evidencia de que variables meteorológicas explican anomalías de hotspots (Argentina/Sudamérica)

### Takeaway
La literatura argentina respalda con evidencia moderada una relación en dos tiempos. Condiciones húmedas previas (más biomasa fina) seguidas de sequía o baja disponibilidad hídrica en la temporada aumentan focos y área quemada. En días puntuales, la baja humedad relativa y el viento fuerte (incluido el Zonda, cálido y seco) disparan la propagación. El caso demo encaja: el incendio de Sierra de Guanchín/Famatina (Chilecito, 27–31 de julio de 2026) ocurrió con ráfagas de hasta 80 km/h, alerta del SMN por viento del oeste de 60–80 km/h (ráfagas de 100) y luego alerta naranja por Zonda. No encontré fuentes que verifiquen el rol específico de pastos secados por helada en la temporada invernal del NOA.

### Cited Findings
- [3P] Córdoba: Sánchez et al. 2022 (Agriscientia) usaron área quemada MODIS 2001–2020 y el índice de Palmer (PDSI). Encontraron una relación significativa entre incendios y sequía en la misma estación, y más incendios tras años previos más húmedos — [Agriscientia/UNC](https://revistas.psi.unc.edu.ar/index.php/agris/article/download/33798/41048/153604); [registro BDU](https://bdu.siu.edu.ar/bdu/Record/I10-R352-article-33798/Description)
- [3P] Sierras de Córdoba: Argañaraz et al. 2015 (Fire Ecology 11(1):55, doi:10.4996/fireecology.1101055) encontraron que la cantidad de eventos de fuego aumenta tras períodos más húmedos de lo normal, mientras que el área quemada se asocia sobre todo con el tiempo meteorológico de mediano plazo. No pude acceder al texto completo por redirección a login — [Fire Ecology](https://fireecology.springeropen.com/articles/10.4996/fireecology.1101055)
- [3P] Noreste argentino: Di Bella et al. 2011 (Int. J. Remote Sensing) usaron hotspots MODIS y registros meteorológicos diarios. Un índice de disponibilidad hídrica previa al fuego se relaciona negativamente con la densidad de hotspots, y los pastizales naturales se asocian positivamente — [Repositorio MINCyT/CONICET](https://repositoriosdigitales.mincyt.gob.ar/vufind/Record/CONICETDig_d1b439b2a30a92d653681ae7c550d6ca)
- [3P] Centro semiárido: Fischer et al. 2015 (J. Arid Environments) usaron hotspots MODIS e índices de vegetación para explicar ocurrencia, propagación y duración de los fuegos — [CONICET Digital](https://ri.conicet.gov.ar/handle/11336/15363)
- [3P] Rosario (Anales AFA): la mediana más alta del número de focos coincide con baja precipitación acumulada, baja HR y viento predominante del noroeste — [Anales AFA](https://bibliotecadigital.exactas.uba.ar/collection/afa/document/afa_v36_n01_p001)
- [3P] El SNMF (material oficial) explica que, al bajar la HR, baja la humedad de los combustibles y aumenta su disponibilidad y el peligro de incendio — [argentina.gob.ar condiciones de peligro jun-2021](https://www.argentina.gob.ar/sites/default/files/2019/02/condiciones_de_peligro_de_incendios-25al29junio21.pdf)
- [3P] El Zonda es un viento cálido y seco que desciende por la ladera oriental de los Andes, con HR que en algunos episodios baja de 10% y dispara el riesgo de incendios de pastizal. Es una fuente divulgativa, no académica — [Snowy wikimeteo](https://snowy.es/wikimeteo/zonda). En Salta se reportaron más de 25 focos activos con el ingreso del Zonda — [Perfil](https://www.perfil.com/noticias/amp/sociedad/infierno-en-salta-por-el-viento-zonda-hay-mas-de-25-focos-de-incendios-forestales-activos.phtml)
- [V] Caso demo (nota publicada el 28-07-2026):
  - Incendio en la Sierra de Guanchín, departamento Chilecito. Empezó cerca del paraje La Yareta (RN 40) y subió a más de 2.800 m.
  - Unas 890 ha quemadas.
  - Ráfagas de hasta 80 km/h según bomberos; alerta del SMN por viento del oeste de 60–80 km/h con ráfagas de hasta 100 km/h, que impedían usar aviones hidrantes.
  - Causa sospechada humana (fogones); investigación abierta.
  — [Perfil](https://www.perfil.com/noticias/sociedad/incendio-sin-control-en-las-sierras-de-la-rioja-el-fuego-ya-arraso-casi-900-hectareas-y-preocupa-el-avance-por-los-fuertes-vientos.phtml)
- [3P] Hacia el 31 de julio de 2026 el fuego estaba controlado en un 70%, con alerta naranja por viento Zonda en La Rioja — [Cadena 3](https://www.cadena3.com/noticia/sociedad/incendios-en-la-rioja-control-del-70-y-alerta-naranja-por-viento-zonda_579019); [Perfil](https://www.perfil.com/noticias/sociedad/los-bomberos-controlaron-el-70-del-fuego-en-la-rioja-pero-la-llegada-del-zonda-amenaza-con-revivir-el-infierno.phtml). La AFP (vía La Libre) habla de "algunos cientos de hectáreas", cifra menor que la de los medios locales — [La Libre](https://www.lalibre.be/dernieres-depeches/2026/07/30/feux-de-foret-argentine-sept-morts-dans-laccident-dun-helicoptere-de-lutte-contre-les-feux-de-foret-2-NYIPFBZCH5FSRLVN7TEAE3MP64/)
- [3P] Un helicóptero que iba a combatir los incendios de La Rioja cayó en San Juan con 7 fallecidos — [Contexto Tucumán](https://www.contextotucuman.com/nota/400932/tragedia-aerea-en-san-juan-7-muertos-al-caer-un-helicoptero-que-se-dirigia-a-combatir-los-incendios-forestales-en-la-rioja); [La Libre/AFP](https://www.lalibre.be/dernieres-depeches/2026/07/30/feux-de-foret-argentine-sept-morts-dans-laccident-dun-helicoptere-de-lutte-contre-les-feux-de-foret-2-NYIPFBZCH5FSRLVN7TEAE3MP64/)

### Inferences
- [I] Para el calendario de FireSync, un panel de clima con viento/ráfaga máxima diaria, HR mínima, días sin lluvia y precipitación acumulada a 30/90 días, y FWI o Fosberg, debería mostrar visualmente el pico del 27–31 de julio de 2026 coincidiendo con el viento fuerte y el Zonda. Es una hipótesis a verificar con los datos.
- [I] La ignición fue antrópica: el clima explica la propagación y la intensidad (más hotspots o FRP), no el origen. Conviene decirlo en la UI ("condiciones favorables", no "causa").
- [I] ERA5 a 0.25° puede subestimar ráfagas locales en sierras (efectos orográficos). Conviene aclarar la resolución en la app.
- [I] El efecto de las heladas invernales sobre el curado de pastos en el NOA y Cuyo es plausible por conocimiento general de la temporada seca invernal, pero no lo verifiqué con fuentes en esta sesión.

### Gaps
- Estudios específicos del noroeste o La Rioja que vinculen hotspots MODIS/VIIRS con HR, viento o Zonda. Solo encontré trabajos de Córdoba, el NEA, el centro semiárido y Rosario.
- Evidencia publicada sobre pastos curados por helada como combustible invernal en la región. No encontrada.
- Datos oficiales consolidados del incendio de Guanchín (área final, FWI del SMN esos días). Solo hay prensa.

---

## 4. Términos de uso relevantes para una app web pública de hackathon (por servicio)

### Takeaway
Las restricciones que más afectan a FireSync son cinco. (1) Meteomatics prohíbe la difusión pública sin consentimiento y limita el uso a la vigencia del acuerdo. (2) Google Maps prohíbe mezclar contenido de Google con mapas no Google (según el servicio) y restringe el caching. Si usan Leaflet con OSM o CARTO, no deben usar geocoding ni Places de Google sobre ese mapa. (3) Los tiles de tile.openstreetmap.org exigen atribución, User-Agent/Referer válidos y nada de prefetch o uso offline, y pueden bloquear sin aviso. CARTO requiere atribución, tiene un límite gratuito por requests mensuales y parece pedir API key. (4) Los trials de Azure y Google Cloud piden tarjeta; Azure no acepta prepagas. Ninguno cobra automáticamente sin upgrade, pero al terminar se apagan los recursos y la demo puede caerse. (5) Los datos abiertos (Open-Meteo, Copernicus, CHIRPS, NASA) son CC BY o dominio público y solo exigen atribución o cita.

### Cited Findings

**Tabla resumen**

| Servicio | Restricciones clave para una app pública | Atribución | Comercial/no comercial | Tarjeta / auto-billing | Fuente |
|---|---|---|---|---|---|
| **Meteomatics** (GTC AG, ago-2026) | Prohíbe "display… publication… or other dissemination" a terceros sin consentimiento escrito (3.2.1.3); uso "solely for internal business purpose" (9.1.2); derecho limitado a la duración del acuerdo (3.1.2); trial "as is" y discontinuable (6.2) | Prohíbe quitar avisos de propiedad (3.2.1.4); no hay texto de atribución estándar | Uso interno o según contrato | Hackathon gratis. Los contratos pagos se renuevan automáticamente salvo aviso con 3 meses de antelación (15.2) | [GTC AG](https://meteomatics.com/en/gtc-meteomatics-ag) [V] |
| **Open-Meteo** | Límites de 600/min, 10.000/día y 300.000/mes; puede bloquear sin aviso | "Weather data by Open-Meteo.com" con link; CC BY 4.0 | Free solo no comercial; sin ads ni suscripciones | Sin tarjeta | [terms](https://open-meteo.com/en/terms), [licence](https://open-meteo.com/en/licence) [V] |
| **Copernicus CDS/EWDS** (ERA5, CEMS FWI) | Aceptar la licencia por dataset; cuenta | CC-BY 4.0; citar dataset y DOI ("Generated using Copernicus…") | Permitido con atribución | Sin tarjeta | [ECMWF forum](https://forum.ecmwf.int/t/cc-by-licence-to-replace-licence-to-use-copernicus-products-on-02-july-2025/13464), [EWDS](https://ewds.climate.copernicus.eu/datasets/cems-fire-historical-v1) [V] |
| **Microsoft Azure free account** | USD 200 en créditos usables en los primeros 30 días; 1 cuenta por cliente elegible; créditos no transferibles; para seguir hay que pasar a pay-as-you-go quitando el spending limit | — | — | Requiere teléfono, tarjeta de crédito o débito **no prepaga** y cuenta Microsoft o GitHub. "Your credit card or debit card will initially NOT be charged, except for a temporary authorization hold". Los recursos de compute de cuentas inactivas más de 30 días pueden eliminarse | [Azure offer MS-AZR-0044P](https://azure.microsoft.com/en-us/pricing/offers/ms-azr-0044p) [V]; [Azure free services](https://azure.microsoft.com/en-us/pricing/free-services) [V] |
| **Microsoft Planetary Computer** | El Hub se retiró el 6-jun-2024; catálogo y STAC API siguen gratis. "Supplemental Terms of Use for Microsoft Planetary Computer Previews" (ene-2023): no pensado para producción; tokens personales e intransferibles | Licencia **por dataset** (la del proveedor original) | Según dataset | Sin tarjeta para el catálogo | [PC terms](https://planetarycomputer.microsoft.com/terms) [3P, vía snippet]; [Esri blog Hub retirado](https://www.esri.com/arcgis-blog/products/arcgis-pro/imagery/looking-for-an-alternative-to-the-microsoft-planetary-computer-hub-2) [3P]; [GitHub discussion #347](https://github.com/microsoft/PlanetaryComputer/discussions/347) [3P] |
| **Google Cloud Free Trial** | USD 300 por 90 días. Sin GPUs, sin Marketplace, sin aumentos de cuota, sin VMs Windows; no cubre ciertos servicios de IA (p. ej. Gemini API en AI Studio) | — | — | Tarjeta u otro medio de pago válido; retención temporal de USD 0–1. **No cobra al terminar salvo upgrade manual**. Al agotarse el crédito o los 90 días, los recursos se detienen; hay 30 días de gracia y luego se borran. Solo para quienes nunca pagaron Google Cloud, Google Maps Platform ni Firebase | [Free trial docs](https://docs.cloud.google.com/free/docs/free-cloud-features) [V] |
| **Google Maps Platform** | Service Specific Terms §3.2: no usar Google Maps Content de ciertos servicios "in conjunction with a non-Google map" (la versión vigente nombra el Android Geocoder SDK; versiones archivadas nombran la Directions API). §3.3: caching de lat/lng hasta 30 días (Directions, versión archivada). Términos generales: hay que acreditar cada servicio según la Documentation | Logos y atribución de Google según la doc | Uso con cuota gratuita propia | Requiere billing account | [Maps Service Terms](https://cloud.google.com/maps-platform/terms/maps-service-terms) [3P, vía snippets]; [archivo 2026-06-10](https://cloud.google.com/archive/maps-platform/terms/maps-service-terms-20260610) [3P] |
| **Firebase** | Spark (gratis) sin medio de pago; cuotas por proyecto; Hosting Spark con 10 GB de almacenamiento y 360 MB/día de transferencia; Blaze para productos que requieren billing | — | — | Spark sin tarjeta. Blaze es pay-as-you-go (riesgo de costo); USD 300 de crédito al pasar a Blaze si se es elegible | [Firebase pricing](https://firebase.google.com/pricing) [3P, vía snippets] |
| **Miro** (Education/Business/templates) | Términos estándar para cuentas self-serve; la licencia sobre el contenido del cliente se limita a prestar el servicio; los equipos Education de estudiantes pueden limitarse a 2 años y bajar a Free | — | — | Education gratis | [Miro legal](https://miro.com/legal) [3P]; [Miro help Education](https://help.miro.com/hc/ja/articles/360017730473-Education-%E3%83%97%E3%83%A9%E3%83%B3) [3P]; [ConductAtlas](https://conductatlas.com/platform/miro/miro-terms-of-service/user-content-license/) [3P] |
| **Porkbun / GoDaddy Registry** | El dominio gratis dura 1 año; renovación a precio regular; WHOIS privacy y SSL gratis en Porkbun; hosting solo como trial | — | — | Hay que vigilar el auto-renew (Porkbun ofrece "Turn off Auto-Renew"); la renovación tiene el mismo precio que el registro | [Porkbun FAQ](https://porkbun.com/about/porkbun-faq) [V]; [post GoDaddy Registry hackathon](https://kelaenderkoe.pages.dev/Using-https-hackp.ac/GoDaddy-medium) [3P] |
| **GitHub Copilot Free** | Hasta 2.000 completions/mes y 50 chat/premium requests/mes | — | — | Sin tarjeta | [GitHub docs individual plans](https://docs.github.com/fr/copilot/concepts/billing/individual-plans) [3P, vía snippet]; [TechCrunch 2024](https://techcrunch.com/2024/12/18/github-launches-a-free-version-of-its-copilot) [3P] |
| **OSM tiles** (tile.openstreetmap.org) | User-Agent y Referer válidos; respetar Cache-Control (o cachear al menos 7 días); **prohibido** el bulk download, prefetch, scraping z≥14 y offline; puede bloquear sin aviso; sin SLA | "© OpenStreetMap contributors" con link a /copyright, visible, sin ocultarlo | No orientado a servicios comerciales | Gratis | [OSM tile policy](https://operations.osmfoundation.org/policies/tiles/) [V] |
| **CARTO basemaps** | Gratis hasta 5 M requests/mes (no comercial) o 1 M (comercial); requiere API key emitida por CARTO; CARTO puede suspender o limitar | "© OpenStreetMap contributors, © CARTO" | Plan comercial pago por encima de 1 M | — | [CARTO basemaps](https://carto.com/basemaps/) [3P, vía snippet]; [basemap terms](https://www.carto.com/legal/basemap-terms/) [3P]; [CARTO FAQ](https://docs.carto.com/faqs/carto-basemaps) [3P] |
| **CONAE** (catálogo) | Aceptar T&C y las condiciones de cada misión (acceso libre, registro o licencia); atender restricciones de "disponibilidad hacia terceros, o el uso comercial"; respetar la propiedad intelectual "indicando las leyendas que correspondieren"; producto "tal como es"; CONAE puede restringir la difusión y cambiar las condiciones sin aviso | Leyendas por misión | Según misión | Sin tarjeta | [CONAE T&C PDF](https://catalogos.conae.gov.ar/Catalogo/Docs/Terminos_y_Condiciones.pdf) [V] |
| **NASA FIRMS** (gobierno de EE. UU., para comparar) | MAP_KEY con 5.000 transacciones cada 10 minutos; pedidos multi-día pueden contar como varias transacciones; ver LANCE Disclaimer | Revistas: "We acknowledge the use of imagery from the NASA LANCE FIRMS… part of the NASA ESDIS"; en pies de figura: "NASA FIRMS" | NASA promueve "full and open sharing of data" | Gratis | [FIRMS FAQ](https://www.earthdata.nasa.gov/data/tools/firms/faq) [V]; [NASA FIRMS Q&A 2025](https://appliedsciences.nasa.gov/sites/default/files/2025-05/Part%203%20FIRMS%202025%20Q&A%20Session.docx.pdf) [3P, vía snippet] |
| **CHIRPS** | — | Citar DOI 10.15780/G2JQ0P y Funk et al. 2015 | Dominio público / CC BY 4.0 | — | [CHC](https://chc.ucsb.edu/node/497) [3P] |

**Detalles adicionales verificados**
- [V] Azure: los 12 meses de servicios gratis exigen pasar a pay-as-you-go dentro de los 30 días. Azure for Students da USD 100 sin tarjeta, pero requiere email académico — [Azure free services](https://azure.microsoft.com/en-us/pricing/free-services)
- [V] Google Cloud: "All resources you created during the trial are stopped" al cerrar la cuenta de billing del trial. Hacer upgrade termina el Free Trial y el crédito no usado se conserva hasta su vencimiento. El resumen de la página indica que Google Maps Platform figura como oferta aparte con su propio tope gratuito y no como parte del trial — [Free trial docs](https://docs.cloud.google.com/free/docs/free-cloud-features)
- [V] OSM: recomienda que la URL de tiles sea configurable y lista proveedores alternativos y self-hosting — [OSM tile policy](https://operations.osmfoundation.org/policies/tiles/)

### Inferences
- [I] **Arquitectura recomendada para cumplir términos**:
  - Mapa base: Leaflet o MapLibre con CARTO (con key) o con OSM solo para tráfico bajo.
  - Atribución visible: "© OpenStreetMap contributors, © CARTO | Fire data: NASA FIRMS | Weather data by Open-Meteo.com (ERA5, Copernicus C3S) | FWI: CEMS/ECMWF (CC-BY 4.0)".
  - No usar Google Maps Platform salvo que el mapa sea Google Maps. Para geocodificar, buscar una alternativa compatible con OSM (no verifiqué su política).
- [I] **Riesgo de demo caída**: los trials de Azure (30 días) y Google Cloud (90 días) apagan recursos al terminar. Si los jueces revisan en diciembre o enero, conviene hostear el frontend estático en Firebase Spark o GitHub Pages, que no vencen.
- [I] **Auto-billing**: ni Azure ni GCP cobran sin upgrade explícito, pero Firebase Blaze y un upgrade a pay-as-you-go sí. Conviene configurar presupuestos y alertas y no hacer upgrade durante el hackathon. Las tarjetas prepagas no sirven para Azure.
- [I] **Privacidad**: si la app guarda el área que dibuja el usuario o usa analytics de Firebase o Google, conviene una nota de privacidad mínima. Los proveedores de tiles reciben la IP y el Referer del usuario.
- [I] **Dominio**: el dominio gratis del primer año se renueva a precio regular (desconocido para el TLD de GoDaddy Registry). Conviene desactivar el auto-renew si no se planea mantener la app. Las condiciones exactas de la oferta están en Global Offers (requiere login).
- [I] **Disclaimer NASA**: como NASA no respalda a terceros, conviene mostrar en la app que FireSync no está respaldado por NASA ni por los proveedores y que los datos se usan según la política de cada sitio.
- [I] Los datos de FIRMS no están sujetos a copyright de EE. UU., pero hay que citarlos y leer el LANCE Disclaimer (tiempo cuasi real, no apto para decisiones tácticas: no verificado hoy).

### Gaps
- Texto exacto y vigente de Google Maps Platform Terms of Service §3.2.3 (prohibición general de scraping, caching y uso con mapas no Google). La página se truncó. Lo que recuerdo de esa sección es conocimiento previo **no verificado**.
- Términos completos de Firebase (ToS), Miro (texto de la licencia de contenido y plan Education), GitHub Copilot Free 2026 (posible paso a "AI Credits", no confirmado) y Planetary Computer (página de términos no legible).
- Precio de renovación y TLDs elegibles en la oferta GoDaddy Registry vía Porkbun, si requiere tarjeta y si el hosting de 1 año se cancela o cobra al vencer.
- LANCE Disclaimer completo y política de cita de NASA POWER.
- Términos de uso de productos del SMN (FWI) y licencias por misión de CONAE (p. ej. SAOCOM).
