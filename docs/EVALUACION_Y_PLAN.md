# FireSync: evaluación de jurado y plan para ganar el Global

Fecha: sábado 14 de noviembre de 2026, 02:00 (UTC−3). Entrega: domingo 15 a las 23:59, hora del Local Event.

Este documento hace tres cosas. Primero, evalúa FireSync con la rúbrica oficial, como lo haría un jurado. Después dice qué hay que construir para que cada criterio llegue a 5. Al final da el plan hora por hora. Las fuentes de las reglas son el [Judging & Awards Guide](https://www.spaceappschallenge.org/resources/judging-awards-guide/) y el [Project Submission Guide](https://www.spaceappschallenge.org/resources/project-submission-guide/), resumidos en `reports/Armonización MODIS VIIRS para FireSync.md`.

---

## 1. Lo que hay que saber antes de apuntar a "ganar todo"

- **Hay 10 Global Awards para todos los retos juntos**, y el proyecto compite contra miles. Ningún proyecto de fuego ganó un Global Award entre 2023 y 2025. El tema no da ventaja; la dan la ejecución y la presentación.
- **Un mismo proyecto difícilmente se lleva más de un premio global.** No encontré la regla escrita, pero las listas de ganadores muestran un premio por equipo. El objetivo realista es un premio global, no todos.
- **El premio.** Según la guía 2026, los ganadores se anuncian el 26 de enero de 2027 y se los invita a una *Winner's Celebration* **virtual**. En las páginas 2026 que revisamos no aparece un viaje a instalaciones de NASA. Si alguien les dijo que hay viaje, pídanlo por escrito en Space Apps Connect.
- **El camino al Global:** jurado local → Global Nominees (3 de diciembre) → Global Finalists (17 de diciembre) → comité ejecutivo de NASA y agencias socias → ganadores (26 de enero). Primero hay que ganar el jurado local.
- **Premios a los que apuntar**, en este orden:
  1. **Best Use of Data**: hacer accesible un registro de fuego de 26 años que hoy está partido en dos sensores.
  2. **Best Use of Science**: un método de armonización validado y publicado.
  3. **Galactic Impact**: cobertura global para cualquier gestor de incendios del planeta.
  4. **Local Impact**, como respaldo: el caso Chilecito en La Rioja.

## 2. Evaluación de jurado (escala oficial de 1 a 5)

### 2.1 Lo que van a entregar casi todos los equipos de este reto

Ya hay al menos dos repositorios públicos de otros equipos (firelens y FireChronicle). Ambos ajustan **una regresión OLS única de MODIS sobre VIIRS** y la muestran en un heatmap con un mapa de puntos. Esa es la solución que el jurado va a ver diez veces.

| Criterio | Puntaje esperado para la solución típica | Por qué |
|---|---|---|
| Impact | 3 | Resuelve el reto, pero solo para una región y sin usuario real |
| Creativity | 2 | Heatmap más factor lineal: es lo que el enunciado ya describe |
| Validity | 3 | Un factor global ignora bioma, estación y día/noche, y nadie mide el error |
| Relevance | 4 | Usa FIRMS, pero muchas veces sin separar satélites |
| Presentation | 3 | Demo de pantalla sin historia |
| **Total** | **15/25** | Puede llegar a Global Nominee; no alcanza para finalista |

### 2.2 FireSync hoy

Hoy FireSync es una investigación sólida y un concepto, sin producto. Su ventaja real es saber cosas que los demás no saben:

- Que Suomi NPP se apagó el 2 de noviembre a las 15:40 UTC.
- Que Terra deriva hacia las 8:30 de la mañana.
- Que FIRMS filtra la SAMA solo en los datos NRT.
- Que VIIRS ve entre 3,5 y 6,5 veces más focos que MODIS según el bioma.
- Que no existe un método publicado para armonizar conteos.

Esa ventaja se pierde si no se convierte en producto visible.

### 2.3 Qué tiene que tener FireSync para sacar 5 en cada criterio

| Criterio | Qué mira el jurado | Qué tiene que mostrar FireSync |
|---|---|---|
| **Impact** | Magnitud del problema, alcance, audiencia | Cobertura **global** (cualquier país o cualquier punto del planeta), no solo Argentina. El problema es universal: MODIS se retira y todos los gestores de incendios pierden su serie de 26 años. Dataset abierto y reutilizable |
| **Creativity** | Idea nueva o mejora importante de algo existente | Un **motor de continuidad** en lugar de un factor mágico. **Globo 3D sincronizado con el calendario**, time-lapse de 26 años y **simulador del apagón de MODIS** |
| **Validity** | Base científica, factibilidad, usabilidad, listo para uso real | Calibración estratificada (país × mes × día/noche) con *shrinkage*; **validación hindcast publicada** (entrenar 2012–2017, probar 2018–2021); procedencia e incertidumbre en cada celda; app desplegada, rápida y accesible |
| **Relevance** | Responde todo el reto; datos NASA centrales | Checklist del reto cumplido punto por punto (sección 5). FIRMS MODIS C6.1 y VIIRS 375 m por satélite, más imágenes Blue Marble de NASA en el globo |
| **Presentation** | Historia, demo, página de entrega | Video de 30 s con una historia: *"¿Fue julio de 2026 anormal en Chilecito? Hasta hoy no se podía responder sin mezclar dos sensores incompatibles."* Visuales de nivel profesional |

## 3. Qué construir: los siete diferenciadores

Los ordeno según cuánto suman frente a cuánto cuestan.

1. **Registro global armonizado 2000–presente.** Calendarios precalculados para todos los países y para cualquier área: un clic en el globo más un radio. Sale de los 48 ZIP anuales globales de FIRMS. Es la base de Impact y de Best Use of Data.
2. **Motor de continuidad** (el corazón científico).
   - Cadena de satélites de referencia: Terra (nov-2000 a jun-2002), luego Aqua, luego Suomi NPP (feb-2012 a 2-nov-2026), luego NOAA-20.
   - La unidad del calendario son focos equivalentes VIIRS.
   - Los factores se estiman por país × mes calendario × día/noche, con *shrinkage* jerárquico hacia el factor del país y luego al global cuando hay pocos focos.
   - Cuando se suma un satélite nuevo (NOAA-21 o NOAA-22) se recalibra igual.
3. **Laboratorio de validación**: una página pública con el error del método.
   - Hindcast: el modelo se calibra en 2012–2017 y predice 2018–2021.
   - Métricas: sesgo, error absoluto mediano y correlación en log.
   - Gráfico de dispersión por país y **simulador del apagón**: se elige cualquier año y se pretende que solo existía MODIS, y se ve cuánto se equivoca la reconstrucción.

   Ningún competidor mide su error, y eso vale Validity y Best Use of Science.
4. **Calendario honesto.** Cada celda muestra si es VIIRS observado o reconstruido desde MODIS (con rayado), su banda de incertidumbre y las transiciones de sensor marcadas.
5. **Globo 3D realista sincronizado.**
   - Blue Marble de NASA con relieve, océanos con brillo especular, nubes animadas y atmósfera.
   - Un clic en una celda del calendario hace volar el globo y "levanta" los focos de ese mes.
   - Botón de **time-lapse**: 26 años de fuego en 60 segundos.

   Es el gancho visual para Presentation.
6. **Anomalía en lenguaje claro.** Ejemplo: *"Julio de 2026 en Chilecito: 2.º mes de julio más activo en 25 años, +340 % sobre la mediana."* Se acompaña de la mediana, el percentil y el ranking. Responde el ejemplo literal del enunciado.
7. **Fire Brief exportable**: PNG del calendario, CSV de la matriz, CSV de focos y JSON con método y versión. Es la salida para un gestor de emergencias.

**Fuera de alcance**: predicción con ML, alertas en tiempo real y armonización de FRP. Todos los demás equipos se van a ir para ahí; FireSync gana por profundidad, no por amplitud.

## 4. Riesgos y cómo cubrirlos

| Riesgo | Cómo se cubre |
|---|---|
| Faltan los datos de 2026: los ZIP por país llegan hasta 2025, y Chilecito es de julio de 2026 | Pedir la **MAP_KEY** de FIRMS apenas abra el día. El pipeline ya trae el comando `fetch2026` |
| Estado de Aqua después de agosto de 2026 sin confirmar | Desde 2012 la serie usa VIIRS, así que no afecta al calendario. Se documenta igual |
| Datos web pesados para jueces con mala conexión | Calendarios por país precalculados (KB); las teselas se cargan solo al dibujar un área |
| La URL bloqueada en redes de jurado (FortiGuard) | Pedir la clasificación del dominio el domingo temprano |
| Demo de más de 30 s | Queda **fuera del juzgamiento global**. Cronometrar antes de subirla |
| Uso de IA | La guía exige declararlo y marcarlo en el código. Está en `AI_USAGE.md`; ver la sección 7 |

## 5. Checklist del enunciado (Relevance)

| Pedido del reto | Dónde lo cumple FireSync |
|---|---|
| Armonizar MODIS y VIIRS hasta que no importe el sensor | Motor de continuidad y focos equivalentes VIIRS |
| Calendario de actividad desde inicios de los 2000 | Heatmap año × mes, de 2000-11 al presente |
| Elegir región y rango de fechas | País, clic en el globo con radio, lat/lon y años de inicio y fin |
| Qué meses y años tuvieron más fuego | Ranking, totales anuales y perfil estacional |
| Mes actual frente a la mediana histórica | Tarjeta de anomalía y frase en lenguaje claro |
| Rampas de color accesibles | Secuencial perceptual (tipo *inferno*) y divergente apta para daltonismo |
| CSV descargable | CSV de la matriz, de la serie y de los focos del área |
| Mapa interactivo | Globo 3D con selección por clic |
| Pocos indicadores claros | Cuatro tarjetas: total, pico, anomalía y ranking |

## 6. Plan hora por hora

Roles: **R1 Datos y pipeline · R2 Ciencia y validación · R3 Globo y frontend · R4 Calendario, UX y accesibilidad · R5 Producto, demo y entrega.** Asígnenlos en el kickoff según lo que sabe cada uno.

| Bloque (UTC−3) | Qué se hace | Quién |
|---|---|---|
| **Sáb 02:00–09:00** | Descarga global de FIRMS, pipeline de armonización, calendarios por país, primera versión del calendario y del globo | Claude |
| **Sáb 09:00–10:00** | Kickoff: revisar el prototipo, asignar roles, pedir la MAP_KEY, crear el repo en GitHub, revisar Resources y Global Offers, postear en Space Apps Connect | Todos |
| Sáb 10:00–14:00 | Datos de 2026 por API (`fetch2026`) · laboratorio de validación · preset de Chilecito · pulido del globo | R1 · R2 · R5 · R3 |
| Sáb 14:00–20:00 | Time-lapse · Fire Brief · frases de anomalía · accesibilidad · primer deploy público | R3 · R4 · R2 · R4 · R1 |
| **Sáb 20:00** | **Checkpoint**: URL pública con datos globales | Todos |
| Dom 09:00–15:00 | Página de método, rendimiento, interfaz bilingüe y guion del video | R2 · R3 · R4 · R5 |
| **Dom 15:00** | **Feature freeze** | Todos |
| Dom 15:00–19:00 | Grabar el video (máximo 30 s, subtítulos en inglés) · texto de la entrega · References | R5 · R2 · R1 |
| **Dom 20:00** | **Primer submit** | R5 |
| Dom 23:00 | Último re-submit, con una hora de margen | R5 |

### Guion del video (30 s, siguiendo la estructura oficial)

- **0–2 s:** "We are FireSync, from Argentina."
- **2–5 s:** "NASA's MODIS fire record is ending, and VIIRS sees fires differently."
- **5–10 s:** "FireSync is the continuity engine for Earth's fire record." Logo y globo girando.
- **10–20 s:** clic en Chilecito, el calendario se ilumina, clic en julio de 2026, el globo vuela y aparece "+340 % vs. median" (con la cifra real); después, el time-lapse global.
- **20–30 s:** "26 years, 4 satellites, one consistent record, validated and open for every fire manager on Earth."

## 7. Estado al sábado 14, 03:30

**Hecho y verificado en el navegador:**

- **Datos globales reales.** 48 archivos anuales de FIRMS (9,1 GB comprimidos) y **556 millones de detecciones** procesadas en 110 s. Cubren 238 países, de noviembre de 2000 a diciembre de 2025, con diciembre de 2025 completo.
- **Motor de continuidad.**
  - Factores globales: Aqua→VIIRS 4,96 (día) y 29,3 (noche); Terra→VIIRS 11,9 y 12,7; **NOAA-20 frente a Suomi NPP: 1,00 y 0,98**, así que el empalme VIIRS→VIIRS no necesita corrección.
  - **Validación ciega** (calibración 2012–2017, prueba 2018–2021, 6.760 países-mes): error mediano de **22,8 % contra 35,7 %** del factor global único, un **36 % menos de error**.
- **App web** (`web/`):
  - Globo realista (Blue Marble, relieve, océanos especulares, nubes y atmósfera) con time-lapse.
  - Calendario con procedencia, anomalía, ranking y frase en lenguaje claro.
  - Gráficos estacional y anual con el empalme ingenuo, laboratorio de validación y simulador del apagón de MODIS.
  - CSV, PNG, enlace compartible e interfaz EN/ES.
- **Hallazgo real para la demo:** en Chilecito (40 km de radio), noviembre de 2017 registra 291 focos, +2.325 % sobre la mediana: el mes más alto del registro.

**Agregado a las 03:50:**

- **2026 completo hasta el 14 de noviembre** por la API de FIRMS: 21 millones de filas y 813.645 detecciones de fuentes fijas eliminadas con la máscara.
- **Búsqueda de provincias y localidades** (OpenStreetMap), con la vista anclada al lugar y solo sus puntos.
- **Hectáreas quemadas** con MODIS MCD64A1 vía Planetary Computer.
- **Globo en GPU sin trabas.**
- **Demo:** Chilecito en julio de 2026 da 243 focos, +3.140 % sobre la mediana, #1 en 26 años, y unas 11.790 ha quemadas.

**Publicado a las 04:30:** el repo está en https://github.com/zzzJanozzz/FireSync y la app en https://zzzjanozzz.github.io/FireSync/. Cada push a `main` la vuelve a publicar sola.

**Pendiente, por prioridad:**

1. **MAP_KEY de FIRMS** (gratis, se pide con un email en https://firms.modaps.eosdis.nasa.gov/api/map_key/). Con ella se ingiere 2026: la API da 5 días por llamada y el mes de julio de Chilecito sale de ahí. Hay que sumar el comando de ingesta al pipeline: las filas de la API no traen país, así que se asigna con la celda dominante histórica.
2. **Repositorio en GitHub y deploy.** Esta máquina no tiene git. Los datos de `web/data` pesan unos 117 MB (el archivo más grande, 2,6 MB), así que entran en GitHub Pages o Cloudflare Pages.
3. Reemplazar `WebNasa2.html`: tiene buen diseño, pero sus números son inventados y sus fotos son de stock. No puede aparecer en la demo.
4. Video de 30 s y texto de la entrega.

## 8. Global Offers: cuáles sirven

| Oferta | ¿Sirve? | Para qué |
|---|---|---|
| **Dominio gratis (GoDaddy Registry vía Porkbun, spaceapps.earth)** | **Sí** | Una URL propia (por ejemplo `firesync.earth`) se ve profesional ante el jurado. Incluye SSL y dura un año, lo que cubre todo el juzgamiento hasta enero de 2027. Se apunta al hosting gratis (GitHub Pages o Cloudflare Pages) |
| **Meteomatics** | Solo para la demo | Viento y ráfagas del Zonda en Chilecito para el video. Sus términos prohíben mostrar los datos públicamente sin permiso y el acceso vence al terminar el hackathon. Para la app publicada, Open-Meteo |
| Microsoft Planetary Computer | Opcional | No tiene fuego VIIRS. Su área quemada MODIS (MCD64A1) serviría como validación cruzada si sobra tiempo |
| Azure ($200 / 30 días) y Google Cloud ($300 / 90 días) | No hacen falta | La app es estática y se publica gratis. Los créditos vencen antes de que termine el juzgamiento y piden tarjeta. Solo valdrían para un servidor que actualice el NRT cada día, y eso se puede hacer gratis con GitHub Actions |
| GitHub Copilot, Copilot, Teams, Miro | Opcionales | Herramientas de trabajo en equipo; no suman puntos |

## 9. Sobre la declaración de uso de IA

La guía 2026 pide tres cosas: describir en la entrega cómo se usó la SI, marcar con watermark las imágenes y videos generados, y reconocer la SI en el texto y la metadata del código y de los datos. Los jueces ven esas marcas.

Este prototipo lo escribió Claude: el código, el pipeline y la investigación. `AI_USAGE.md` lo dice así, y cada archivo de código lo indica en su encabezado. Declarar solo el diseño y las animaciones no sería exacto. Si un juez lo detecta, el riesgo de descalificación es mayor que cualquier ventaja.
