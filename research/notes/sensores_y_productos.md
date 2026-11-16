# Sensores MODIS/VIIRS y productos FIRMS de active fire: estado al 13-nov-2026 y estructura de datos para armonización

> Convenciones: **[fetch]** = leído directamente en la página citada durante esta investigación (13-nov-2026). **[snippet]** = obtenido de resúmenes/snippets del buscador sobre esa URL, sin abrir el documento completo (varios PDF de NASA no se pudieron parsear). Las fechas futuras citadas de documentos de planificación son **planes**, no hechos. Las "Inferencias" son razonamiento propio, no verificado.

## 1. Terra y Aqua (MODIS): ¿siguen operando a nov-2026? Deriva orbital, fin de misión y cuándo dejan de llegar datos MODIS

### Takeaway
A 13-nov-2026 **Terra MODIS sigue operando** (FIRMS lista MODIS "to the present"; Terra con power limitations, cruce ecuatorial derivado a ~8:32 AM MLT según terra.nasa.gov, actualizado nov-2026) y su fin de ciencia está planificado para **~enero 2027** (otros documentos: feb-2027). **Aqua MODIS** tenía un apagado de instrumentos *proyectado* para el **26-ago-2026** y pasivación el **11-nov-2026**, pero no encontré ningún aviso que confirme que ocurrió; la página de misión Aqua (actualizada 5-oct-2026) aún lista MODIS como instrumento que recoge datos. El equipo debe verificar la última fecha disponible de Aqua directamente en FIRMS (`/api/data_availability/`).

### Cited Findings
**Terra – estado actual**
- FIRMS FAQ declara disponibilidad MODIS Terra "1 November 2000 to the present" y Aqua "July 2002 to the present" (sin fecha de fin; contrasta con S-NPP, que sí muestra fin 2-nov-2026) [fetch] — [FIRMS FAQ](https://www.earthdata.nasa.gov/data/tools/firms/faq)
- terra.nasa.gov (pie "Last Updated: Nov 14, 2026"): Terra experimenta "power-based limitations caused by orbital changes and solar array efficiency"; equator crossing time mostrado **"8:32 AM (Mean Local Time)"** y altitud **693 km**, ambos etiquetados "Updated November 2026". **Conflicto interno**: el alt-text del gráfico dice "9:59". Un banner (sin fecha) dice que ASTER VNIR, un CERES, MISR y MODIS "are all still operational and producing science" [fetch] — [Terra home](https://terra.nasa.gov/)
- MOPITT pasó a safe mode el 4-feb-2025 y fue apagado completamente el 9-abr-2025 para liberar potencia; ASTER TIR "permanently turned off" el 16-ene (año no explícito en el banner; el brief enlazado es de 2026) [fetch] — [Terra home](https://terra.nasa.gov/)
- Reporte semanal MCST de Terra MODIS (días 220–226 de 2026 = 8–14 ago 2026) con actividades de calibración rutinarias y sin anomalías [snippet] — [MCST weekly](https://mcst.gsfc.nasa.gov/iot/am1weekly20262202026226)
- Un snippet atribuye a LP DAAC (4-sep-2026) que "the Terra platform remains operational from its lower altitude and continues to generate data products" [snippet, URL exacta no confirmada] — [LP DAAC Terra acquisition plan](https://lpdaac.usgs.gov/news/terra-modis-acquisition-plan-through-december-2025/)

**Terra – deriva orbital (historia)**
- Último inclination adjust maneuver de Terra: **27-feb-2020**; MLT mantenido en 10:30 (10:45 los primeros dos años); se predijo superar 10:15 MLT en otoño 2022 y **9:00 MLT en invierno 2025/2026 (dic-2025)**; Constellation Exit bajó la órbita desde 705 km (plan: −6 km; luego a 694 km con dos maniobras retrógradas); al llegar a 9:00 MLT se previeron perigee-lowering burns de −20 km adicionales; "there has not been an official passivation date set" [fetch] — [Terra Project Scientist](https://terra.nasa.gov/about/terras-orbit-changes/terra-orbital-drift-information/a-message-from-the-project-scientist)
- Terra deriva a horas de cruce más tempranas desde 2020; en oct-2022 su altitud bajó ~5 km (salida de la constelación matinal) [fetch] — [Terra home](https://terra.nasa.gov/)
- NSIDC: ambos satélites derivan por límites de combustible; último ajuste de inclinación Terra 2022 y Aqua 2021 [snippet] — [NSIDC orbit changes](https://nsidc.org/data/user-resources/data-announcements/ongoing-changes-terra-and-aqua-orbits-impacting-modis-snow-and-sea-ice-products). *(Conflicto con terra.nasa.gov, que da feb-2020 como último inclination maneuver de Terra.)*
- LAADS: "due to fuel limitations, Terra and Aqua are currently drifting", con MLT de cruce más temprano (Terra) y más tardío (Aqua); usuarios "should monitor these MLT changes"; Terra y Aqua MODIS entran en "decommissioning phases (Phase-F)"; NASA preparará una calibración final **MODIS v8.0** para el último ciclo de reprocesamiento [fetch] — [LAADS MODIS-to-VIIRS Transition](https://ladsweb.modaps.eosdis.nasa.gov/learn/modis-to-viirs-transition)

**Fechas planificadas de fin (documentos de planificación)**
- Documento NASA (18-abr-2025): parar la colección de ciencia de **Aqua MODIS ~agosto 2026** y **Terra MODIS ~enero 2027**, por limitaciones de potencia [snippet] — [MODIS-VIIRS Transition PDF, Apr 2025](https://ladsweb.modaps.eosdis.nasa.gov/learn/modis-to-viirs-transition/MODIS-VIIRS_Transition.pdf)
- Presentación MODIS Science Team (may-2023): fin de ciencia de Terra **feb-2027**, perigee lowering y pasivación **sep-2027**; presupuesto de operaciones implicaba "lights out" nocturnos [snippet] — [Schwenger 2023](https://modis.gsfc.nasa.gov/sci_team/meetings/202305/presentations/cal/01_Schwenger_MODISVIIRSInstOps.pdf)
- Foro Earthdata (2025): se esperaba fin de Terra en dic-2025, pero NASA respondió "plans are in flux" sobre el decommissioning de Terra, Aqua y Aura [snippet] — [Earthdata Forum MODIST Status](https://forum.earthdata.nasa.gov/viewtopic.php?p=24697)
- CAMS/ECMWF: Terra ~enero 2027 y Aqua **~septiembre 2027** (conflicto con NASA ago-2026) [snippet] — [CAMS "Drifting away from MODIS"](https://atmosphere.copernicus.eu/drifting-away-modis-cams-global-fire-assimilation-system)
- Earthdata (actualizado 2-may-2025): "in late 2026/early 2027" las plataformas Terra y Aqua comenzarán a cerrar operaciones, MODIS dejará de recolectarse y se hará el reprocesamiento final [snippet] — [Earthdata Transition from MODIS to VIIRS](https://www.earthdata.nasa.gov/data/alerts-outages/transition-from-modis-viirs)

**Aqua – estado y deriva**
- AquaStatus.pdf (versión más reciente indexada): "August 26, 2026, Projected Aqua Instrument Shutdown followed by Spacecraft Passivation", pasivación **11-nov-2026**; MODIS "in Excellent Health"; potencia es el factor limitante de vida; entrega final de datasets de calidad científica de Aqua al archivo en el **primer trimestre de 2029** [snippet] — [AquaStatus.pdf](https://aqua.gsfc.nasa.gov/sites/default/files/AquaStatus.pdf). La versión de marzo-2025 daba pasivación 4-nov-2026 [snippet] — [AquaStatus_March2025.pdf](https://aqua.gsfc.nasa.gov/sites/default/files/AquaStatus_March2025.pdf)
- Página de misión Aqua (última actualización 5-oct-2026): último drag makeup maneuver en **dic-2021**, luego free-drift; Aqua "slowly descending below the A-Train and drifting to later equatorial crossing times"; MODIS figura entre los cuatro instrumentos que aún recogen y transmiten datos; no hay declaración sobre fin de ciencia ni pasivación [fetch] — [NASA Aqua mission](https://science.nasa.gov/mission/aqua/)
- LAADS DAAC alerts: no se halló ningún aviso de apagado de Aqua o "final data release" en 2026 (último ítem visto: mantenimiento 11-sep-2026) [snippet] — [LAADS alerts](https://ladsweb.modaps.eosdis.nasa.gov/alerts-and-issues/?id=19124)

**Orientación oficial sobre sucesión**
- No existe "follow-on MODIS-like instrument with an orbit at the Terra morning equatorial-crossing MLT" en misiones NASA actuales o planificadas; VIIRS es el sucesor recomendado [fetch] — [LAADS](https://ladsweb.modaps.eosdis.nasa.gov/learn/modis-to-viirs-transition)
- FIRMS: MODIS Terra es la única fuente de órbita matinal y NASA investiga alternativas para cuando termine; la órbita vespertina de Aqua es similar a la de S-NPP, por lo que se puede pasar a NOAA-20/21 sin perder cobertura de tarde [fetch] — [FIRMS blog S-NPP transition](https://www.earthdata.nasa.gov/news/blog/transitioning-from-suomi-npp-viirs-omps-what-firms-users-need-know)
- FIRMS FAQ: tras maniobras o clima espacial severo, el error de geolocalización NRT (normalmente <100 m) puede llegar a varios km; el período degradado dura <2 h para Terra, NOAA-20 y NOAA-21, y **hasta 12 h para Aqua** [fetch] — [FIRMS FAQ](https://www.earthdata.nasa.gov/data/tools/firms/faq)

### Inferencias
- **Impacto de la deriva en detección de fuegos**: el ciclo diurno del fuego suele alcanzar su máximo en la tarde local. Terra pasando a ~8:30 AM (vs 10:30 nominal) observa fuego menos activo → **caída artificial de conteos Terra** en los últimos años (~2021–2026), no atribuible a cambios reales. Aqua pasando más tarde que 13:30 puede alterar levemente sus conteos (y sus pasadas nocturnas también se corren). Para el calendario, conviene (a) usar un único sensor de referencia por período, o (b) normalizar por overpass/hora local, y documentar este sesgo. Hay una presentación específica de Giglio sobre el tema (ver Gaps).
- Si Aqua MODIS efectivamente dejó de producir el 26-ago-2026, la serie MODIS de afternoon termina ahí y la de Terra en ~ene-2027; para el hackathon, los datos MODIS de 2026 deben tratarse como "cola" con deriva fuerte.
- La serie MODIS es la única que cubre 2000–2012; para 2012+ es más robusto usar VIIRS (o MODIS+VIIRS con factor de ajuste calibrado en el período de solapamiento).

### Gaps
- No encontré confirmación oficial de que Aqua MODIS dejó de producir datos en ago-2026 ni de su pasivación el 11-nov-2026; la evidencia es contradictoria (plan vs página actualizada 5-oct-2026). **Verificar con** `https://firms.modaps.eosdis.nasa.gov/api/data_availability/csv/[MAP_KEY]/all` y con el mapa FIRMS.
- MLT actual de Terra: 8:32 AM vs 9:59 (conflicto en la misma página). No obtuve el valor actual de MLT de Aqua.
- La presentación "LANCE UWG Orbit Drift" (Giglio, may-2025) sobre efectos de la deriva en active fire no pudo parsearse (PDF binario) — [Giglio 2025](https://landweb.modaps.eosdis.nasa.gov/data/filePost/LANCE_UWG_Orbit_Drift_Giglio_202505.pdf). Contiene probablemente cuantificaciones; recomendable abrirla manualmente.
- No hallé documentos de NASA ESD Senior Review 2026 con decisiones presupuestarias sobre Terra/Aqua.

## 2. Suomi NPP: fin de producción de nuevos datos en FIRMS (2-nov-2026)

### Takeaway
**Verificado con corrección**: NOAA/NASA anunciaron el cese para las **13:00 UTC del 2-nov-2026** (fecha antes fijada para el 1-nov), pero el cese efectivo registrado por FIRMS, LANCE y NESDIS fue a las **15:40 UTC del 2-nov-2026 (día juliano 2026/306)**. Los datos históricos siguen disponibles; hay que cambiar `VIIRS_SNPP_NRT` (o `VIIRS_SNPP_SP`) por `VIIRS_NOAA20_NRT` / `VIIRS_NOAA21_NRT`. Motivo: degradación por edad y gestión responsable de activos en órbita (NOAA-21 es primario desde 2024); deorbit desde el 1-dic-2026.

### Cited Findings
- Blog FIRMS (publicado 27-oct-2026, actualizado 3-nov-2026): producción y entrega de nuevos datos FIRMS de S-NPP "will cease at 13:00 Universal Time (UTC) on November 2, 2026"; "Historical data will continue to be available"; actualizar REST API, WMS/WFS y feeds CSV/SHP "from VIIRS_SNPP_NRT (or VIIRS_SNPP_SP) to VIIRS_NOAA20_NRT or VIIRS_NOAA21_NRT"; no menciona MAP_KEY ni motivo [fetch] — [FIRMS blog](https://www.earthdata.nasa.gov/news/blog/transitioning-from-suomi-npp-viirs-omps-what-firms-users-need-know)
- FIRMS FAQ (estado actual): producción de nuevos datos S-NPP "ceased at 15:40 Universal Time (UTC) on November 2, 2026"; disponibilidad S-NPP: "20 January 2012 to November 2, 2026"; banner: S-NPP "is no longer delivering new data" [fetch] — [FIRMS FAQ](https://www.earthdata.nasa.gov/data/tools/firms/faq)
- Blog LANCE (3-nov-2026, act. 5-nov-2026): la entrega de nuevos datos científicos S-NPP "ceased at 15:40 UTC on November 2, 2026 (2026/306)"; mapeo de nombres VNP → VJ1 (NOAA-20) / VJ2 (NOAA-21), p.ej. "VNP14IMGTDL to VJ114IMGTDL and VJ214IMGTDL"; recomienda verificar LUTs y archivos de geolocalización de NOAA-20/21 [fetch] — [LANCE blog](https://www.earthdata.nasa.gov/news/blog/transitioning-from-suomi-npp-noaa-20-noaa-21-what-lance-users-need-know)
- NESDIS (19-oct-2026): "As the spacecraft has aged, its instruments and other onboard systems have experienced degradation"; NOAA-21 "became the primary satellite in the JPSS constellation in 2024"; S-NPP (lanzado 28-oct-2011, diseñado para 5 años) descenderá desde el **1-dic-2026** durante ~12 días con 10 burns, bajando ~600 km hasta ~200 km, reentrada sobre el Pacífico Sur; titular relacionado: "Cessation of S-NPP data to users on November 02, 2026 1540 UTC" [fetch] — [NESDIS deorbit](https://www.nesdis.noaa.gov/news/noaa-deorbit-the-suomi-npp-satellite-after-more-15-years-service)
- Aviso NESDIS "Update #2" (emitido 19-oct-2026 14:00 UTC) con cese "November 02, 2026 1300 UTC and Decommissioning" [snippet, título] — [NESDIS Update #2](https://www.nesdis.noaa.gov/news/administrative-update-2-cessation-of-suomi-national-polar-orbiting-partnership-s-npp-data-users-november-02-2026-1300-utc-and-decommissioning-issued-october-19-2026-1400-utc)
- Aviso Earthdata previo fijaba "13:00 UTC on November 1, 2026" y advertía que la fecha podía cambiar [snippet] — [Earthdata alert Nov 1](https://www.earthdata.nasa.gov/data/alerts-outages/suomi-npp-data-product-delivery-cease-november-1-2026); aviso posterior con 2-nov [snippet] — [Earthdata alert Nov 2](https://www.earthdata.nasa.gov/data/alerts-outages/suomi-npp-observations-cease-november-2-2026)
- CIMSS: S-NPP "was decommissioned at 1540 UTC on 02 November 2026" [snippet] — [CIMSS Farewell to Suomi NPP](https://cimss.ssec.wisc.edu/satellite-blog/archives/72828)
- La página VIIRS 375 m de Earthdata mencionaba previamente un end-of-life de S-NPP "anticipated to occur on or before October 2026" [fetch] — [Earthdata VIIRS I-Band 375 m](https://www.earthdata.nasa.gov/data/instruments/viirs/viirs-i-band-375-m-active-fire-data)
- Contexto (no citado por NOAA como causa): un SSM de CrIS en S-NPP falló por error de radiación el 23-dic-2025 [snippet, fuente terciaria] — [Wikipedia Suomi NPP](https://en.wikipedia.org/wiki/Suomi_NPP)
- Burned area: "Efforts are ongoing to develop and implement a continuity plan" del producto burned area S-NPP con NOAA-20 (y posiblemente NOAA-21) [fetch] — [FIRMS blog](https://www.earthdata.nasa.gov/news/blog/transitioning-from-suomi-npp-viirs-omps-what-firms-users-need-know)
- Ejemplo real de impacto: el pipeline de WRI/GFW leía solo el archivo S-NPP y se quedaba sin nuevas observaciones tras el cese [snippet] — [GitHub wri/gfw-datapump #213](https://github.com/wri/gfw-datapump/issues/213)

### Inferencias
- Para la serie del calendario: los conteos S-NPP de nov-2026 son parciales (solo 1–2 nov). Si el equipo usa S-NPP como "columna vertebral" VIIRS 2012–2026, deberá empalmar con NOAA-20 (desde 2018) o NOAA-21 (desde 2024) usando el período de solapamiento para calibrar.
- El cambio de hora (13:00 planificado vs 15:40 efectivo) es irrelevante para conteos mensuales, pero conviene citar 15:40 UTC como hora efectiva.

### Gaps
- No encontré un texto oficial que dé una razón técnica concreta (fuel, falla específica) más allá de "degradation" y gestión de activos.
- Un snapshot del mapa FIRMS USFS mostraría la capa S-NPP con "DATA ONLY AVAILABLE - 2015-11-24 TO 2026-11-02" [snippet] — [FIRMS USFS map](https://firms.modaps.eosdis.nasa.gov/usfs/map/); contradice el inicio 20-ene-2012 del FAQ (posiblemente específico de esa capa del visor). No verificado.

## 3. NOAA-20 y NOAA-21: estado, fases orbitales, instrumentos, fechas de inicio en FIRMS; JPSS-3/JPSS-4

### Takeaway
NOAA-21 es el satélite primario JPSS desde 2024 y NOAA-20 el secundario; ambos vuelan en el mismo plano orbital que S-NPP, separados ~50 min, con VIIRS "idénticos". En FIRMS: NOAA-20 desde **1-abr-2018**, NOAA-21 desde **17-ene-2024**. El próximo satélite es **JPSS-4 (será NOAA-22)**, con disponibilidad para lanzamiento en 2027 (slides NESDIS 2026: 1-sep-2027); JPSS-3 en almacenamiento, lanzamiento ~2032.

### Cited Findings
- NOAA-20 (ex JPSS-1) lanzado 18-nov-2017, datos FIRMS desde **1-abr-2018**; NOAA-21 (ex JPSS-2) lanzado 10-nov-2022, datos FIRMS desde **17-ene-2024**; ambos con productos NRT 375 m (VJ114IMGTDL_NRT, VJ214IMGTDL_NRT) y estándar [fetch] — [FIRMS FAQ](https://www.earthdata.nasa.gov/data/tools/firms/faq)
- "The satellites fly in the same orbital plane as Suomi NPP, approximately 50 minutes apart"; ambos tienen "an identical VIIRS sensor providing the same spatial resolution as Suomi NPP VIIRS" [fetch] — [FIRMS blog](https://www.earthdata.nasa.gov/news/blog/transitioning-from-suomi-npp-viirs-omps-what-firms-users-need-know)
- FIRMS FAQ da overpass NOAA-20/21 ~12:40 pm/12:40 am y dice que la órbita va "about 50 minutes ahead of Suomi NPP", mientras otra frase dice que NOAA-21 vuela 50 min delante de NOAA-20 — **inconsistencia interna** del FAQ [fetch] — [FIRMS FAQ](https://www.earthdata.nasa.gov/data/tools/firms/faq)
- NOAA-21 primario desde 2024; S-NPP terciario/backup desde entonces [fetch] — [NESDIS](https://www.nesdis.noaa.gov/news/noaa-deorbit-the-suomi-npp-satellite-after-more-15-years-service)
- LANCE recomienda ingerir NOAA-20 y NOAA-21 juntos porque "increases the probability of detecting transient events" y reduce latencia [fetch] — [LANCE blog](https://www.earthdata.nasa.gov/news/blog/transitioning-from-suomi-npp-noaa-20-noaa-21-what-lance-users-need-know)
- Productos estándar (archivo) V002 de NOAA-21 publicados por LP DAAC el 26–30-mar-2026: "VIIRS/JPSS2 Active Fires 6-Min L2 Swath 375m V002" (netCDF-4), "Thermal Anomalies/Fire 6-Min L2 Swath 750m V002", "Thermal Anomalies and Fire Daily L3 Global 1km SIN Grid V002" y geolocalización 750 m Light V002 [fetch] — [Earthdata alert Additional VIIRS V002](https://www.earthdata.nasa.gov/data/alerts-outages/additional-viirs-version-2-thermal-anomaly-active-fire-data-products-released)
- FIRMS API ofrece `VIIRS_NOAA20_SP` y `VIIRS_NOAA21_SP` además de los NRT [fetch] — [FIRMS API area](https://firms.modaps.eosdis.nasa.gov/api/area/)
- JPSS-4 será renombrado NOAA-22 y es el próximo JPSS a lanzar, con launch readiness 2027 [snippet] — [NESDIS JPSS](https://www.nesdis.noaa.gov/jpss); slides NESDIS (jun-2026): lanzamiento programado 1-sep-2027, JPSS-3 en almacenamiento con lanzamiento esperado 2032 [snippet] — [Kalluri, SSEC 2026](https://www.ssec.wisc.edu/meetings/wp-content/uploads/sites/33/2026/06/2.4_Kalluri.pdf). **Conflicto**: la página NASA JPSS y SpaceNews (2023, presupuesto 2024) asignan 2027 a JPSS-3 y 2032 a JPSS-4 (etiquetas invertidas, probablemente desactualizadas) [snippet] — [NASA JPSS](https://science.nasa.gov/mission/jpss); [SpaceNews](https://spacenews.com/?p=154839)

### Inferencias
- Con NOAA-20 y NOAA-21 separados ~50 min (media órbita), un mismo fuego vespertino puede detectarse dos veces por día-pasada → **conteos combinados NOAA-20+NOAA-21 ≈ el doble** que un solo satélite; para la serie armonizada, usar un sensor de referencia o deduplicar espacio-temporalmente (p.ej. grilla + día + day/night).
- Para el empalme VIIRS: S-NPP (2012-01-20 → 2026-11-02) solapa con NOAA-20 durante ~8.5 años (2018–2026) y con NOAA-21 ~2.8 años, buen período para estimar factores de ajuste entre satélites VIIRS (que deberían ser ≈1, ver diferencias de hora de paso).
- El SP de NOAA-21 V002 apareció en LP DAAC en mar-2026; es probable que el archivo `VIIRS_NOAA21_SP` de FIRMS cubra desde 17-ene-2024 hasta pocos meses antes de hoy (lag 2–3 meses).

### Gaps
- La fase exacta S-NPP / NOAA-20 / NOAA-21 (quién va delante de quién y por cuántos minutos tras las maniobras de 2023) queda ambigua por la inconsistencia del FAQ.
- Hora de paso nominal de NOAA-20/21: el FAQ dice ~12:40; la cifra comúnmente citada es ~13:30 (no verificada aquí).
- Fecha exacta de inicio del archivo SP de NOAA-21 en FIRMS y del SP de NOAA-20 (si empieza el 1-abr-2018 o antes): no confirmada. Verificar con `/api/data_availability/`.

## 4. Catálogo de productos y versiones (MODIS C6.1, VIIRS V002, NRT/RT/URT vs SP, producto 750 m)

### Takeaway
MODIS en FIRMS es **Collection 6.1** (disponible desde abril 2021): **MCD14DL** (NRT, combinado Terra+Aqua) y **MCD14ML** (archivo mensual estándar con campo `type`), derivados de los L2 MOD14/MYD14. VIIRS 375 m es **Version 2 (V002)**: VNP14IMG (S-NPP), VJ114IMG (NOAA-20), VJ214IMG (NOAA-21) y sus NRT `*IMGTDL_NRT`. FIRMS sirve NRT (≤3 h) y luego "Standard/ML" con lag de 2–3 meses. El producto VIIRS 750 m (VNP14/VJ114/VJ214, "designed to provide continuity" con MODIS 1 km) **no se distribuye en FIRMS**, solo vía Earthdata Search/LP DAAC en netCDF/HDF.

### Cited Findings
**MODIS**
- "Collection 6.1 has been available since April 2021 and is the latest collection available"; NRT MODIS listado como C6.1 (MCD14DL) [fetch] — [FIRMS FAQ](https://www.earthdata.nasa.gov/data/tools/firms/faq)
- Valores del campo `version` MODIS: "6.1URT (Ultra Real-Time), 6.1RT (Real-Time), 6.1NRT (Near Real-Time), 6.1 (Standard)"; `type` "only available for MCD14ML (standard quality) data" [fetch] — [FIRMS Attributes](https://www.earthdata.nasa.gov/data/tools/firms/active-fire-data-attributes-modis-viirs)
- MOD14 V6.1: los L1B V6.1 "improved by undergoing various calibration changes", incluyendo actualización de LUT 2012–2017 y corrección de polarización en Reflective Solar Bands [snippet] — [Earthdata catalog MOD14 061](https://www.earthdata.nasa.gov/es/data/catalog/lpcloud-mod14-061?page=1%2C0)
- Guía MCD64 C6.1: la "mini-reprocessing" C6.1 iniciada en 2018; para la suite de tierra los cambios "are largely confined to the MODIS Level-1B calibrated data" [snippet] — [MCD64 User Guide V61](https://LPDAAC.USGS.GOV/documents/1006/MCD64_User_Guide_V61.pdf)
- Guía de usuario oficial: "MODIS Collection 6 and Collection 6.1 Active Fire Product User's Guide" v1.0, Giglio, Schroeder & Hall, mayo 2021 [snippet] — [MODIS C6/C6.1 Fire User Guide](https://earthdata.nasa.gov/s3fs-public/2023-09/MODIS_C6_C6.1_Fire_User_Guide_1.0.pdf); algoritmo C6: Giglio, Schroeder & Justice (2016) [snippet] — [MODIS Land Fire](https://modis-land.gsfc.nasa.gov/fire.html)

**VIIRS 375 m**
- VIIRS Version 2 (V002) de VNP14IMG (S-NPP) y VJ114IMG (NOAA-20) anunciada el 20-abr-2024; cambios V2: calibración revisada, mejor geolocalización, mejor cloud mask y land/water mask actualizado; DOIs `10.5067/VIIRS/VNP14IMG.002` y `10.5067/VIIRS/VJ114IMG.002`; requiere VJ103MODLL/VNP03 para geolocalización; validación Stage 1 [snippet] — [Earthdata alert VIIRS AF V002](https://www.earthdata.nasa.gov/data/alerts-outages/viirs-active-fire-products-released)
- VJ214IMG V002 (NOAA-21): "VIIRS/JPSS2 Thermal Anomalies/Fire 6-Min L2 Swath 375m V002", producto en swaths de 6 min, variable primaria fire mask [snippet] — [Earthdata catalog VJ214IMG 002](https://www.earthdata.nasa.gov/data/catalog/lpcloud-vj214img-002); NRT: DOI `10.5067/VIIRS/VJ214IMG_NRT.002`, ~1.8 MB/archivo, 240 archivos/día [snippet] — [VJ214IMG_NRT](https://modaps.modaps.eosdis.nasa.gov/services/about/products/viirs-c2-nrt/VJ214IMG_nrt.html)
- Guía "VIIRS Collection 2 Active Fire 375 m User Guide" v1.2 (jun-2025); designa VNP14IMG, VJ114IMG y VJ214IMG para S-NPP, NOAA-20 y NOAA-21; el snippet indica que v1.2 cubre "v3 VxxIMG14ML" (producto mensual tipo ML) y añade sección "Known issues" [snippet] — [VIIRS C2 AF 375m User Guide 1.2](https://www.earthdata.nasa.gov/s3fs-public/2025-06/VIIRS_C2_AF-375m_User_Guide_1.2.pdf)
- La página de atributos FIRMS aún lista `version` VIIRS como "1.0NRT" / "1.0" (Collection 1) — **probablemente desactualizada** frente a V002 [fetch] — [FIRMS Attributes](https://www.earthdata.nasa.gov/data/tools/firms/active-fire-data-attributes-modis-viirs)
- Producto 375 m: algoritmo contextual multiespectral heredero de MODIS que "uses all five 375 m VIIRS channels"; referencia Schroeder et al. 2014, DOI 10.1016/j.rse.2013.12.008 [fetch] — [Earthdata VIIRS I-Band](https://www.earthdata.nasa.gov/data/instruments/viirs/viirs-i-band-375-m-active-fire-data)
- El 375 m es solo detección: por saturación frecuente "provides detection information only with no sub-pixel fire characterization" [snippet] — [VFIRE375 SPA guide](https://directreadout.sci.gsfc.nasa.gov/users_guides_documents/VFIRE375_3.0.0_SPA_1.9.pdf)

**VIIRS 750 m (M-band)**
- Existe un producto complementario VIIRS M-Band 750 m en HDF vía Earthdata Search; **FIRMS distribuye el 375 m** por su mayor resolución y mayor número de detecciones [fetch] — [Earthdata VIIRS I-Band](https://www.earthdata.nasa.gov/data/instruments/viirs/viirs-i-band-375-m-active-fire-data)
- El 750 m fue "designed to provide continuity to the existing 1 km EOS/MODIS active fire data record" [snippet] — [VIIRS C2 AF 375m User Guide 1.2](https://www.earthdata.nasa.gov/s3fs-public/2025-06/VIIRS_C2_AF-375m_User_Guide_1.2.pdf)
- V002 750 m de NOAA-21 y L3 diario global 1 km SIN publicados mar-2026 [fetch] — [Earthdata alert](https://www.earthdata.nasa.gov/data/alerts-outages/additional-viirs-version-2-thermal-anomaly-active-fire-data-products-released)

**NRT vs RT/URT vs Standard (SP)**
- NRT: "within 3 hours of a satellite observation (on a best-effort basis)"; RT: "within 30 minutes of overpass"; URT: "within 5 minutes" / "within a minute" (el FAQ es inconsistente); Standard/ML con efemérides definitivas "usually available with a 2-3 month lag" [fetch] — [FIRMS FAQ](https://www.earthdata.nasa.gov/data/tools/firms/faq)
- RT/URT "are removed when corresponding NRT detections are processed or RT/URT is older than 6 hours"; URT <60 s en gran parte de EE.UU./Canadá [fetch] — [FIRMS API area](https://firms.modaps.eosdis.nasa.gov/api/area/)
- Fuentes válidas del API: `LANDSAT_NRT` (solo EE.UU./Canadá), `MODIS_NRT`, `MODIS_SP`, `VIIRS_NOAA20_NRT`, `VIIRS_NOAA20_SP`, `VIIRS_NOAA21_NRT`, `VIIRS_NOAA21_SP`, `VIIRS_SNPP_NRT`, `VIIRS_SNPP_SP`; DAY_RANGE 1..5; formato `/api/area/csv/[MAP_KEY]/[SOURCE]/[west,south,east,north]/[DAY_RANGE]/[YYYY-MM-DD]` [fetch] — [FIRMS API area](https://firms.modaps.eosdis.nasa.gov/api/area/)

### Inferencias
- El FAQ no dice explícitamente que SP "reemplaza" a NRT; operativamente, FIRMS ofrece ambos: para fechas antiguas usar `*_SP`, y para los últimos ~2–3 meses solo existe `*_NRT`. **Recomendación**: serie = SP hasta la última fecha SP disponible + NRT después, marcando el tramo NRT como provisional (sin `type`, geolocalización menos exacta y, en VIIRS NRT, sin los pixeles nocturnos low-confidence de la SAA).
- El producto 750 m podría servir como "puente" metodológico MODIS↔VIIRS (resolución y bandas más parecidas a MODIS 1 km), pero no está en FIRMS; usarlo implica descargar swaths L2 netCDF de LP DAAC — probablemente demasiado costoso para un hackathon de 48 h. Opción más práctica: grillar VIIRS 375 m a celdas ≥1 km o comparar con productos L3 diarios 1 km (MOD14A1/VNP14A1-like).
- La afirmación "C6.1 = cambios de calibración, no de algoritmo" es **consistente** con las fuentes (cambios C6.1 centrados en L1B), pero no la confirmé dentro de la guía de fuego.

### Gaps
- No pude leer las guías PDF (MODIS C6/C6.1 y VIIRS C2 v1.2) por formato binario; detalles finos (lista exacta de cambios C6.1 en active fire, tabla de `type`, umbrales de confidence MODIS) deben verificarse abriéndolas manualmente.
- No confirmé el valor actual del campo `version` en CSV VIIRS de FIRMS (¿"2.0NRT"/"2"?). Verificar con una descarga real.
- No confirmé si FIRMS sigue ofreciendo MCD14ML para meses de 2026 ni la última fecha SP disponible por fuente.

## 5. Fechas de inicio (y fin) por sensor en FIRMS

### Takeaway
Verificado en el FIRMS FAQ: **Terra 1-nov-2000**, **Aqua jul-2002 (4-jul-2002 para observaciones de alta calidad)**, **S-NPP 20-ene-2012 → 2-nov-2026**, **NOAA-20 1-abr-2018**, **NOAA-21 17-ene-2024**.

### Cited Findings
- MODIS Terra "1 November 2000 to the present" (alta calidad desde nov-2000); MODIS Aqua "July 2002 to the present", alta calidad desde "July 4, 2002"; VIIRS S-NPP "20 January 2012 to November 2, 2026"; NOAA-20 "1 April 2018 to the present"; NOAA-21 "17 January 2024 to the present" [fetch] — [FIRMS FAQ](https://www.earthdata.nasa.gov/data/tools/firms/faq)
- Terra y Aqua MODIS "successfully in operation since 2000 and 2002, respectively"; VIIRS lanzado por primera vez en S-NPP en 2011 [fetch] — [LAADS](https://ladsweb.modaps.eosdis.nasa.gov/learn/modis-to-viirs-transition)
- Aqua lanzado el 4-may-2002, diseñado para 6 años [fetch] — [NASA Aqua mission](https://science.nasa.gov/mission/aqua/)

### Inferencias
- Para un calendario mensual "2000–presente": nov-2000 a jun-2002 solo Terra (morning) → si se combinan Terra+Aqua, habrá un salto artificial en jul-2002. Para homogeneidad, una serie "solo Terra" o "solo Aqua (desde jul-2002)" es más consistente, o bien normalizar.
- Los meses de inicio parciales (nov-2000, jul-2002, ene-2012, abr-2018, ene-2024) y de fin (nov-2026 S-NPP) deben marcarse como incompletos en la UI.

### Gaps
- No verificado si existen datos FIRMS de Terra antes del 1-nov-2000 (p.ej. desde feb-2000 con baja calidad) — el FAQ solo dice "high quality" desde nov-2000.

## 6. Campos del CSV de FIRMS (MODIS y VIIRS): significado, unidades y relevancia para armonización

### Takeaway
Ambos productos comparten casi el mismo esquema (lat/lon del centro del píxel, brillos en K, scan/track, acq_date/acq_time UTC, satellite, confidence, version, FRP en MW, daynight). Diferencias clave: `confidence` MODIS es 0–100 vs VIIRS `l/n/h`; brillos MODIS = canales 21/22 y 31 vs VIIRS = I4 e I5; `type` (0 vegetación, 1 volcán, 2 otra fuente estática terrestre, 3 offshore) **solo en productos estándar** (MCD14ML), no en NRT.

### Cited Findings
Todas las definiciones de esta tabla provienen de [FIRMS Active Fire Attributes](https://www.earthdata.nasa.gov/data/tools/firms/active-fire-data-attributes-modis-viirs) [fetch], salvo indicación.

| Campo (MODIS / VIIRS) | Significado y unidades (fuente oficial) | Relevancia para armonización (inferencia propia salvo cita) |
|---|---|---|
| `latitude`, `longitude` | Centro del píxel de fuego (1 km MODIS; 375 m nominal VIIRS); "not necessarily the actual location of the fire" | Clave para filtrar por área del usuario; usar polígono, no solo bbox |
| `brightness` / `bright_ti4` | MODIS: Tb canal 21/22 (K). VIIRS: Tb canal I-4 (K) (en web services "Brightness") | No comparables directamente entre sensores (bandas y saturación distintas); no usar para armonizar conteos |
| `scan`, `track` | Tamaño del píxel along-scan y along-track; crece hacia el borde, "reflect actual pixel size"; ~375 m en nadir para VIIRS (unidades no indicadas; en la práctica km) | **Muy útil**: área ≈ scan×track → normalizar por área, filtrar píxeles de borde (p.ej. MODIS scan > ~2 km) |
| `acq_date` | Fecha de adquisición | Base del agregado mensual/anual; ojo: es UTC |
| `acq_time` | Hora del overpass en **UTC** (HHMM) | Convertir a hora local solar para separar day/night o estudiar efecto de deriva; para Argentina UTC−3 puede mover detecciones nocturnas cercanas a medianoche al día siguiente |
| `satellite` | MODIS: A = Aqua, T = Terra. VIIRS: N = S-NPP, N20 = NOAA-20, N21 = NOAA-21 | Necesario para series por satélite y para empalmes |
| `instrument` | (no listado en la página de atributos) | Probablemente "MODIS"/"VIIRS" en CSV; verificar |
| `confidence` | MODIS: 0–100% mapeado a low/nominal/high. VIIRS: low/nominal/high (ver abajo) | **Clave**: definir umbral común (p.ej. excluir low) para ambos sensores |
| `version` | MODIS: 6.1URT, 6.1RT, 6.1NRT, 6.1. VIIRS: la página lista 1.0NRT/1.0 (posible desactualización) | Distinguir NRT vs estándar y evitar mezclar colecciones |
| `bright_t31` / `bright_ti5` | MODIS: Tb canal 31 (K). VIIRS: Tb I-5 (K) ("Brightness_2" en web services) | Poco útil para conteos |
| `frp` | Fire Radiative Power integrado por píxel, en **MW**; en VIIRS se usa un híbrido de 375 m y 750 m | Útil como métrica secundaria (energía) más comparable entre sensores que los conteos, aunque con sesgos de resolución |
| `daynight` | D = día, N = noche | **Clave**: la ventaja nocturna de VIIRS sesga conteos; armonizar por separado D/N |
| `type` | 0 = presumed vegetation fire; 1 = active volcano; 2 = other static land source; 3 = offshore. Solo en MCD14ML | **Clave**: filtrar type ≠ 0 elimina volcanes, fuentes industriales y plataformas offshore |

- Confidence VIIRS: **Low** = sobre todo píxeles diurnos con sun glint y anomalía I4 < 15 K; **Nominal** = píxeles diurnos libres de sun glint con anomalía > 15 K en día o noche; **High** = píxeles saturados de día o de noche; **los píxeles nocturnos low-confidence solo ocurren en 11°E–110°W y 7°N–55°S (South Atlantic Magnetic Anomaly) y fueron removidos de los datos FIRMS NRT** [fetch] — [FIRMS Attributes](https://www.earthdata.nasa.gov/data/tools/firms/active-fire-data-attributes-modis-viirs)
- MODIS confidence: estimación de calidad 0–100% basada en cantidades intermedias del algoritmo, asignada a tres clases (low/nominal/high) [fetch] — [FIRMS FAQ](https://www.earthdata.nasa.gov/data/tools/firms/faq)
- El NRT descargado de FIRMS no incluye el atributo `type` (Tabla 10 de la guía MODIS); sí está en el producto ML [fetch] — [FIRMS FAQ](https://www.earthdata.nasa.gov/data/tools/firms/faq)

### Inferencias
- **Esquema mínimo para la armonización**: `latitude, longitude, acq_date, acq_time, satellite, instrument, confidence, daynight, type, scan, track, frp`.
- Mapeo de confidence propuesto (a validar en las guías): MODIS ≥ 30 ≈ "nominal o más"; VIIRS `n`+`h`. Hay que documentar el umbral MODIS exacto de la guía (ver Gaps).
- La eliminación de low-confidence nocturnos VIIRS en la SAA afecta **directamente a Argentina** (todo el país está dentro de 7°N–55°S y 11°E–110°W). Si se mezcla SP (con esos píxeles) y NRT (sin ellos), se crea una discontinuidad; aplicar el mismo filtro (excluir `l` nocturnos) a SP para consistencia.
- Para VIIRS SP en FIRMS, esperar también una columna `type` (por analogía con MCD14ML y porque el FAQ indica que type está en el ML) — no verificado.

### Gaps
- Umbrales numéricos MODIS low/nominal/high (habitualmente 0–29 / 30–79 / 80–100 según la guía C6) **no verificados** en esta sesión porque el PDF no fue legible — [MODIS C6/C6.1 Fire User Guide](https://earthdata.nasa.gov/s3fs-public/2023-09/MODIS_C6_C6.1_Fire_User_Guide_1.0.pdf).
- Códigos exactos de `satellite` en los CSV de archivo (p.ej. "Terra"/"Aqua" en lugar de "T"/"A", o "1"/"N20") y presencia de `instrument` y `type` en VIIRS SP: verificar con descargas reales.

## 7. Geometría: tamaño de píxel, swath, crecimiento hacia el borde, bow-tie, revisita, horas de paso

### Takeaway
MODIS: 1 km en nadir → ~2.0 km (along-track) × ~4.8 km (along-scan) en el borde (área ~9–10×), swath 2,330 km, solape bow-tie de hasta 50% en bordes (detecciones repetidas). VIIRS 375 m: crecimiento acotado (along-scan ~0.3–0.8 km) gracias a la agregación de detectores, swath 3,040 km, cobertura global cada 12 h. Horas de paso nominales: Terra ~10:30/22:30 (hoy ~8:30), Aqua y S-NPP ~13:30/01:30, NOAA-20/21 ~50 min respecto de S-NPP.

### Cited Findings
- Swath ~2,330 km MODIS y 3,040 km VIIRS; VIIRS ofrece cobertura global cada 12 h; pueden aparecer pequeños huecos en forma de diamante entre órbitas consecutivas cerca del ecuador (~30°N–30°S) [fetch] — [FIRMS FAQ](https://www.earthdata.nasa.gov/data/tools/firms/faq)
- Overpass nominal: Terra ~10:30 a.m./p.m. MLT; Aqua ~1:30 p.m./a.m.; S-NPP 1:30 p.m./a.m.; NOAA-20/21 ~12:40 p.m./a.m. (según FAQ, con inconsistencia sobre la fase) [fetch] — [FIRMS FAQ](https://www.earthdata.nasa.gov/data/tools/firms/faq)
- Tamaños nominales: MODIS 1 km; VIIRS 375 m (I-bands) y 750 m (M11, co-localizado con los 375 m) [fetch] — [FIRMS FAQ](https://www.earthdata.nasa.gov/data/tools/firms/faq)
- MODIS: de ~1 km en nadir a ~2.01 km along-track y ~4.83 km along-scan en el borde [snippet] — [MDPI Remote Sensing 12(10):1561](https://www.mdpi.com/2072-4292/12/10/1561/htm); aumento de área ~9 (Sayer et al. 2015) a ~9.6 [snippet] — [Sayer et al. AMT 2015](https://amt.copernicus.org/articles/8/5277/2015/)
- MODIS: escaneos adyacentes se solapan hasta 50% (efecto bow-tie), generando detecciones repetidas cerca del borde; existen algoritmos para remover duplicados; límite de detección < ~10 MW en nadir que aumenta con el tamaño del píxel [snippet] — [NASA FEER FRP](https://science.gsfc.nasa.gov/feer/projects/frp)
- VIIRS: 32 detectores/scan y 6400 muestras por fila en 375 m (16 y 3200 en 750 m); footprint crece con el ángulo; agregación de 3 píxeles nativos entre nadir y ±31.59°, sin agregación más allá de ±44.68° hasta el máximo ±56.06°; tamaño along-scan del píxel de fuego 0.3–0.8 km [snippet] — [VFIRE375 SPA guide](https://directreadout.sci.gsfc.nasa.gov/users_guides_documents/VFIRE375_3.0.0_SPA_1.9.pdf)
- FIRMS: MODIS pixels crecen hacia el borde y scan/track reflejan el tamaño real; VIIRS ~375 m en nadir [fetch] — [FIRMS Attributes](https://www.earthdata.nasa.gov/data/tools/firms/active-fire-data-attributes-modis-viirs)
- Geostacionarios en FIRMS: 1 km (MTG FCI), 2 km (GOES ABI, Himawari AHI), 3 km (MSG SEVIRI) en el punto subsatelital, creciendo hacia el borde del disco [fetch] — [FIRMS FAQ](https://www.earthdata.nasa.gov/data/tools/firms/faq)

### Inferencias
- Revisita: MODIS (1 satélite) cubre la mayor parte del globo 1–2 veces/día (día+noche) por el swath de 2,330 km; VIIRS (3,040 km) cubre todo el globo 2 veces/día por satélite sin huecos salvo latitudes ecuatoriales. Para Argentina (22°S–55°S) los "diamond gaps" afectan principalmente al norte del país.
- Normalización sugerida: (a) conteos por celda de grilla común (p.ej. 0.1°/~10 km) con "presencia de fuego por celda-día-pasada" en vez de número de píxeles, que reduce el efecto de resolución (un fuego grande = muchos píxeles VIIRS pero pocos MODIS); (b) opcionalmente excluir píxeles MODIS con scan > ~2 km y VIIRS fuera de ±~31.6°.
- VIIRS aplica "bow-tie deletion" a bordo (conocimiento general, no verificado aquí), por lo que los duplicados por solape son menores que en MODIS.

### Gaps
- Tamaño along-track de VIIRS 375 m en el borde y factor de área exacto: no confirmados.
- Valor oficial de revisita MODIS en FIRMS: no obtenido de fuente primaria en esta sesión.

## 8. Verificación de afirmaciones previas

### Takeaway
Casi todas las afirmaciones se confirman; correcciones: S-NPP cesó efectivamente a **15:40 UTC** (no 13:00); "latencia ~3 h" es el objetivo NRT best-effort (alertas VIIRS hasta 4 h; RT 30 min; URT <1 min en EE.UU./Canadá); los geostacionarios en FIRMS tienen latencias de ~20–30 min (la cadencia de 10–15 min no se verificó aquí); los formatos (CSV/TXT, SHP, KML, WMS) son genéricos para todos los sensores.

### Cited Findings
- **VIIRS detecta mejor fuegos pequeños y de noche**: VERIFICADO — el 375 m da "greater response over fires of relatively small areas" e "improved nighttime performance", con buena concordancia con MODIS [fetch] — [Earthdata VIIRS I-Band](https://www.earthdata.nasa.gov/data/instruments/viirs/viirs-i-band-375-m-active-fire-data)
- **Latencia global ~3 h**: VERIFICADO con matices — NRT "within 3 hours ... (on a best-effort basis)"; RT 30 min; alertas MODIS ~3 h y VIIRS ~4 h [fetch] — [FIRMS FAQ](https://www.earthdata.nasa.gov/data/tools/firms/faq)
- **Migración desde MODIS recomendada**: VERIFICADO — VIIRS es el sucesor recomendado y LAADS anima a explorar productos VIIRS [fetch] — [LAADS](https://ladsweb.modaps.eosdis.nasa.gov/learn/modis-to-viirs-transition); Earthdata "urges users to switch" a VIIRS [snippet] — [NASA Science Data Highlights May 2025](https://science.data.nasa.gov/features-events/data-software-highlights-may-2025)
- **Terra es el único sensor de fuego en órbita matinal y NASA estudia alternativas**: VERIFICADO (en el contexto FIRMS) [fetch] — [FIRMS blog](https://www.earthdata.nasa.gov/news/blog/transitioning-from-suomi-npp-viirs-omps-what-firms-users-need-know); no hay sucesor MODIS-like matinal planificado por NASA [fetch] — [LAADS](https://ladsweb.modaps.eosdis.nasa.gov/learn/modis-to-viirs-transition)
- **Geostacionarios (GOES, Himawari, Meteosat) cada 10–15 min, menor resolución**: PARCIAL — FIRMS da resoluciones 1–3 km y latencias GOES ~20–30 min, MSG ~30 min, Himawari ~30 min; NRT reemplaza URT 1–3 h después; solo se muestran clases GOES FDC 10/30 (good) y 11/31 (saturated) [fetch] — [FIRMS FAQ](https://www.earthdata.nasa.gov/data/tools/firms/faq). La cadencia de 10–15 min no fue verificada en esta sesión.
- **Formatos FIRMS (text, shapefile, KML, WMS)**: VERIFICADO — ML en CSV ASCII; TXT diarios (últimos 2 meses); SHP, KML y CSV para 24 h / 48 h / 7 días actualizados cada 60 min; shapefiles en WGS84; WMS generado al vuelo [fetch] — [FIRMS FAQ](https://www.earthdata.nasa.gov/data/tools/firms/faq). Para NOAA-20/21: el blog indica REST API, WMS/WFS y feeds CSV/SHP con parámetros `VIIRS_NOAA20_NRT`/`VIIRS_NOAA21_NRT` [fetch] — [FIRMS blog](https://www.earthdata.nasa.gov/news/blog/transitioning-from-suomi-npp-viirs-omps-what-firms-users-need-know)
- **"C61 disponible desde abril 2021"**: VERIFICADO [fetch] — [FIRMS FAQ](https://www.earthdata.nasa.gov/data/tools/firms/faq). **"Cambios de calibración, no de algoritmo"**: CONSISTENTE con las fuentes (cambios C6.1 centrados en L1B) [snippet] — [MCD64 User Guide V61](https://LPDAAC.USGS.GOV/documents/1006/MCD64_User_Guide_V61.pdf)
- **NOAA-20 ~50 min / media órbita respecto de S-NPP**: VERIFICADO "approximately 50 minutes apart" en el mismo plano [fetch] — [FIRMS blog](https://www.earthdata.nasa.gov/news/blog/transitioning-from-suomi-npp-viirs-omps-what-firms-users-need-know)

### Inferencias
- Para el pitch del hackathon: la narrativa "VIIRS ve más fuegos (pequeños y nocturnos), por eso un empalme ingenuo MODIS→VIIRS crea un salto artificial en 2012" está bien respaldada.

### Gaps
- Cadencia exacta de los geostacionarios en FIRMS (full disk 10 min GOES-R, etc.) no verificada con fuente primaria en esta sesión.

## 9. Caveats conocidos: falsas alarmas, fuentes estáticas, sun glint, SAA y huecos de datos (dips artificiales)

### Takeaway
Los principales riesgos de artefactos en el calendario son: (1) fuentes estáticas (volcanes, industria, gas flares, offshore) → filtrar con `type` y/o máscara de anomalías térmicas estáticas; (2) diferencias NRT vs SP en confidence (SAA nocturna VIIRS sobre Argentina); (3) outages concretos que generan caídas artificiales: S-NPP 10–17 jul-2026, NOAA-20/21 5–7 nov-2026 (activo al 10-nov), NOAA-21 18-sep-2025 y 1-oct-2025, 30–31 jul-2026; (4) meses parciales por inicio/fin de sensores y deriva orbital de Terra/Aqua.

### Cited Findings
- Falsas alarmas (geostacionarios): sunglint, agua brillante, desiertos/suelos brillantes, costas e inconsistencias de navegación; corte por view zenith angle 65° (SEVIRI, AHI) y 60° (MTG FCI) [fetch] — [FIRMS FAQ](https://www.earthdata.nasa.gov/data/tools/firms/faq)
- VIIRS low-confidence diurnos asociados a sun glint; nocturnos low-confidence solo en la región SAA (11°E–110°W, 7°N–55°S) y **removidos del NRT de FIRMS** [fetch] — [FIRMS Attributes](https://www.earthdata.nasa.gov/data/tools/firms/active-fire-data-attributes-modis-viirs)
- Gas flares: capa "Static Thermal Anomaly" en FIRMS basada en "Data compiled by the World Bank for the Global Gas Flaring Tracker Report MARCH 2023", con estimaciones 2012–2022 [fetch] — [FIRMS FAQ](https://www.earthdata.nasa.gov/data/tools/firms/faq)
- `type` = 0/1/2/3 (vegetación/volcán/otra fuente estática/offshore) solo en MCD14ML [fetch] — [FIRMS Attributes](https://www.earthdata.nasa.gov/data/tools/firms/active-fire-data-attributes-modis-viirs)
- **S-NPP outage**: la nave entró en "non-nominal state" el 10-jul-2026 (11:48 UTC según update del 27-jul; 14:50 UTC en el aviso inicial) hasta 04:00 UTC del 17-jul-2026; todos los productos S-NPP (incluye active fires) deshabilitados desde 01:30 UTC del 11-jul; datos desde el 1-may-2026 regenerados con tablas de calibración revisadas; resuelto el 27-jul-2026 [fetch] — [Earthdata alert S-NPP July 10 2026](https://www.earthdata.nasa.gov/data/alerts-outages/suomi-npp-viirs-data-outage-anomaly-july-10-2026)
- **NOAA-20/NOAA-21 gaps 5–7 nov-2026**: huecos de datos VIIRS NOAA-20 y NOAA-21 el 5 y 6-nov-2026, y NOAA-20 el 7-nov-2026; "Active Outage", resolución "TBD" (publicado 9-nov, act. 10-nov-2026); no menciona FIRMS [fetch] — [Earthdata alert VIIRS gaps Nov 5 2026](https://www.earthdata.nasa.gov/data/alerts-outages/viirs-data-gaps-processing-delays-from-november-5-2026)
- Otros eventos: VIIRS Processing Delay activo desde 30-oct-2026; retrasos NRT3 27–28-oct-2026 que afectaron LANCE y FIRMS (resuelto); anomalía VIIRS NOAA-21 30–31-jul-2026 (resuelta) [snippet] — [Earthdata VIIRS processing delay](https://www.earthdata.nasa.gov/data/alerts-outages/viirs-processing-delay); [Earthdata VIIRS NOAA-21 data anomaly](https://www.earthdata.nasa.gov/data/alerts-outages/viirs-noaa-21-data-anomaly)
- NOAA OSPO: outage N21 VIIRS el 18-sep-2025 de 3 h 33 min [snippet] — [OSPO MSG 2025-09-18](https://ospo.noaa.gov/data/messages/2025/09/MSG_20250918_0527.html); NOAA-21 VIIRS en Safemode el 1-oct-2025 con pérdida de datos [snippet] — [OSPO MSG 2025-10-01](https://ospo.noaa.gov/data/messages/2025/10/MSG_20251001_2050.html)
- NRT: error de geolocalización normalmente < 100 m pero puede llegar a varios km tras maniobras o clima espacial severo (degradación < 2 h Terra/NOAA-20/NOAA-21; hasta 12 h Aqua) [fetch] — [FIRMS FAQ](https://www.earthdata.nasa.gov/data/tools/firms/faq)
- Diamond-shaped gaps entre órbitas consecutivas cerca del ecuador (~30°N–30°S) [fetch] — [FIRMS FAQ](https://www.earthdata.nasa.gov/data/tools/firms/faq)

### Inferencias
- Implementar en la app un **indicador de cobertura** por mes y satélite (número de días/pasadas con datos) para distinguir "pocas detecciones" de "sin datos". Meses a marcar: jul-2026 (S-NPP), nov-2026 (S-NPP cese, NOAA-20/21 huecos 5–7), y los meses de inicio de cada sensor.
- Para el período NRT (últimos 2–3 meses), sin `type`: aplicar una máscara estática propia (p.ej. celdas con detecciones persistentes en muchos años, o la capa de gas flares de FIRMS) para quitar fuentes industriales; en Argentina relevante para yacimientos (p.ej. Vaca Muerta/Neuquén, Golfo San Jorge — inferencia geográfica, no verificada con datos).
- La SAA (muy intensa sobre Sudamérica) también puede afectar MODIS con ruido de detector, pero solo encontré documentación explícita del efecto para VIIRS nocturno.

### Gaps
- No hallé un listado consolidado de outages/safe modes de Terra y Aqua (p.ej. eventos 2000–2025) ni de S-NPP pre-2026 (existe un aviso LP DAAC "Suomi NPP Recovers from Safe Mode" sin fecha verificada — [LP DAAC](https://lpdaac.usgs.gov/news/suomi-npp-recovers-from-safe-mode2/)). Recomendación: detectar gaps empíricamente contando pasadas/día por satélite en los propios datos FIRMS.
- No verifiqué efectos documentados de la SAA en MODIS active fire.
- No se confirmó si los huecos NOAA-20/21 del 5–7-nov-2026 afectan a FIRMS NRT (el aviso no lo menciona).
