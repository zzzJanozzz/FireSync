# Referencias UX de calendarios de fuego y opciones tecnológicas para FireSync (build de 2 días)

> Convención: **[VERIFICADO]** = leído en la fuente citada durante esta investigación (13-nov-2026). **[INFERENCIA]** = recomendación o conocimiento previo no re-verificado en esta sesión. Las cifras de terceros (blogs comparativos) se señalan como tales.

## 1. Catálogo UX: cómo muestran la estacionalidad, anomalías y comparación con promedios los sistemas existentes (y qué puede hacer FireSync distinto)

### Takeaway
Ningún sistema revisado ofrece un verdadero "calendario de fuego" mes × año coloreado para un área dibujada por el usuario: INPE tiene la tabla mes × año más parecida (con filas Mínimo/Média/Máximo, pero sin rampa de color, solo resalta el máximo), y GWIS/EFFIS/GFW usan curvas semanales o acumuladas contra un promedio (10 años o 2006–2025) con banda min–max o ±SD. El hueco que FireSync puede llenar: heatmap mes × año con rampa accesible + anomalías (vs mediana/percentiles) + ranking, para cualquier polígono, con baseline seleccionable y descarga CSV.

### Cited Findings

**INPE – Programa Queimadas, "Estatísticas dos Focos Ativos por Países" (la referencia más cercana a un calendario de fuego)** [VERIFICADO, página renderizada en navegador y estilos inspeccionados]
- URL para Argentina: https://data.inpe.br/queimadas/estatisticas/?tipo=paises&item=argentina (la antigua URL de terrabrasilis redirige aquí con 301). Filtros por país (América do Sul, Argentina, Bolivia, Brasil…), estado, región, bioma y regiones especiales — [INPE](https://data.inpe.br/queimadas/estatisticas/?tipo=paises&item=brasil)
- Layout: **filas = años (1998 → año actual), columnas = Janeiro…Dezembro + Total**. Título: "Comparação do total de focos ativos detectados pelo satélite de referência em cada mês, no período de 1998 até 12/Nov." Debajo, tres filas resumen: **Mínimo\*, Média\*, Máximo\*** — [INPE Argentina](https://data.inpe.br/queimadas/estatisticas/?tipo=paises&item=argentina)
- Notas textuales: "O cálculo de mínima, média e máxima não consideram os valores do ano corrente." y "Os valores do mês mais recente do ano corrente são parciais porque compreendem os valores do primeiro dia do mês até ontem" — [INPE Argentina](https://data.inpe.br/queimadas/estatisticas/?tipo=paises&item=argentina)
- Valores de ejemplo (Argentina, satélite de referência): agosto 2020 = 20.541 focos (máximo histórico de agosto); Média agosto = 9.717; Máximo anual = 74.111 (2020); Média anual = 35.354; 2026 hasta 12/nov = 16.124; agosto 2026 = 1.798 — [INPE Argentina](https://data.inpe.br/queimadas/estatisticas/?tipo=paises&item=argentina)
- **Artefacto importante**: la fila Mínimo para agosto es 3 y para sep–dic es 2, porque incluye 1998–2000, años casi vacíos para Argentina (1998 = 0 total; 1999 = 19; 2000 = 65), cuando 2001 ya tiene 15.922 — [INPE Argentina](https://data.inpe.br/queimadas/estatisticas/?tipo=paises&item=argentina)
- Colores (inspeccionados vía computed style): celdas de datos **sin rampa de color** (fondo gris #F5F5F5, texto negro); solo el **máximo de cada columna** se marca con clase `is-max` en rojo rgb(246,50,24) con texto rgb(48,48,48); filas resumen: Mínimo amarillo rgb(255,208,77), Média naranja rgb(246,120,24), Máximo rojo rgb(246,50,24); encabezado gris #E0E0E0 — [INPE Argentina](https://data.inpe.br/queimadas/estatisticas/?tipo=paises&item=argentina)
- Segunda tabla: comparación **día a día** del mes actual vs el mismo mes del año anterior (p.ej. 11/2025 vs 11/2026), con la advertencia "Não é recomendada a comparação dos valores díarios, apenas dos totais mensais." — [INPE Argentina](https://data.inpe.br/queimadas/estatisticas/?tipo=paises&item=argentina)
- Gráficos: Figura 1 serie histórica; Figura 2 "Comparativo dos dados do ano corrente com os valores mínimos, médios e máximos" (pestañas Comparativo mensal / 1° sem. / 2° sem.); Figura 5 "Cumulativo Mensal". Cada tabla tiene "Download dos dados em CSV" — [INPE Argentina](https://data.inpe.br/queimadas/estatisticas/?tipo=paises&item=argentina)
- Stack observado en la página: Chart.js 4.4.3 (jsDelivr), jQuery 3.4.1, scripts propios `grafico_historico_faixa.js` (gráfico de banda), `exportador_csv.js` (export CSV en cliente), `keyboard_nav.js` (navegación por teclado) y el plugin VLibras (lengua de señas) — [INPE Argentina](https://data.inpe.br/queimadas/estatisticas/?tipo=paises&item=argentina)
- Los boletines mensuales Infoqueima comparan cada mes contra un promedio histórico (p.ej. estados con récord del mes vs promedio 1998–2016) — [INPE Infoqueima 2017-08](https://dataserver-coids.inpe.br/queimadas/queimadas/Infoqueima/2017/2017_08_infoqueima.pdf)

**Global Forest Watch (ahora "Global Nature Watch")** 
- [VERIFICADO] La URL del dashboard de país redirige a globalnaturewatch.org con el aviso "Global Forest Watch is now Global Nature Watch". La pestaña INCENDIOS (en español) lista widgets: "Alertas de incendio semanales", "Alertas de incendio acumuladas", "Historial de alertas de incendios", "Regiones con más alertas de incendio", "Pérdida de cobertura arbórea a causa de los incendios"; nota "*en el mapa se pueden mostrar un máximo de 3 meses de datos de incendios" — [GNW dashboard ARG](https://www.globalforestwatch.org/dashboards/country/ARG/?category=fires)
- [VERIFICADO, fuente antigua] Según el equipo que construyó los widgets (Vizzuality), el widget semanal promedia las alertas de cada semana en varios años, calcula la **desviación estándar** y dibuja bandas alrededor de la línea "normal"; el baseline usaba "the last eight years of data in the case of VIIRS"; texto generado del tipo "unusually high number … compared to recent years" — [Vizzuality blog, vía resumen de búsqueda](https://medium.com/vizzuality-blog/framing-data-f7df7f19bccd) (la página devolvió 403 al fetch directo; contenido de 2017, puede estar desactualizado)
- [VERIFICADO] El blog de GFW describe la visualización "significant fires" que "shows how current fires compare statistically to the historical average", gráficos acumulados que "show how past fire seasons have progressed", y que MODIS empieza en 2000 y VIIRS en 2012 — [GFW/GNW blog](https://globalnaturewatch.org/blog/data-and-tools/wildfire-trends-gfw-fire-data/)
- El widget "Historial de alertas" ofrece todo el histórico a resolución diaria como alternativa a la vista estadística por bandas — [Vizzuality "Playing with fires"](https://medium.com/vizzuality-blog/playing-with-fires-bd018bf941b2) (vía resumen de búsqueda)

**GWIS (Global Wildfire Information System, JRC/Copernicus)** [VERIFICADO]
- Current Statistics Portal: burnt area y número de fuegos del año actual "compared to the average of the last 10 years"; "seasonal cumulative trend"; gráficos separados de anomalías térmicas VIIRS y MODIS vs sus promedios de 10 años; cubre países y regiones (p.ej. Amazonía Legal brasileña) — [GWIS applications](https://gwis.jrc.ec.europa.eu/applications)
- Country Profile: régimen de fuego histórico 2002–2019 a nivel país y sub-país; mapas de área quemada anual/mensual, frecuencia y **estacionalidad**; gráficos de número de fuegos (GlobFire), área quemada (MODIS MCD64A1), "fire regimes (seasonality)", distribución mensual de tamaño de fuego por año, daño por cobertura y emisiones — [GWIS applications](https://gwis.jrc.ec.europa.eu/applications)
- PDF de "seasonal trend" de GWIS: tendencias **semanales** de área quemada y número de fuegos con leyenda "min-MAX (2012-2023) / Average (2012-2023) / 2024" (banda min–max + línea promedio + año actual) — [GWIS seasonal trend PDF (UN_EUR 2024)](https://api2.effis.emergency.copernicus.eu/api/gwis/seasonaltrend/pdf/UN_EUR/2024/CO2) (vía resumen de búsqueda)

**EFFIS (European Forest Fire Information System)** [VERIFICADO]
- Al 4-nov-2026: UE 703.709 ha quemadas vs 1.032.700 ha a la misma fecha de 2025 ("the worst year on record"); promedio de largo plazo 2006–2025 = 386.483 ha a la misma fecha; 2.335 fuegos vs 2.193; enlace al "Wildfire seasonal trend" actualizado semanalmente; EFFIS cuenta fuegos ≳30 ha — [JRC current wildfire situation](https://joint-research-centre.ec.europa.eu/projects-and-activities/natural-and-man-made-hazards/fires/current-wildfire-situation-europe_en)
- La herramienta Seasonal Trend muestra el **acumulado** de la temporada vs el promedio de largo plazo y entrega los datos semanales en tabla bajo el gráfico; leyenda "min-MAX (2006-2024) / Average (2006-2024)" — [EFFIS seasonal trend PDF EU 2026](https://api2.effis.emergency.copernicus.eu/api/effis/seasonaltrend/pdf/EU/2026/CO2) (vía resumen de búsqueda)

**NASA FIRMS** [VERIFICADO]
- Burned Area Mode (Advanced): compara MCD64A1 mensual para 1, 2 o 3 años superpuestos en el mapa; por defecto cada año usa un solo color (no cambia por mes), color/opacidad editables (rueda de color), 50% de opacidad para ver re-quemas; latencia ~2–3 meses; VNP64A1 (VIIRS) "planned" — [FIRMS blog mayo 2025](https://wiki.earthdata.nasa.gov/spaces/FIRMS/blog/2025/05/20/439977926/New+Enhanced+Tools+for+Interannual+and+Monthly+Comparisons+of+Burned+Area)
- La herramienta Timeline permite arrastrar una caja para elegir un día o un rango de fechas; existen Fire Alerts por email/SMS para áreas de interés — [Earthdata FIRMS data tool focus](https://earthdata.nasa.gov/learn/articles/firms-data-tool-focus) (vía resumen de búsqueda)

**CAMS GFAS (Copernicus Atmosphere)** [VERIFICADO vía resumen]
- GFAS cubre desde 1-ene-2003; la app "Fire Emissions Watch" permite explorar emisiones por país, región o área elegida, con tendencias diarias, mensuales y anuales; CAMS publica gráficos de emisiones de carbono diarias **acumuladas** por país (p.ej. EE.UU. 2023) contra años previos — [airqualitynews](https://airqualitynews.com/headlines/new-tool-reveals-the-planets-wildfire-emissions-in-real-time/); [CAMS 2023 review](https://atmosphere.copernicus.eu/2023-year-intense-global-wildfire-activity)

**MapBiomas Fogo** [VERIFICADO vía resumen]
- "Monitor do Fogo": primer mapeo **mensual** de cicatrices de fuego de Brasil con mosaicos Sentinel-2 desde 2019, usando buffer de 5 km alrededor de focos de calor; la Colección anual retrocede a 1985; la Colección 5 (2026) incluye mapas mensuales de área quemada como assets de Earth Engine — [MapBiomas](https://brasil.mapbiomas.org/en/wp-json/wp/v2/pages/827); [Legenda Fogo Col. 5](https://brasil.mapbiomas.org/wp-content/uploads/sites/4/2026/05/CODIGO-DE-LEGENDA-FOGO-COLECAO-5.pdf)

**Canadá CWFIS** 
- La página FM3 Hotspots muestra tabla de hotspots y área quemada acumulados en el año (year-to-date); la copia indexada tenía datos de nov-2025 — [CWFIS FM3](https://cwfis.cfs.nrcan.gc.ca/maps/fm3?type=arpt). No se encontró el gráfico vs promedio de 10 años (ver Gaps).
- Patrón "porcentaje del promedio" (EE.UU., NIFC): "132% of the 10-year average number of fires and 141% of the average acres burned for this date" (23-oct-2026) — [NIFC National Fire News](https://www.nifc.gov/fire-information/nfn?ftag=YHF4eb9d17)

**Referencias académicas / "fire calendars"**
- Giglio, Csiszar & Justice (2006, JGR): distribución global de densidad de píxeles de fuego MODIS, mes pico, duración de temporada y periodicidad anual; los conteos mensuales se normalizan por diferencias de pasada/cobertura — [Giglio et al. 2006](https://dataserver-coids.inpe.br/queimadas/queimadas/Publicacoes-Impacto/material3os/2006_Giglio_etal_GlobalDistribuiton_JGR_DE3os.pdf)
- Greenpeace "Global Fire Calendar": usa detecciones MODIS desde 2001 para mapear riesgo de fuego por mes, globalmente y en 20 países — [Greenpeace Fire Calendar](https://maps.greenpeace.org/projects/firecal/)
- Nature Communications 2018 (Amazonía): define temporada de fuego como meses con >10.000 detecciones, figura año × mes con barras del mes pico — [PMC5811599 Fig5](https://pmc.ncbi.nlm.nih.gov/articles/PMC5811599/figure/Fig5)
- Sensibilidad VIIRS 375 m: ~3× más píxeles de fuego de día y ~25× de noche vs VIIRS 750 m (Schroeder et al. 2014) — [Schroeder et al. 2014](https://directreadout.sci.gsfc.nasa.gov/publications_documents/Schroeder_et_al_2014b_RSE.pdf) → implica que MODIS y VIIRS **no** son comparables en conteos absolutos sin armonización.

### Inferences
- **Estadísticos usados en el ecosistema**: INPE = min/media/max mensual (excluye año actual); GWIS = promedio 10 años + banda min–max (semanal) y acumulado; EFFIS = promedio 2006–2025 + min–max (acumulado semanal); GFW/GNW = media ± SD semanal (baseline ~8 años VIIRS en 2017); NIFC = % del promedio de 10 años. Nadie usa mediana ni percentiles ni ranking explícito → oportunidad para FireSync.
- **Qué puede hacer FireSync mejor** [INFERENCIA]:
  1. Heatmap mes × año real (rampa secuencial accesible, valor en la celda opcional), no solo resaltar el máximo como INPE.
  2. Vista de anomalía conmutable: (a) % de la mediana, (b) z-score robusto ((x − mediana)/MAD), (c) percentil/rango ("agosto 2020: 1.º de 26 agostos") con rampa divergente centrada en 0/mediana.
  3. Baseline configurable y transparente (p.ej. "2003–2025, años completos, MODIS-only" vs "2012–2025 VIIRS"), evitando el artefacto de INPE donde 1998–2000 hunden el mínimo.
  4. Cualquier polígono dibujado o lat/lon + radio (GFW/GWIS se centran en unidades administrativas; FIRMS no da estadísticas por AOI según lo encontrado).
  5. Marcar meses parciales (como INPE) y "sin datos" distinto de "cero".
  6. Fila resumen con mediana, P10/P90 además de min/max; "Top 5 meses/años".
  7. Bilingüe ES/EN y descarga CSV de los puntos crudos del área (INPE ofrece CSV de agregados, no de puntos por polígono).
- El texto rojo #303030 sobre #F63218 en las celdas "máximo" de INPE da un contraste aproximado de 3,1:1 (cálculo propio con la fórmula WCAG), por debajo de 4,5:1 → ejemplo a no copiar.
- Narrativa automática tipo GFW ("Agosto 2026: 1.798 focos, 81% por debajo de la mediana 2003–2025") es muy útil para gestores de emergencia y fácil de generar.

### Gaps
- No se pudo renderizar el widget semanal de GNW/GFW (carga diferida en pane en segundo plano): no se confirmó si hoy usa ±1 SD y ±2 SD, el baseline actual ni los colores. La página de metodología no apareció.
- No se obtuvo captura/estilo de los gráficos GWIS/EFFIS (colores de banda); solo la leyenda vía PDF indexado.
- CWFIS: no se encontró el gráfico "area burned vs 10-year average".
- FIRMS: no se encontró ningún gráfico de conteo de focos activos por AOI; parece no existir en la UI.
- El "satélite de referência" de INPE no está nombrado en la página (se sabe de forma general que es un MODIS de pasada vespertina, no verificado aquí).
- No se encontró un paper específico con figura "fire calendar" mes × año con rampa de color; los ejemplos académicos son de estacionalidad (Giglio 2006) o barras.

## 2. Rampas de color, clasificación y legibilidad

### Takeaway
Para conteos usar una rampa secuencial perceptualmente uniforme y apta para daltónicos (viridis/cividis/magma/inferno, o ColorBrewer YlOrRd/OrRd que comunica "fuego"), con clasificación log o por cuantiles por la fuerte asimetría; para anomalías una divergente apta para daltónicos (RdBu/PuOr/BrBG) centrada en 0, y diferenciar explícitamente cero (color base) de sin-dato (gris con patrón).

### Cited Findings
- **cividis** (Nuñez, Anderton & Renslow, PLOS ONE 2018) se obtuvo optimizando viridis para visión con deficiencia de color: es perceptualmente uniforme en tono y brillo, el brillo aumenta linealmente y permite interpretación casi idéntica para personas con y sin daltonismo rojo-verde; el paper trata viridis como "gold standard" y muestra cómo "jet" falla — [Nuñez et al. 2018](https://pmc.ncbi.nlm.nih.gov/articles/PMC6070163)
- ColorBrewer tiene un filtro "colorblind safe"; no todos sus esquemas lo son — [Wikipedia ColorBrewer](https://www.wikipedia.com/wiki/ColorBrewer); [aperiodic.net](https://aperiodic.net/pip/archives/Geekery/color-data-viz)
- Guía NKI: máximo de clases para uso daltónico-seguro en ColorBrewer = 9 secuencial, 11 divergente, 4 cualitativo — [NKI guidelines](https://nki.nl/about-us/responsible-research/guidelines-color-blind-friendly-figures)
- RColorBrewer expone `display.brewer.all(colorblindFriendly=TRUE)` para listar solo paletas aptas; divergentes disponibles: BrBG, PiYG, PRGn, PuOr, RdBu, RdGy, RdYlBu, RdYlGn, Spectral — [RColorBrewer refman](https://archive.linux.duke.edu/cran/web/packages/RColorBrewer/refman/RColorBrewer.html)
- INPE usa amarillo/naranja/rojo (FFD04D / F67818 / F63218) para min/media/máx, una semántica "fuego" — [INPE Argentina](https://data.inpe.br/queimadas/estatisticas/?tipo=paises&item=argentina)

### Inferences
- [INFERENCIA, conocimiento previo; verificar en colorbrewer2.org] Según `brewer.pal.info$colorblind` de RColorBrewer: divergentes aptas = BrBG, PiYG, PRGn, PuOr, RdBu, RdYlBu; **no aptas** = RdGy, RdYlGn, Spectral. Todas las secuenciales (YlOrRd, OrRd, YlOrBr, Reds…) figuran como aptas.
- Recomendación de paleta para FireSync:
  - Conteos: **YlOrRd** (9 clases, semántica de fuego, apta) o **inferno/magma** (continuas, uniformes). Evitar rojo-verde y "jet"/rainbow. Para el modo oscuro, magma/inferno funcionan bien sobre fondo oscuro.
  - Anomalías: **RdBu invertida** (rojo = más fuego que lo normal, azul = menos) o **PuOr** (naranja = más, púrpura = menos; evita la asociación azul=agua). Centro blanco/gris claro = "normal" (p.ej. dentro de P25–P75 o |z|<0,5).
- Clasificación para conteos sesgados (un agosto puede ser 100× un abril): 
  - **log** (log10(n+1)) con leyenda en valores reales (1, 10, 100, 1 000, 10 000) – buena por defecto para heatmaps año × mes;
  - **cuantiles** (p.ej. 7 clases por quintiles/deciles de todas las celdas) – maximiza contraste pero oculta magnitudes; mostrar cortes en la leyenda;
  - **lineal** solo para áreas pequeñas o rangos estrechos.
  - Ofrecer selector log/cuantil/lineal; por defecto log.
- Cero vs sin dato: cero = color más claro de la rampa (o blanco) con "0" visible; sin dato/fuera de cobertura (p.ej. VIIRS antes de 2012, mes futuro) = gris neutro con trama diagonal y tooltip "sin datos"; mes parcial = borde punteado + asterisco (como INPE).
- Texto en celdas: elegir negro o blanco por celda según la luminancia del fondo para lograr ≥4,5:1 (WCAG 1.4.3); en rampas como inferno/magma el texto debe pasar a blanco en la mitad oscura. Formato numérico localizado (1.234 en es-AR vs 1,234 en en-US) con `Intl.NumberFormat`.
- No depender solo del color (WCAG 1.4.1): mostrar valor en celda o en tooltip/tabla accesible y marcar extremos con iconos/negrita (p.ej. ▲ máximo histórico).

### Gaps
- No se pudo verificar en esta sesión la lista oficial de paletas "colorblind safe" de colorbrewer2.org (la página es dinámica y la búsqueda no devolvió la lista).
- No se verificaron rampas de Crameri (batlow, vik, roma) ni Paul Tol (sron.nl) como alternativas; quedaron fuera por tiempo.

## 3. Librerías de mapa y basemaps (términos de uso)

### Takeaway
Para un build de 2 días: **MapLibre GL JS 5.x + Terra Draw** (WebGL, maneja cientos de miles de puntos y estilos vectoriales gratuitos) o, si el equipo conoce Leaflet, **Leaflet 1.9.4 + Leaflet-Geoman/Leaflet.draw** (Leaflet 2.0 sigue en beta). Basemap: OSM estándar sólo con atribución y sin prefetch; CARTO ahora exige API key (gratis hasta 5M tiles/mes no comercial); Stadia 200k créditos/mes no comercial; Google Maps tiene cuota gratis por SKU (10k cargas Dynamic Maps según terceros).

### Cited Findings
- **Leaflet**: la versión estable listada es 1.9.4 (18-may-2023); 2.0.0-alpha salió en mayo 2025; la home de leafletjs.com (10-nov-2026) anuncia **Leaflet 2.0 beta 3**; no hay 2.0 estable — [leafletjs.com](https://leafletjs.com/); [Leaflet download](https://leafletjs.com/download); [Leaflet 2.0 alpha blog](https://leafletjs.com/2025/05/18/leaflet-2.0.0-alpha.html)
- **MapLibre GL JS**: el ejemplo oficial "Draw geometries with Terra Draw" carga maplibre-gl@5.24.0 — [MapLibre example](https://maplibre.org/maplibre-gl-js/docs/examples/draw-geometries-with-terra-draw/)
- **Terra Draw**: adaptador `terra-draw-maplibre-gl-adapter` (v1.2.3 en Yarn) compatible con MapLibre GL JS v4/v5; existe el plugin de UI `@watergis/maplibre-gl-terradraw` (v1.13.2) — [Yarn](https://classic.yarnpkg.com/en/package/terra-draw-maplibre-gl-adapter); [unpkg README](https://unpkg.com/@watergis/maplibre-gl-terradraw@1.13.2/README.md); [MapLibre plugins](https://maplibre.org/maplibre-gl-js/docs/plugins)
- **OSM tile usage policy** (tile.openstreetmap.org): atribución visible en el mapa; User-Agent distinto y estable que identifique la app, conservar Referer; respetar Cache-Control (o cachear ≥7 días); **prohibido bulk download/prefetch** y uso offline; sin SLA; OSMF puede bloquear sin aviso ante uso intenso — [OSMF Tile Policy](https://operations.osmfoundation.org/policies/tiles/)
- **CARTO basemaps** (Positron, Dark Matter, Voyager): ahora requieren **API key** (`?key=`); sin key los rasters muestran marca de agua "API key required"; gratis no comercial hasta **5M** solicitudes de tiles/mes y comercial hasta **1M**/mes; estilos GL para MapLibre en `https://basemaps.cartocdn.com/gl/{style}-gl-style/style.json?key=...` (voyager, positron, dark-matter y variantes -nolabels) — [CartoDB/basemap-styles](https://github.com/CartoDB/basemap-styles)
- **Stadia Maps**: plan free = 200.000 créditos/mes, **no comercial**, permite desarrollo/test/demo; créditos compartidos entre tiles, geocoding, routing — [Stadia Maps products](https://stadiamaps.com/products/maps/) (un tracker de terceros cita 2.500 vistas/día, contradice la cifra oficial — [agentdeals](https://agentdeals.dev/vendor/stadiamaps-com))
- **Google Maps Platform**: desde marzo 2025 reemplazó el crédito de USD 200/mes por uso gratuito **por SKU** (no acumulable); Dynamic Maps (Essentials) = 10.000 eventos gratis/mes, luego USD 7/1.000 (cifras de terceros, no confirmadas en la hoja oficial) — [Woosmap](https://www.woosmap.com/blog/is-google-maps-api-free); [storerocket](https://storerocket.io/learn/google-maps-api-pricing); [Google pricing overview](https://developers.google.com/maps/billing/overview/)

### Inferences
- [INFERENCIA] **MapLibre GL JS** es la mejor opción si se muestran >50k puntos: capas `circle` o `heatmap` WebGL sobre GeoJSON/vector tiles manejan cientos de miles de features; para millones usar **deck.gl** (ScatterplotLayer, H3HexagonLayer) como overlay interleaved en MapLibre. Leaflet con canvas sufre por encima de ~50–100k marcadores.
- [INFERENCIA] Dibujo: Terra Draw (modos polygon, rectangle, circle, freehand, select) es agnóstico de librería y mantenido; `mapbox-gl-draw` funciona con MapLibre pero arrastra CSS/clases `mapboxgl-*` y está menos activo. En Leaflet, **Leaflet-Geoman** (más moderno) o Leaflet.draw (estable pero viejo).
- [INFERENCIA] OpenLayers es potente (proyecciones, KML/GeoJSON nativos, interacciones Draw) pero con curva de aprendizaje mayor para 2 días.
- [INFERENCIA] Basemap recomendado para la demo: **CARTO Positron/Dark Matter** con key gratuita (la gama de grises hace resaltar la rampa de fuego) o **OpenFreeMap / Protomaps** (estilos vectoriales gratuitos sin key; verificar términos) como respaldo; Esri World Imagery para vista satelital (requiere atribución y términos de ArcGIS — no verificado). Google Maps solo si se quiere usar el crédito de GCP; su SDK no se integra con MapLibre y sus términos restringen superponer en otros mapas.
- La atribución "© OpenStreetMap contributors" + proveedor es obligatoria en todos los casos basados en OSM.

### Gaps
- No se verificó el límite gratuito oficial de **MapTiler** (un resumen de terceros sugiere ~100.000 map views/mes; no confirmado) ni los términos de Esri basemaps.
- No se verificaron versiones actuales de deck.gl, OpenLayers, Leaflet-Geoman ni el estado de mapbox-gl-draw.

## 4. Librerías de gráficos (calendario/heatmap, interactividad, export, accesibilidad)

### Takeaway
**Apache ECharts 6** es la opción más rápida para FireSync: heatmap sobre ejes categóricos año × mes (o el nuevo sistema de coordenadas `matrix`), `calendar` para vistas día × año, `visualMap` para rampas/leyendas por clases, toolbox con exportación PNG/SVG y módulo `aria` para descripciones. Plotly es la alternativa si el equipo trabaja en Python (Dash/Streamlit).

### Cited Findings
- ECharts 6.0.0 se lanzó en agosto de 2025 (Product Hunt: 7-ago-2025); las release notes incluyen un **nuevo sistema de coordenadas "matrix"** y un fix de etiquetas fuera de rango en heatmaps de calendario — [ECharts 6.0.0 release](https://newreleases.io/project/github/apache/echarts/release/6.0.0); [RELEASE_NOTE 6.0.0](https://apache.cs.uu.nl/echarts/6.0.0/RELEASE_NOTE.txt); [Product Hunt](https://www.producthunt.com/products/apache-echarts/launches)
- En ECharts el heatmap **debe** usarse con el componente `visualMap` (en dev lanza "Heatmap must use with visualMap"); el heatmap de calendario usa `coordinateSystem: 'calendar'` con `calendar.range` — [ECharts heatmap source](https://appsheet-third-party.googlesource.com/echarts/+/refs/heads/main/src/chart/heatmap/HeatmapView.ts); [ECharts doc heatmap](https://apache.googlesource.com/echarts-doc/+/0edb9b25f2e3917b56d3310551ce74df9b542970/zh/option/series/heatmap.md)
- INPE construye sus gráficos de banda min/media/máx con **Chart.js 4.4.3** — [INPE Argentina](https://data.inpe.br/queimadas/estatisticas/?tipo=paises&item=argentina)

### Inferences
- [INFERENCIA, conocimiento previo] Comparación:
  | Librería | Calendario/heatmap mes×año | Banda media±SD / P10–P90 | Export PNG/SVG | Accesibilidad | Esfuerzo 2 días |
  |---|---|---|---|---|---|
  | **ECharts 6** | heatmap (categoría × categoría), `calendar`, `matrix` | line + `areaStyle` apilado / `markArea` | toolbox `saveAsImage` (PNG; SVG con renderer svg) | `aria` genera descripción automática; decal patterns para no depender del color | Bajo |
  | **Plotly.js / plotly.py** | `go.Heatmap` con `text` en celdas | `fill='tonexty'` | modebar PNG; SVG con `toImage` | limitada (sin descripción automática) | Bajo (Python) |
  | **Vega-Lite** | `rect` + `color` (scale type log/quantile nativos) | `errorband` | PNG/SVG vía vega-embed | `description`/ARIA en SVG | Medio |
  | **Observable Plot** | `Plot.cell` + `color: {type:"log"|"quantile", scheme:"YlOrRd"}` | `areaY` | SVG nativo | SVG con `ariaLabel`/`ariaDescription` | Bajo-medio |
  | **D3** | total control | total control | SVG | lo que uno implemente | Alto |
  | **cal-heatmap** | estilo GitHub (día × semana) | no | limitada | baja | Bajo pero nicho |
  | **Chart.js + chartjs-chart-matrix** | matrix plugin | fill entre datasets | PNG (canvas) | canvas = requiere tabla alternativa | Medio |
- Observable Plot y Vega-Lite traen escalas `log` y `quantile` y esquemas d3 (viridis, cividis, YlOrRd, RdBu, PuOr) listos — útiles si se prefiere declarativo.
- Patrones de calendario recomendados: (1) **año × mes** (principal; 26 filas × 12 columnas para 2001–2026), (2) **día-del-año × año** (365 columnas, para detectar adelantos/atrasos de temporada), (3) GitHub-style (semana × día, solo para un año), (4) radial/polar por mes (atractivo pero menos legible; usar como extra). Para emergencias, (1) + una curva acumulada vs mediana/P10–P90 cubre el 90% de las necesidades.

### Gaps
- No se verificó la documentación oficial actual de las opciones `matrix`, `aria` y `toolbox` de ECharts 6 ni las versiones vigentes de Plotly, Vega-Lite y Observable Plot.

## 5. Arquitectura para 2 días, agregación espacial y volumen de datos

### Takeaway
La arquitectura más magra y robusta es **(b) frontend estático + datos pre-agregados en Parquet (H3 × año-mes × sensor) + DuckDB-WASM/h3-js en el navegador**, con un pequeño backend opcional (FastAPI + DuckDB en Cloud Run) solo para exportar puntos crudos de polígonos grandes. Streamlit/Dash sirven para un prototipo en horas, pero el dibujo en mapa y el hosting gratuito (Streamlit 2,7 GB máx.; HF Spaces de cómputo ahora requiere plan pago) los hacen más frágiles.

### Cited Findings
- **DuckDB-WASM**: carga extensiones en runtime; `INSTALL spatial; LOAD spatial;` y `INSTALL h3 FROM community; LOAD h3;`; lectura remota vía httpfs del navegador sujeta a **CORS** y forzada a HTTPS; depende de **HTTP range requests** para leer parcialmente Parquet; problemas conocidos de range requests en Firefox (issue #1932) y con URLs pre-firmadas S3 (issue #2228) — [DuckDB-WASM extensions](https://duckdb.org/docs/current/clients/wasm/extensions); [DuckDB-WASM known issues](https://duckdb.org/docs/current/clients/wasm/known_issues); [DuckDB blog extensiones WASM](https://duckdb.org/2023/12/18/duckdb-extensions-in-wasm)
- **H3** (área media / arista): res 4 = 1.770 km² / 26,1 km; res 5 = 252,9 km² / 9,85 km; res 6 = 36,13 km² / 3,72 km; res 7 = 5,16 km² / 1,41 km; res 8 = 0,737 km²; celdas globales: res 5 = 2.016.842, res 6 = 14.117.882 — [H3 resolution table](https://h3geo.org/docs/core-library/restable/)
- Volumen de referencia (Argentina, solo el "satélite de referência" de INPE, un sensor): 15.922 (2001) a 74.111 (2020) focos/año; promedio 35.354/año — [INPE Argentina](https://data.inpe.br/queimadas/estatisticas/?tipo=paises&item=argentina)
- VIIRS 375 m detecta ~3× (día) y ~25× (noche) más píxeles que VIIRS 750 m — [Schroeder et al. 2014](https://directreadout.sci.gsfc.nasa.gov/publications_documents/Schroeder_et_al_2014b_RSE.pdf)
- Cobertura FIRMS: MODIS C6.1 desde nov-2000 (Terra) y jul-2002 (Aqua); VIIRS 375 m desde 20-ene-2012 (S-NPP) y NOAA-20 — [GEE community catalog FIRMS vector](https://gee-community-catalog.org/projects/firms_vector/)
- **Streamlit Community Cloud**: memoria ~690 MB mínimo a 2,7 GB máximo (doc feb-2024, "may change"), apps sin tráfico duermen a las **12 h** — [Streamlit docs manage app](https://docs.streamlit.io/deploy/streamlit-community-cloud/manage-your-app); [Streamlit blog resource limits](https://blog.streamlit.io/common-app-problems-resource-limits)
- **Hugging Face Spaces**: "Static Spaces are free for everyone. Gradio and Docker Spaces run on compute and require a paid plan to create: PRO for personal accounts…"; CPU Basic = 2 vCPU, 16 GB RAM, 50 GB disco no persistente; en hardware gratis la Space "go[es] to sleep" si no se usa — [HF Spaces overview](https://huggingface.co/docs/hub/en/spaces-overview)

### Inferences
- [INFERENCIA] **Comparación de arquitecturas**:
  - **(a) Python-only (Streamlit / Dash / Panel / Shiny for Python)**: + un solo lenguaje, Plotly/Folium listos, ideal para el científico de datos del equipo; − dibujo en mapa vía componentes de terceros (streamlit-folium con Draw, dash-leaflet EditControl, ipyleaflet en Panel) con round-trips al servidor y re-ejecución del script; − hosting gratis limitado (Streamlit 2,7 GB RAM, duerme a las 12 h; HF Spaces Docker/Gradio ya no es gratis para nuevos); − difícil cumplir accesibilidad e i18n finos. Bueno como **prototipo de análisis** el día 1, no como entrega final.
  - **(b) Estático (Vite + React/Svelte/vanilla) + Parquet/JSON pre-agregado + DuckDB-WASM**: + hosting gratis en CDN, sin servidor que se caiga en la demo, latencia de interacción <1 s; + control total de UX/a11y/i18n; − DuckDB-WASM pesa varios MB (carga inicial 2–5 s); − requiere preprocesado offline en Python (que el equipo hace igual para la armonización MODIS+VIIRS). **Recomendada.**
  - **(c) FastAPI/Flask + DuckDB/GeoParquet o PostGIS + frontend**: + consultas exactas punto-en-polígono y streaming CSV de millones de filas; − hay que desplegar y mantener un contenedor (Cloud Run / Azure Container Apps), cold starts; PostGIS es excesivo para 2 días. Útil como **complemento** de (b) solo para `/export`.
- [INFERENCIA] **Esquema de datos recomendado** (preprocesado en Python con DuckDB + extensión h3 o h3-py):
  1. `agg_h3r5_month.parquet`: columnas `h3_r5 (UBIGINT)`, `year (SMALLINT)`, `month (TINYINT)`, `sensor (modis|viirs|harmonized)`, `n (INT)`, opcional `frp_sum`, `n_day`, `n_night`. Ordenado por h3 → excelente compresión y lectura por range requests.
  2. `agg_h3r7_month` solo para Argentina/Sudamérica si se quiere más resolución (5 km²).
  3. Puntos crudos particionados por `year` y por celda H3 res 3 (~12.400 km²) o por país, en Parquet zstd, para el CSV de descarga.
  4. `baseline_h3r5.parquet` opcional precalculado (mediana, P10, P90, media, SD por celda y mes) — aunque para un polígono arbitrario la mediana debe recalcularse sobre la suma del polígono (la suma de medianas ≠ mediana de sumas).
- [INFERENCIA] **Flujo de consulta en el navegador**: polígono dibujado → `h3-js polygonToCells(polygon, 5)` (o 6/7 según área) → `SELECT year, month, sum(n) FROM agg WHERE h3 IN (...) GROUP BY 1,2` en DuckDB-WASM → matriz año × mes → mediana/percentiles por mes con `quantile_cont` → render ECharts. Latencia esperada: polyfill de un polígono de 10.000 km² a res 6 ≈ 280 celdas (~ms); agregación de 10⁵–10⁶ filas en DuckDB-WASM ≈ decenas a cientos de ms; primera carga del Parquet (decenas de MB) depende de la red. Error de borde: celdas parciales en el límite del polígono; aceptable para la vista calendario, y el CSV puede filtrar exacto con `ST_Contains` (spatial) sobre puntos crudos.
- [INFERENCIA] **Alternativas de índice**: geohash (celdas rectangulares que se deforman con la latitud), grilla regular 0,1°/0,25° (simple, buena para Python/xarray, pero áreas desiguales), H3 (áreas casi iguales, jerárquico, librerías JS/Python/DuckDB). Para FireSync, H3 res 5 (global) + res 7 (región foco) es buen compromiso.
- [INFERENCIA] **Volumen de datos**: un sensor tipo MODIS en Argentina da ~15k–75k focos/año; VIIRS 375 m (S-NPP + NOAA-20 + NOAA-21) puede dar varias veces más (orden de 10⁵–10⁶/año para Argentina). A nivel global el archivo FIRMS MODIS+VIIRS es de cientos de millones de filas (no verificado). Con Parquet zstd y ~10 columnas, ≈15–30 bytes/fila → 10 M filas ≈ 150–300 MB. Los agregados H3 r5 × mes para Sudamérica caben en pocos MB. **Recomendación**: limitar la demo a Sudamérica/Argentina para puntos crudos y ofrecer agregados globales.
- [INFERENCIA] Límite de archivo de Cloudflare Pages (25 MiB) obliga a fragmentar Parquet o servir los archivos grandes desde un bucket (Cloudflare R2, Google Cloud Storage con crédito GCP, Azure Blob) con CORS y soporte de `Range`.

### Gaps
- No se encontró el número oficial de detecciones globales por año de VIIRS/MODIS ni el tamaño del archivo FIRMS completo (las páginas consultadas no lo publican).
- No se midió la latencia real de DuckDB-WASM ni de h3-js en esta sesión; las cifras son estimaciones.
- No se verificó la disponibilidad actual de la extensión `h3` en DuckDB-WASM para la versión vigente de DuckDB (la doc muestra el patrón `INSTALL h3 FROM community`, pero no una matriz de compatibilidad WASM).
- No se investigaron Panel ni Shiny for Python en detalle (dibujo y deployment).

## 6. Hosting: free tiers, límites y encaje con las Global Offers (incluida la verificación del dominio GoDaddy Registry/Porkbun)

### Takeaway
Para el frontend estático: **Cloudflare Pages** (sin límite de ancho de banda declarado, 25 MiB/archivo, 20.000 archivos) o **GitHub Pages** (1 GB, 100 GB/mes); **Firebase Hosting** (10 GB almacenamiento, 10 GB/mes de transferencia) y **Google Cloud Run** (2 M requests/mes gratis) encajan con el crédito de GCP; **Azure Static Web Apps Free** (250 MB) encaja con Azure. **No se pudo verificar** la oferta de dominio gratis GoDaddy Registry/Porkbun 2026: la página Global Offers exige login.

### Cited Findings
- **Space Apps 2026 Global Offers**: https://www.spaceappschallenge.org/2026/global-offers/ muestra "Global Offers – You must be logged in to view this content." (verificado abriendo la página; WebFetch además falló por certificado) — [Space Apps Global Offers](https://www.spaceappschallenge.org/2026/global-offers/)
- El sitio oficial lista a **GoDaddy, Google, Meteomatics, Microsoft, Miro** como Global Collaborators 2026 que proveen herramientas gratuitas ("Global Offers"), y el cronograma indica "November 13: Global Offers Available" — [Space Apps 2026](https://www.spaceappschallenge.org/2026/) (vía resumen de búsqueda)
- Antecedente: en 2021 los participantes podían obtener gratis un dominio **.earth**, con registro "handled via the Porkbun registrar" (post del 1-oct-2021; sin mención de hosting ni SSL) — [domain.earth](https://domain.earth/?p=8929)
- **Cloudflare Pages Free**: 500 builds/mes, 1 build concurrente, timeout 20 min, hasta 20.000 archivos por sitio, 25 MiB por archivo, 100 dominios custom por proyecto; la página no lista límite de ancho de banda; Functions cuentan contra la cuota de Workers — [Cloudflare Pages limits](https://developers.cloudflare.com/pages/platform/limits/)
- **GitHub Pages**: sitio ≤1 GB, ancho de banda soft 100 GB/mes, soft 10 builds/h (no aplica con GitHub Actions propio), deploy timeout 10 min; no permitido como hosting de negocio/SaaS comercial — [GitHub Pages limits](https://docs.github.com/en/pages/getting-started-with-github-pages/github-pages-limits)
- **Firebase Hosting** (sin costo): 10 GB de almacenamiento, 10 GB/mes de transferencia CDN; máximo 2 GB por archivo — [Firebase Hosting quotas](https://firebase.google.com/docs/hosting/usage-quotas-pricing)
- **Azure Static Web Apps**: Free = 250 MB por app, 2 dominios custom, 3 entornos staging, SSL gratis auto-renovable, APIs vía Azure Functions "Managed", sin SLA; Standard = 500 MB, 5 dominios, 10 staging, SLA; plan Dedicated retirado el 31-oct-2025 — [Azure SWA plans](https://learn.microsoft.com/en-us/azure/static-web-apps/plans)
- **Google Cloud Run** (facturación por request): gratis 180.000 vCPU-s, 360.000 GiB-s y 2 M requests/mes, agregados por billing account; en regiones Tier 2 el CPU gratis baja (~128.571 vCPU-s); facturación por instancia: 240.000 vCPU-s y 450.000 GiB-s — [Cloud Run pricing](https://cloud.google.com/run/pricing?hl=bg) (vía resumen de búsqueda)
- **Hugging Face Spaces**: Static gratis; Gradio/Docker requieren plan pago para crear (PRO); CPU Basic 2 vCPU/16 GB — [HF Spaces overview](https://huggingface.co/docs/hub/en/spaces-overview)
- **Streamlit Community Cloud**: 690 MB–2,7 GB RAM; duerme a las 12 h sin tráfico — [Streamlit docs](https://docs.streamlit.io/deploy/streamlit-community-cloud/manage-your-app)
- **Netlify Free**: 300 créditos/mes; al agotarse, los proyectos se pausan ("Site not available"); **Vercel Hobby**: solo uso personal/no comercial, ~100 GB/mes de transferencia (cifras de blogs de terceros, no oficiales) — [hostfleet comparativa abr-2026](https://hostfleet.pages.dev/cf-pages-vs-vercel-vs-netlify-2026/); [agentdeals Netlify](https://agentdeals.dev/vendor/netlify); [agentdeals Vercel](https://agentdeals.dev/vendor/vercel)

### Inferences
- [INFERENCIA] **Recomendación de hosting**:
  - Frontend + agregados pequeños: **Cloudflare Pages** (o GitHub Pages con Actions). Ambos gratis, HTTPS automático y dominio custom.
  - Parquet grandes / puntos crudos: bucket **Google Cloud Storage** (crédito GCP USD 300/90 días) o Cloudflare R2, con CORS (`GET`, `HEAD`, header `Range`) y `Cache-Control` largo.
  - Backend opcional `/export` y `/stats` exactos: **Cloud Run** (FastAPI + DuckDB en contenedor; free tier probablemente suficiente para la demo; `min-instances=1` durante el juzgamiento para evitar cold start, cubierto por el crédito). Alternativa Azure: **Container Apps** o App Service con el crédito de USD 200/30 días.
  - Si el equipo prefiere el ecosistema Google completo: **Firebase Hosting** + Cloud Run (rewrites de Firebase a Cloud Run) — encaja en la oferta GCP "incl. Firebase".
  - Evitar depender de HF Spaces (cómputo ya no gratis para cuentas nuevas) y de Render free (spin-down tras inactividad — conocimiento previo no verificado).
- [INFERENCIA] Dominio: si la oferta GoDaddy Registry vía Porkbun se confirma tras login, probablemente sea un TLD de GoDaddy Registry (p.ej. .earth u otros "nuevos gTLD") con 1 año gratis; apuntar el DNS (CNAME) a Cloudflare Pages/Firebase. Si incluye hosting de Porkbun, para un sitio estático igual conviene Cloudflare Pages/GitHub Pages por el soporte de CI y range requests.

### Gaps
- **No verificado**: TLDs exactos, duración, inclusión de hosting/SSL y forma de canje de la oferta GoDaddy Registry/Porkbun 2026 — requiere iniciar sesión en spaceappschallenge.org (no se ingresó ninguna credencial). Un miembro del equipo debe revisarlo logueado.
- No se verificaron en la fuente oficial los límites actuales de Netlify, Vercel, Render y Azure Container Apps / App Service free tier.
- No se confirmó si el crédito de Google Cloud de la oferta cubre explícitamente Google Maps Platform (el brief lo afirma; no visible sin login).

## 7. Exportación CSV / GeoJSON / KML

### Takeaway
Para la escala de una demo (≤ cientos de miles de filas) basta con exportación en el cliente: DuckDB-WASM genera el CSV (o se arma con un Blob) y se descarga con `URL.createObjectURL`; para exportaciones masivas, un endpoint FastAPI con `StreamingResponse` sobre DuckDB. GeoJSON es trivial desde los puntos; KML vía una librería ligera (tokml) o plantilla.

### Cited Findings
- INPE implementa la descarga "Download dos dados em CSV" de las tablas agregadas con un exportador en el cliente (`exportador_csv.js`) — [INPE Argentina](https://data.inpe.br/queimadas/estatisticas/?tipo=paises&item=argentina)
- GFW/GNW anuncia que sus estadísticas "pueden personalizarse, compartirse fácilmente y descargarse para su uso sin conexión" — [GNW dashboard ARG](https://www.globalforestwatch.org/dashboards/country/ARG/?category=fires)
- EFFIS publica los datos semanales en tabla debajo del gráfico de tendencia — [EFFIS seasonal trend PDF](https://api2.effis.emergency.copernicus.eu/api/effis/seasonaltrend/pdf/EU/2026/CO2) (vía resumen de búsqueda)

### Inferences
- [INFERENCIA] Patrón cliente (recomendado):
  - `COPY (SELECT ... WHERE ST_Contains(poly, ST_Point(lon,lat)) AND acq_date BETWEEN ...) TO 'out.csv' (HEADER)` en DuckDB-WASM → `db.copyFileToBuffer('out.csv')` → `new Blob([buf], {type:'text/csv;charset=utf-8'})` → `<a download="firesync_<area>_<desde>_<hasta>.csv">`. Alternativa sin DuckDB: construir strings y `Blob`; para >1 M filas usar `showSaveFilePicker` + streams (Chromium) o fragmentar.
  - Incluir BOM UTF-8 para que Excel en español abra bien acentos, separador `,` con punto decimal (o ofrecer `;` para Excel es-AR), columnas estándar FIRMS (`latitude, longitude, acq_date, acq_time, satellite, instrument, confidence, frp, daynight`) + `sensor_harmonized`, `h3_r5`.
  - Exportar también la **matriz del calendario** (año × mes) y el **baseline** (mediana, P10, P90) en CSV, y la figura en PNG/SVG desde el chart.
  - Incluir un archivo/encabezado de metadatos: fuente (NASA FIRMS, versiones MODIS C6.1 / VIIRS C2), fecha de descarga, polígono en WKT, cita sugerida.
- [INFERENCIA] Patrón servidor: FastAPI `StreamingResponse` iterando batches de `duckdb.execute(...).fetch_record_batch()` → CSV, con `Content-Disposition: attachment`. Necesario solo si se exporta el archivo global o áreas continentales.
- [INFERENCIA] GeoJSON: `FeatureCollection` de puntos (o el polígono dibujado) vía `JSON.stringify`; DuckDB spatial puede hacer `ST_AsGeoJSON`. KML: librería `tokml` (GeoJSON → KML) o plantilla `<Placemark><Point><coordinates>lon,lat</coordinates></Point></Placemark>`; útil para brigadistas que usan Google Earth.

### Gaps
- No se verificaron versiones/estado de `tokml`, `File System Access API` ni la API exacta `copyFileToBuffer` de DuckDB-WASM vigente.

## 8. Accesibilidad (WCAG 2.1/2.2 AA) e i18n ES/EN

### Takeaway
Los puntos críticos para FireSync son: alternativa al dibujo por arrastre (entrada lat/lon, bbox o selección de región, y dibujo por clics), no depender solo del color en el calendario, contraste de texto en celdas ≥4,5:1, tabla de datos accesible como alternativa al gráfico, y UI bilingüe con formatos numéricos/fechas localizados.

### Cited Findings
- **WCAG 2.2 SC 2.5.7 Dragging Movements (AA)**: "All functionality that uses a dragging movement for operation can be achieved by a single pointer without dragging"; ejemplo de rectángulo de selección: activar modo y hacer clic en una esquina y luego en la opuesta; mapas con botones direccionales como alternativa al arrastre; **la equivalencia por teclado no cumple automáticamente** este criterio — [W3C Understanding 2.5.7](https://www.w3.org/WAI/WCAG22/Understanding/dragging-movements.html)
- INPE incluye navegación por teclado (`keyboard_nav.js`) y VLibras en su página de estadísticas — [INPE Argentina](https://data.inpe.br/queimadas/estatisticas/?tipo=paises&item=argentina)
- GNW (ex-GFW) ofrece la interfaz completa en español (menú "ESPAÑOL", widgets traducidos) — [GNW dashboard ARG](https://www.globalforestwatch.org/dashboards/country/ARG/?category=fires)
- cividis está diseñada para interpretación casi idéntica con y sin daltonismo rojo-verde — [Nuñez et al. 2018](https://pmc.ncbi.nlm.nih.gov/articles/PMC6070163)

### Inferences
- [INFERENCIA, criterios WCAG conocidos, no re-leídos en esta sesión] Checklist relevante:
  - **1.1.1 Non-text content**: cada gráfico con `aria-label`/descripción ("Agosto es el mes de mayor actividad; 2020 fue el año récord con 20.541 focos") + tabla HTML equivalente (toggle "Ver como tabla").
  - **1.4.1 Use of color**: valores en celdas o al enfocar, íconos para máximo/mínimo, patrón para "sin datos".
  - **1.4.3 Contrast (texto 4,5:1)** y **1.4.11 Non-text contrast (3:1)** para bordes de celdas, polígono dibujado, controles.
  - **2.1.1 Keyboard**: calendario navegable con flechas (roving tabindex en `role="grid"`), tooltip visible al foco; controles de mapa accesibles; **alternativa al mapa**: campos lat/lon + radio (km), bbox (N/S/E/O), selector de provincia/departamento, pegar WKT/GeoJSON.
  - **2.5.7 Dragging (WCAG 2.2)**: dibujo de polígono por clics sucesivos (Terra Draw polygon mode ya funciona por clics), rectángulo por dos clics.
  - **2.4.7 Focus visible**, **3.1.1/3.1.2 Language of page/parts** (`lang="es"`/`"en"`), **4.1.2 Name, Role, Value** en botones del mapa.
- [INFERENCIA] i18n: diccionario JSON ES/EN (i18next o un objeto simple), `Intl.NumberFormat('es-AR')` / `Intl.DateTimeFormat` para meses ("ene", "feb"…), toggle de idioma persistente en URL (`?lang=es`) para compartir; nombres de meses y leyendas también traducidos en ECharts (`locale` ES disponible en ECharts — no verificado).
- [INFERENCIA] Audiencia (gestores de emergencia, brigadistas): modo alto contraste/oscuro para uso nocturno, tamaño de toque ≥24×24 px (WCAG 2.2 2.5.8), carga ligera para conexiones rurales (pre-agregados pequeños, lazy-load de DuckDB-WASM solo al exportar).

### Gaps
- No se leyeron en esta sesión los textos oficiales de 1.4.3, 1.4.11, 2.1.1 y 2.5.8; se citan por conocimiento de la norma.
- No se verificó la disponibilidad del locale ES en ECharts 6 ni el soporte de teclado de Terra Draw.

---

### Stack magro recomendado (síntesis) [INFERENCIA]
1. **Preprocesado (día 1, Python)**: FIRMS archivo (MODIS C6.1 + VIIRS S-NPP/NOAA-20/NOAA-21) → armonización (filtro de confianza, deduplicación) → DuckDB + h3 → `agg_h3r5_month.parquet` (+ r7 región foco) + puntos crudos particionados.
2. **Frontend**: Vite + vanilla TS o Svelte (o React si el equipo lo domina) · **MapLibre GL JS 5.x** + **Terra Draw** · basemap **CARTO Positron/Dark Matter** (key gratuita) con atribución OSM · **ECharts 6** (heatmap año × mes con `visualMap` YlOrRd/inferno en escala log; vista anomalía RdBu/PuOr; línea mes actual vs mediana con banda P10–P90) · **DuckDB-WASM** + **h3-js** para agregar por polígono y exportar CSV/GeoJSON en el cliente · i18n ES/EN.
3. **Datos/hosting**: Cloudflare Pages o GitHub Pages (frontend) + GCS/R2 con CORS (Parquet) · opcional Cloud Run (FastAPI + DuckDB) para export masivo · dominio de la oferta Global Offers (pendiente de verificar con login).
4. **Plan B Python** (si el frontend se atrasa): Streamlit + streamlit-folium (Draw) + Plotly heatmap, desplegado en Streamlit Community Cloud o Cloud Run.
