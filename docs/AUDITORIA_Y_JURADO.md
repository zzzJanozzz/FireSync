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

## 4. Segunda ronda (sábado 14, tarde-noche): rendimiento, mapa 2D y revisión de jurado

### 4.1 El lag: causa y arreglo

La capa de regiones de la primera ronda usaba la capa de polígonos de la librería del globo. Cada país, provincia y municipio era una malla 3D aparte, y en cada movimiento del mouse la librería buscaba qué malla estaba debajo del cursor. Con Minas Gerais abierto había más de 2.000 mallas.

Ahora la capa está reescrita:

- **Bordes:** todos los bordes de un nivel son una sola malla de líneas.
- **Relleno:** el color por actividad se pinta en una textura sobre un parche de la esfera.
- **Hover y clic:** se resuelven con una cuenta geométrica en CPU (rayo contra esfera y punto dentro del polígono), sin consultar a la GPU.

Medido con Chrome y GPU real, antes y después, en la misma laptop:

| Vista | Antes | Ahora | Llamadas de dibujo ahora |
|---|---|---|---|
| Mundo | 147 ms por frame (7 fps) | 16,7 ms (60 fps) | 8 |
| Brasil con 27 estados, moviendo el mouse | 222 ms (4,5 fps) | 16,7 ms (60 fps) | 25 |
| Minas Gerais con 853 municipios, moviendo el mouse | 459 ms (2 fps) | 16,7 ms (60 fps) | 21 |
| Sakha (Rusia) | sin medir | 16,7 ms (60 fps) | 28 |

En pantalla de celular (390 px) da los mismos 60 fps. No pude medirlo en un teléfono físico: la medición es en esta laptop con tamaño de pantalla de celular.

Otros ajustes de rendimiento:

- El globo deja de dibujar cuando no está en pantalla (en celular, al bajar al calendario) y mientras se usa el mapa 2D.
- Arrastrar la línea de tiempo mueve solo el mapa y el marcador del calendario. Los gráficos, el ranking y el área quemada se recalculan cuando se suelta.
- En pantallas de alta densidad se apaga el antialiasing y se limita la resolución del globo.

### 4.2 Qué se agregó

| Pedido | Qué se hizo |
|---|---|
| Mapa 2D | Switch **Globo 3D / Mapa 2D**. Arranca en 3D. El 2D comparte regiones, focos, selección, círculo, time-lapse y enlace compartible (`v=2d`). Tiene zoom con rueda, pellizco y botones +/− |
| Selección región / círculo | Botones más grandes con ícono. En modo círculo se ve el círculo siguiendo al cursor antes de hacer clic, y su radio inicial se ajusta al zoom (ya no aparece como un punto). Panel de radio con valores rápidos (50, 100, 250, 500, 1000 km). Al volver a Regiones con un círculo puesto, se abre el país donde estaba el círculo |
| Sacar o cambiar la selección | Botones **Volver** (un nivel arriba) y **Quitar** junto al nombre del área. La tecla Esc también sube un nivel |
| Tarjeta del cursor | Ya no sigue al mouse. La lectura (tipo, nombre, focos del mes, anomalía) queda fija en la esquina superior izquierda |
| Zoom al elegir | El encuadre se calcula con el contorno del territorio principal (sin islas lejanas) y el tamaño del panel. Brasil pasó de altura 1,77 a 0,92; Argentina, de 1,52 a 0,75 |
| NavBar | Marca con 12 celdas (un mini calendario) que se encienden al cargar y al pasar el mouse. Secciones numeradas con una línea que se desliza a la sección que se está leyendo. Línea de progreso de lectura. Indicador "Datos hasta el 14 nov 2026". El buscador se expande al enfocarlo y se abre con la tecla `/`. En celular queda en dos filas ordenadas |
| Calendario primero | El calendario quedó como sección 01, justo después del resumen. Arriba tiene cuatro datos que responden la pregunta del reto: mes pico del registro, año más activo, temporada habitual y veredicto del mes elegido. La columna de totales es además un gráfico de barras, y la fila de medianas va coloreada con la misma rampa |
| Validez | Sección **Limitaciones** (7 puntos, EN y ES) y **chequeo del relevo** con datos que el ajuste nunca vio (ver 4.4) |

### 4.3 Bugs encontrados y corregidos

| Bug | Efecto | Arreglo |
|---|---|---|
| Área quemada inflada en áreas grandes | Brasil, septiembre de 2024: 51 millones de ha (6 % del país). El servicio leía versiones reducidas de la imagen, que agrandan la proporción quemada | Se consulta en bloques de 6° a resolución completa. Ahora da unos 9,6 millones de ha (1,1 %), del mismo orden que los cerca de 10 millones de ha que informó MapBiomas para ese mes (verificar la cifra antes de citarla). Chilecito no cambia (unas 11.800 ha). En países gigantes (Rusia, Canadá) avisa que hay que elegir una provincia |
| El globo quedaba tapado por la barra superior en anchos intermedios | La barra pasaba a dos filas y el globo no bajaba | La altura de la barra se mide y se usa para ubicar el globo |
| Etiquetas superpuestas en los gráficos de validación | El título del eje se cortaba y la leyenda pisaba la marca de "deriva orbital" | Reubicadas |
| "Zona cerca de Argentina" salía con el nombre del país en inglés | Mezcla de idiomas en español | Usa el nombre traducido |
| El enlace compartible no guardaba el departamento | Al compartir Chilecito se abría La Rioja | El enlace ahora llega hasta el departamento |
| Cabecera en celular | "Lat / Lon" en dos renglones y el botón ES cortado | Dos filas: marca e idioma arriba; buscador, Mundo y Lat/Lon abajo |

La cifra de área quemada de La Rioja en julio de 2026 pasó de unas 12.350 ha a unas **11.350 ha** con la lectura a resolución completa. Ya está corregida en el texto de la entrega.

### 4.4 Chequeo del relevo (dato nuevo para Validity)

Octubre de 2026 es el único mes completo en que Suomi NPP y NOAA-20 están los dos en el registro de 2026. Los factores de NOAA-20 se ajustaron con 2018–2025, así que ese mes es una prueba con datos sin tocar:

- 138 países con al menos 20 focos.
- Error absoluto mediano: **7,7 %**.
- Sesgo total: **+3,8 %**.
- 64 % de los países dentro de ±10 % y 80 % dentro de ±20 %.

Es un solo mes y son datos casi en tiempo real. La app lo dice así, sin adornarlo. Se regenera con `node scripts/handover_check.mjs web/data`.

### 4.5 Puntaje de jurado actualizado

| Criterio | Ronda 1 | Ahora | Por qué |
|---|---|---|---|
| Impact | 5 | 5 | Global hasta el departamento, y ahora usable en máquinas lentas |
| Creativity | 5 | 5 | Globo y mapa regionalizados, ranking, time-lapse anclado |
| Validity | 4 | 4,5 | Suma limitaciones y una prueba con datos sin tocar. Falta validar a nivel provincia (heredan el factor del país) |
| Relevance | 5 | 5 | El calendario es lo primero que se ve y responde la pregunta del reto en una línea |
| Presentation | 4 | 4 | Sigue faltando el video de 30 s. Es el punto con más margen |
| **Total** | 23 | **23,5** | Con un buen video: 24 a 24,5 |

### 4.6 La subjetividad del jurado y la chance real de estar entre los 10 globales

Esto es una estimación de criterio, no un dato. Nadie puede calcularla.

**Cómo es el camino.** Jurado local → Global Nominee → unas decenas de finalistas → 10 ganadores. Cada paso lo decide gente distinta, con criterios distintos.

**Qué pesa en cada etapa:**

- **Jurado local.** Suele haber personas que no son especialistas en fuego. Pesa mucho que entiendan el problema en un minuto, que la demo funcione en vivo y la seguridad con que respondan preguntas. Un jurado puede premiar al equipo más joven, al más "social" o al que mejor habla, por encima del método.
- **Jurado global.** Ve cientos de proyectos y lo único que seguro mira son el **video de 30 segundos** y la página de entrega. Muchos no abren la app. Si la abren, es un minuto y tal vez desde el celular.
- **Los 10 premios son por categoría**, no un ranking único: Best Use of Data, Best Use of Science, Galactic Impact, Local Impact, Best Use of Technology, Most Inspirational, Art & Technology, entre otros. Un proyecto gana porque es el mejor ejemplo de *una* categoría.

**Lo que juega a favor:**

- El reto lo escribió CONAE y el caso de demostración (Chilecito) es argentino y aparece en el video del reto. Eso da una historia propia que otros equipos no tienen.
- Es el único proyecto del reto que baja hasta el departamento en todo el mundo, con error publicado y limitaciones a la vista.
- El producto está terminado y publicado: un juez puede usarlo de verdad.

**Lo que juega en contra:**

- El reto es de nicho. Entre 2023 y 2025 ningún proyecto de fuego ganó un premio global.
- SHIFT y Fire Harmony son rivales serios dentro del mismo reto, y puede haber otros que no publicaron el código.
- El código lo escribió casi todo una IA. Está declarado, como exige el reglamento, pero un jurado puede valorar menos al equipo por eso. Tienen que poder explicar el método con sus palabras.
- Sin un video muy claro, el trabajo no se ve.

**Estimación honesta:**

| Etapa | Chance estimada | De qué depende |
|---|---|---|
| Ganar o ser nominado en el evento local | Alta: 60 a 80 % | Que la demo en vivo salga bien y que expliquen el método sin leer |
| Finalista global | Posible pero difícil: 10 a 20 % | El video de 30 s y la página de entrega |
| Uno de los 10 ganadores | Baja: 2 a 5 % | Encajar como el mejor ejemplo de una categoría (Best Use of Data o Local Impact) y algo de suerte |

Un 2 a 5 % parece poco, pero el punto de partida de un proyecto cualquiera es mucho menor que 1 %. Lo que más mueve la aguja de acá al domingo no es más código: es el **video**, la **historia de Chilecito contada en 30 segundos** y **practicar las respuestas** a las preguntas del jurado.

**Preguntas que les van a hacer (practíquenlas):**

1. ¿Por qué no alcanza con multiplicar MODIS por un número?
2. ¿Cómo saben que su método funciona? (Respuesta: hindcast ciego, 22,8 % contra 35,7 %, y el chequeo de octubre de 2026.)
3. ¿Qué no puede hacer su herramienta? (Respuesta: las limitaciones.)
4. ¿Qué parte hicieron ustedes y qué parte la IA?
5. ¿Quién lo usaría mañana y para qué?

## 5. Preguntas para el equipo

1. **Publicar.** Los cambios de esta ronda están en la laptop, sin commit. ¿Hago commit y push a `main`? Eso actualiza la versión pública.
2. **Preset de la demo.** ¿Cambio "Chilecito · AR" (círculo de 40 km) por el departamento Chilecito? Da +1.508 % y es más fácil de explicar.
3. **Color por actividad en la vista mundial.** ¿Lo dejamos prendido por defecto o solo desde el nivel país?
4. **Librerías propias.** ¿Paso three.js, globe.gl y ECharts a nuestro dominio? Hoy dependen de jsDelivr, y si la red del jurado lo bloquea no carga nada. Lleva una hora.
5. **Presentación.** Cuando me den el OK empiezo el PPT. Necesito saber: ¿cuántos minutos tienen frente al jurado local?, ¿en qué idioma presentan?, ¿quién habla?
