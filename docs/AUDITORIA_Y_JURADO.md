# FireSync: auditoría técnica y evaluación de jurado

Sábado 14 de noviembre de 2026, tarde (UTC−3). Entrega: domingo 15 a las 23:59.

Este documento tiene cuatro partes:

1. Qué se cambió hoy.
2. La auditoría de optimización, con lo que ya se arregló y lo que queda.
3. La evaluación de FireSync como la haría un jurado, comparada con los otros equipos del mismo reto.
4. Las decisiones que tiene que tomar el equipo.

---

## 1. Qué se cambió hoy

| Pedido | Qué se hizo | Dónde |
|---|---|---|
| Globo más global y regionalizado | **Límites de países** en el globo, con hover y clic. Al elegir un país aparecen **sus provincias o estados**, coloreados por la actividad del mes. Al elegir una provincia aparecen **sus departamentos, condados o distritos**. Son 4 niveles: Mundo → País → Provincia/Estado → Departamento | `web/js/globe.js`, `web/js/app.js` |
| "Todos los estados y países del mundo" | **4.596 provincias y estados de 251 países** (Natural Earth 1:10m, dominio público), cada uno con su calendario de 2000 a 2026 precalculado. El tercer nivel trae **los departamentos de ~180 países** (geoBoundaries), partidos por provincia y también con calendario precalculado | `scripts/build_regions.mjs`, `scripts/build_adm2.mjs`, `web/data/regions/`, `web/data/adm2/` |
| Filtro para regionalizar | Tres selectores encadenados: **País → Provincia/Estado → Departamento**. Además hay migas de pan (Mundo › Argentina › La Rioja › Chilecito) y un buscador instantáneo de las 4.596 provincias del mundo, sin depender de OpenStreetMap | `web/index.html`, `web/js/app.js` |
| Extra para el jurado | Panel **"¿Dónde se está quemando?"**: ranking del mes (países, provincias o departamentos), cada uno comparado con su propia mediana. Modo **Regiones / Círculo** para el clic en el globo. Botón para prender y apagar el color por actividad | `web/js/app.js` |
| Cartel "Qué muestran las columnas" | Se movió a una **barra debajo del globo**, junto a la línea de tiempo. Ya no se superpone con la Tierra en ningún tamaño de pantalla (probado en 1600, 1280 y 390 px de ancho) | `web/index.html`, `web/css/app.css` |
| Cloudflare y firesync.space | `web/_headers` (caché y headers de seguridad), `robots.txt`, `sitemap.xml`, `wrangler.toml`, `canonical` y Open Graph con imagen `og.png`. La guía paso a paso está en `docs/DEPLOY_CLOUDFLARE.md` | raíz y `web/` |
| Requisito del reto que faltaba | **Selector de rango de años** (Desde/Hasta). Controla el calendario, el CSV y el PNG, y queda en el enlace compartible (`yr=2005-2015`) | `web/js/app.js`, `web/js/calendar.js` |

**Por qué no Google Maps.** La API de Google Maps (incluidos los *Photorealistic 3D Tiles*) exige una API key con tarjeta de crédito, factura por carga de mapa y no deja dibujar 70.000 columnas instanciadas en GPU como hace hoy el globo. Natural Earth y geoBoundaries son abiertos, no tienen cuota ni key, funcionan aunque la red del jurado bloquee servicios de Google y se sirven desde el propio dominio. Si igual quieren algo de Google, lo razonable sería un botón opcional "Ver en Google Maps" que abra las coordenadas del área.

**Verificación.** Se probó con Chrome headless (GPU) y capturas en cada nivel, en inglés y en español, en escritorio y en celular. No hubo errores de consola. El enlace `#r=ARG~ARG-1302&t=2026-07` abre directamente La Rioja en julio de 2026:

- 296 focos equivalentes VIIRS.
- **+406 %** sobre la mediana de julio (59).
- Puesto #3 de 26 años.
- Unas 12.350 ha quemadas según MODIS MCD64A1.

---

## 2. Auditoría de optimización

### 2.1 Medido

| Recurso | Antes | Ahora | Comentario |
|---|---|---|---|
| Texturas del globo (Blue Marble, relieve, agua, estrellas, nubes) | 8,2 MB desde jsDelivr (nubes PNG: 5 MB) | **1,3 MB en WebP**, servidas desde el propio dominio | −84 %. Era el mayor peso de la página |
| Datos y código propios de la carga inicial | ~0,5 MB | ~0,66 MB con Brotli | Se suman los bordes del mundo (201 KB) y las series por país del ranking (105 KB) |
| ECharts (304 KB) | Bloqueaba el render (`<script>` sin `defer` en `<head>`) | `defer` | La página pinta antes |
| Bordes de país | Se pedían a OpenStreetMap Nominatim en cada clic (límite de 1 por segundo) | Locales (Natural Earth) | Más rápido y sin rate limit. Nominatim queda solo para buscar localidades |
| Departamentos | — | Un archivo chico por provincia (precalculado) | Pedirlos en vivo a geoBoundaries costaba hasta 40 MB por país (Brasil) |
| Pixel ratio WebGL | Sin límite (×3 en iPhone) | Máximo 1,75 | Menos calor y batería en celulares, sin diferencia visible |
| Caché | Sin configurar | `_headers`: datos 1 día con *stale-while-revalidate*, texturas 30 días, HTML siempre revalidado | Cloudflare comprime JSON con Brotli solo |
| Archivos publicados | 6.186 (234 MB) | 9.071 (368 MB); el más grande pesa 2,7 MB | El límite de Cloudflare Pages es 20.000 archivos y 25 MiB por archivo |

### 2.2 Recomendaciones pendientes, por prioridad

| # | Qué | Por qué | Esfuerzo |
|---|---|---|---|
| 1 | **Pedir la categoría del dominio nuevo** (FortiGuard, Cisco Talos, Palo Alto, Zscaler) apenas esté comprado | Los dominios recién registrados suelen estar bloqueados en redes corporativas y de universidades, y ahí es donde evalúan los jueces. Dejar GitHub Pages como espejo | 15 min |
| 2 | **Autoalojar three.js, globe.gl y ECharts** (un bundle con esbuild en `web/vendor/`) | Hoy dependen de jsDelivr. Si esa CDN está bloqueada o lenta, el globo no carga | 1 h |
| 3 | Grabar el **video de 30 s** con el recorrido Mundo → Argentina → La Rioja → Chilecito | Es lo que más pesa en Presentation | 2 h |
| 4 | Agregar el departamento al enlace compartible (hoy el enlace llega hasta la provincia) | Para compartir "Chilecito" directo | 20 min |
| 5 | Content-Security-Policy | El resto de los headers de seguridad ya están. Una CSP mal escrita puede romper el globo, así que hay que probarla en el deploy de preview | 30 min |
| 6 | Sumar los departamentos al buscador (~45.000 nombres, índice aparte con carga diferida) | Hoy se llega a ellos con el filtro o el clic, no escribiendo | 45 min |
| 7 | Lighthouse en el deploy real: LCP, CLS y accesibilidad | Para tener números que mostrar | 15 min |
| 8 | "Sin dato" en lugar de 0 para meses sin cobertura satelital | Uno de los competidores (SHIFT) lo hace y lo destaca | 1 h |

### 2.3 Calidad del dato regional (lo que hay que poder explicar a un juez)

- **Provincias.** Cada provincia suma las celdas de 0,25° (~28 km) cuyo centro cae adentro. Las celdas costeras con el centro en el mar se asignan a la provincia más cercana, y así el **98,9 % de las celdas con fuego** queda dentro de alguna. Los calendarios de país siguen siendo sumas exactas por país según FIRMS.
- **Error de borde.** Una provincia chica tiene pocas celdas, y el borde redondea a ±1 celda. Las unidades más chicas que una celda (por ejemplo la Ciudad de Buenos Aires) pasan solas a un círculo de la misma superficie.
- **Departamentos.** Los bordes de geoBoundaries no coinciden exactamente con los de Natural Earth, así que la suma de los departamentos puede diferir un poco del total de la provincia. Cada departamento muestra su fuente y su licencia.
- **Cobertura del tercer nivel.** 49.038 subdivisiones de geoBoundaries quedaron anidadas en 3.901 provincias. 2.622 provincias tienen dos o más subdivisiones y, por eso, archivo propio. El 97,4 % de las celdas con fuego cae en alguna subdivisión. Los países sin ADM2 abierto en geoBoundaries llegan hasta la provincia.
- **Ejemplo para la demo.** En julio de 2026, el departamento Chilecito tiene 193 focos equivalentes VIIRS, **+1.508 %** sobre su mediana. Es el departamento más activo de La Rioja ese mes.

---

## 3. Evaluación como jurado

### 3.1 Requisitos del reto

| Pedido del enunciado | ¿Cumple? | Cómo |
|---|---|---|
| Armonizar MODIS y VIIRS hasta que no importe el sensor | Sí | Cadena de satélites de referencia y factores estratificados (país × mes × día/noche) con *shrinkage* |
| Calendario de actividad desde comienzos de los 2000 | Sí | Heatmap año × mes desde noviembre de 2000 hasta noviembre de 2026 |
| Elegir región | Sí, y es el punto más fuerte | País, provincia o estado, departamento, círculo, lat/lon y búsqueda |
| Elegir rango de fechas | **Sí, desde hoy** | Selector Desde/Hasta |
| Qué meses y años tuvieron más fuego | Sí | Calendario, totales anuales, ranking del mes y perfil estacional |
| Mes actual frente a la mediana histórica | Sí | Tarjetas de anomalía, frase en lenguaje claro y anomalía por región en el ranking |
| Paleta accesible | Sí | Inferno (perceptualmente uniforme) y una divergente apta para daltonismo |
| CSV descargable | Sí | Matriz, serie mensual con procedencia y PNG |
| Mapa interactivo | Sí | Globo 3D con 4 niveles administrativos |

### 3.2 Contra quién compite FireSync

Revisé los repositorios públicos del mismo reto (Space Apps 2026, *Harmonization of MODIS and VIIRS Hot Spots*):

| Proyecto | Método | Región | Validación publicada | Interfaz | Demo |
|---|---|---|---|---|---|
| **FireSync** | Cadena de referencia, factores estratificados con *shrinkage* | **Mundo → país → 4.596 provincias → departamentos**, círculo, búsqueda | Hindcast ciego: 22,8 % de error mediano contra 35,7 % del factor único (−36 %) | Globo 3D, calendario, ranking, anomalía, área quemada MCD64A1, EN/ES, CSV y PNG | Sí |
| **SHIFT** (Squadron Zero) | Cociente de totales por celda de 2,5° y mes, con *shrinkage* hacia la tesela de 10° | Cualquier área: preset, país, punto o rectángulo dibujado | Muy fuerte: reglas de decisión fijadas antes de correr, salto de 2012 de 2,64× a 0,97×, prueba ciega con 2026, fallas publicadas | Mapa (MapLibre), globo opcional, anomalía | Sí |
| **Fire Harmony** | LightGBM para predecir la parte MODIS, intervalos del 90 % calibrados | Cualquier lugar en hexágonos H3 (~253 km²), con bordes de país y estado | Pruebas de empalme en 2002 y 2012, comparación con ESA Fire_cci y detección de quiebres. No publica un error del valor armonizado | React con deck.gl, calendario, drivers, pronóstico a 1–3 meses | Sí |
| Icarus | Cociente multiplicativo y *quantile mapping* | Regiones fijas en la configuración | Pre-registrada, con metas no cumplidas | Local, sin demo publicada | No |
| FireHarmonize | Emparejamiento de detecciones (no calibra) | 2 regiones fijas de India | Ninguna | Mapa Leaflet | Sí |
| FireChronicle, otros | Plan sin implementar o solo descarga de datos | — | — | — | No |

**Lo que solo tiene FireSync:**

- La bajada administrativa de 4 niveles, global, con calendario precalculado para cada una de las 4.596 provincias.
- El globo 3D realista con time-lapse anclado al área elegida.
- El ranking de "dónde se quema este mes" con anomalía por región.
- El cruce con área quemada MODIS MCD64A1 (Microsoft Planetary Computer).
- La interfaz bilingüe.
- Un número de error del valor armonizado que se puede comparar directo con el factor único que usan casi todos.

**Dónde le ganan:**

- **SHIFT**, en rigor y transparencia: decisiones pre-registradas, una prueba ciega con 2026 y una sección de limitaciones.
- **Fire Harmony**, en incertidumbre (intervalos del 90 % calibrados), en variables explicativas y pronóstico, y en la comparación contra otro producto (ESA Fire_cci).

### 3.3 Puntaje estimado (escala oficial de 1 a 5)

| Criterio | Antes de hoy | Ahora | Qué falta para el 5 |
|---|---|---|---|
| **Impact** | 4 | **5** | Ya es global hasta el departamento. Hay que mostrarlo en el video |
| **Creativity** | 4 | **5** | El globo regionalizado con ranking y coropleta no lo tiene nadie más |
| **Validity** | 4 | **4** | 1) Una prueba ciega con 2026 (NOAA-20 contra Suomi NPP ya da 1,00 y 0,98; presentarla como test). 2) Una sección de *Limitaciones* en la app. 3) La validación a nivel provincia (el mismo hindcast por admin-1) |
| **Relevance** | 5 | **5** | Cumple todo el enunciado, incluido el rango de fechas |
| **Presentation** | 3 | **4** | El video de 30 s, y que la URL funcione en la red del jurado |
| **Total** | 20/25 | **23/25** | Con video y validez reforzada: 24–25 |

**Veredicto del jurado.** FireSync es el proyecto más completo como producto, y el único que deja a un gestor de cualquier país bajar hasta su departamento y responder en segundos si este mes es anormal. Para pasar de nominado a finalista tiene que igualar la honestidad metodológica de SHIFT (limitaciones y prueba ciega) y contar una historia muy clara en 30 segundos.

---

## 4. Preguntas para el equipo

Están al final del mensaje de Claude y repetidas acá para que no se pierdan.

1. **Git y deploy.** Los cambios están en la copia del Escritorio y no se commitearon. ¿Los commiteo y hago push a `main`? (Eso republica GitHub Pages.) ¿O prefieren revisarlos primero?
2. **Pendrive.** ¿Copio la versión nueva a `D:\FireSync`? Hoy el pendrive tiene la versión de la mañana.
3. **Cloudflare.** ¿Conectan el repo desde el panel (opción A de la guía) o lo subo con `wrangler` desde esta laptop? Para cualquiera de las dos hace falta que inicien sesión ustedes.
4. **Color por actividad en el mundo.** En la vista mundial los países se pintan además de las columnas. ¿Lo dejamos prendido por defecto o solo desde el nivel país?
5. **Preset de la demo.** ¿Cambio "Chilecito · AR" del círculo de 40 km al departamento Chilecito (geoBoundaries)? Es más fácil de explicar en el video.
6. **Validez.** ¿Sumo ahora la sección *Limitaciones* y la prueba ciega 2026 (NOAA-20 contra Suomi NPP) en el Validation lab? Es lo que más puntos suma en Validity.
7. **Google Maps.** ¿Quieren de todas formas un botón "Abrir en Google Maps" para el área elegida? No necesita API key.
