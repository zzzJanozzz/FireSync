# Contexto NASA Space Apps Challenge 2026 para FireSync (challenge "Harmonization of MODIS and VIIRS Hot Spots")

> Notas de investigación (13 nov 2026). Todas las páginas de spaceappschallenge.org se leyeron renderizadas en navegador el 13/11/2026 (WebFetch fallaba por SSL). "Verificado" = texto leído directamente en la URL citada. "Inferencia" = deducción propia, marcada como tal. Lo de años anteriores está rotulado con el año.

## 1. Página del challenge y pestaña Resources: ¿qué recursos hay realmente?

### Takeaway
La pestaña Resources hoy contiene **solo dos cosas**: el disclaimer de NASA sobre sitios no gubernamentales y **una única entrada: FIRMS** (NASA Earthdata). No hay sección "Space Agency Partner Resources" (ni CONAE), ni papers, ni tutoriales de FIRMS, ni "Other resources". El equipo no se está perdiendo nada; la lista que ya tienen está completa a la fecha.

### Cited Findings
- **Resources tab (verificado 13/11/2026), contenido completo:**
  - Disclaimer: "NASA does not endorse any non-U.S. Government entity and is not responsible for information contained on non-U.S. Government websites. For non-U.S. Government websites, participants must comply with any data use parameters of that specific website." — [Resources tab](https://www.spaceappschallenge.org/2026/challenges/modis-and-viirs-hot-spots/?tab=resources)
  - Sección **"NASA DATA & RESOURCES"**, único ítem: **FIRMS NASA EARTHDATA: Fire Information for Resource Management System** → https://www.earthdata.nasa.gov/data/tools/firms — descripción: FIRMS da acceso global near real-time a imágenes satelitales, active fire/hotspots y productos relacionados para identificar ubicación, extensión e intensidad de incendios; sus herramientas dan datos geoespaciales y servicios a la comunidad de manejo del fuego y al público. — [Resources tab](https://www.spaceappschallenge.org/2026/challenges/modis-and-viirs-hot-spots/?tab=resources)
  - No aparecen secciones de "Space Agency Partner Resources" ni "Other Resources" (el texto completo de la pestaña, extraído del DOM, solo contiene lo anterior). — [Resources tab](https://www.spaceappschallenge.org/2026/challenges/modis-and-viirs-hot-spots/?tab=resources)
- **Metadatos del challenge (verificado):** Event: 2026 NASA Space Apps Challenge; **Difficulty: Advanced, Intermediate**; **Subjects: Earth Science, Software**; Photo credit: "The National Commission on Space Activities of Argentina (CONAE)". — [Details tab](https://www.spaceappschallenge.org/2026/challenges/modis-and-viirs-hot-spots/)
- La página dice: "For data and resources related to this challenge, refer to the Resources tab... More resources may be added before the hackathon begins." No hay sección "Updates" visible. — [Details tab](https://www.spaceappschallenge.org/2026/challenges/modis-and-viirs-hot-spots/)
- **Resumen oficial:** construir una web app que armonice los registros en un "burning activity calendar" basado en active fire hotspots, para early warning/emergency responders, científicos y land managers, para examinar patrones históricos, condiciones inusuales y períodos críticos en un área de interés. — [Details tab](https://www.spaceappschallenge.org/2026/challenges/modis-and-viirs-hot-spots/)
- **Background clave (citas cortas parafraseadas):** MODIS (Terra/Aqua) aporta >2 décadas pero se acerca al fin de su vida operativa y está siendo reemplazado por VIIRS; los registros no son comparables directamente sin armonización por diferencias en resolución espacial, sensibilidad y horarios de observación. Ejemplo de uso explícito: ver qué meses/años tuvieron más actividad y **comparar el mes actual contra la mediana histórica** de un área. Sugiere armonizar hotspots de NASA Earthdata FIRMS. — [Details tab](https://www.spaceappschallenge.org/2026/challenges/modis-and-viirs-hot-spots/)
- **Objectives (verificado):** dos partes: (1) armonización MODIS–VIIRS "so that by the end of that phase the sensor of origin no longer matters and the patterns, trends, and anomalies become the focus"; (2) web app que toma los hotspots armonizados; el usuario selecciona región y rango de fechas y **descarga analytics y visualizaciones**. Calendario con número de hotspots **desde inicios de los 2000 hasta el presente**; considerar **color ramps** para similitudes/diferencias entre meses; **CSV descargable** de hotspots de la búsqueda. — [Details tab](https://www.spaceappschallenge.org/2026/challenges/modis-and-viirs-hot-spots/)
- **Potential considerations (opcionales):** audiencia: early warning y emergency responders, científicos, land managers, firefighters; app interactiva (dibujar AOI en mapa o ingresar lat/lon); **accessible color ramps**; burning calendar; pocos índices clave como comparaciones históricas incl. **anomalías vs promedios multianuales** y número de fuegos detectados y reportados. — [Details tab](https://www.spaceappschallenge.org/2026/challenges/modis-and-viirs-hot-spots/)
- **Otros challenges 2026 cercanos (14 en total):** "Flame in Freefall: SI-Powered Fire Safety Insights from Microgravity Combustion Data" (combustión en microgravedad, otro tema) y "Be An Earth System Trend Detective!" (Advanced; Earth Science/Software; detectar tendencias y su significancia en variables de misiones Earth science). — [2026 Challenges](https://www.spaceappschallenge.org/2026/challenges/); [Trend Detective](https://www.spaceappschallenge.org/2026/challenges/earth-system-trend-detective/)
- Las resources de cada challenge se publican el 13 de noviembre (fecha oficial). — [Participant FAQs](https://www.spaceappschallenge.org/resources/participant-faqs/)

### Inferences
- El checklist del challenge es casi un "rubric oculto": calendar mensual 2000s–presente, comparación mes actual vs mediana histórica, anomalías vs promedio multianual, AOI dibujable o lat/lon, color ramps accesibles, descarga CSV y descarga de analytics/visualizaciones. FireSync debería cubrir explícitamente cada punto y mostrarlo en la demo (impacta en Relevance).
- El crédito de foto a CONAE sugiere que CONAE co-autoró o aportó al challenge, pero **no hay** recursos de CONAE listados; no es verificable desde la página.
- "Trend Detective" aporta una idea útil: hablar de *significancia estadística* de anomalías/tendencias (p. ej., Mann-Kendall) puede subir Validity en FireSync.

### Gaps
- No se puede descartar que se agreguen recursos durante el hackathon (la página lo admite). Conviene re-chequear la pestaña el 14/11.
- No hay campo "Updates" ni changelog público en la página; no se pudo confirmar quién es el autor (NASA vs CONAE).

## 2. Criterios de evaluación, Global Awards y flujo de juzgamiento 2026

### Takeaway
Cinco criterios (**Impact, Creativity, Validity, Relevance, Presentation**), cada uno puntuado **1 a 5** en todas las instancias; el guide no publica pesos (inferencia: igual peso). Flujo: Local Event judges → Global Nominees (3 dic 2026) → Global Finalists + Honorable Mentions (17 dic 2026) → Executive judging → 10 Global Winners (26 ene 2027).

### Cited Findings
- "At every level of judging, from Local and Universal Events to Executive Judging, your project will be evaluated on a scale of 1-to-5" en cada criterio. — [Judging & Awards Guide](https://www.spaceappschallenge.org/resources/judging-awards-guide/)
- **Impact:** magnitud del problema y alcance; un 5 = problema significativo, alcance extenso, beneficia a una gran audiencia. — [Judging & Awards Guide](https://www.spaceappschallenge.org/resources/judging-awards-guide/)
- **Creativity:** originalidad/innovación; concepto nuevo o mejora significativa de ideas existentes. — [Judging & Awards Guide](https://www.spaceappschallenge.org/resources/judging-awards-guide/)
- **Validity:** basado en principios científicos, factibilidad técnica/funcional/lógica, potencial real; también cuentan **usability y user-friendliness**; un 5 = "fully developed and ready for real-world implementation". — [Judging & Awards Guide](https://www.spaceappschallenge.org/resources/judging-awards-guide/)
- **Relevance:** responde directa y completamente al challenge e integra **NASA data como componente central**, "rather than a superficial addition". — [Judging & Awards Guide](https://www.spaceappschallenge.org/resources/judging-awards-guide/)
- **Presentation:** comunicación y storytelling; "Judges evaluate the demo and full project to compute this score." El guide recomienda dar igual atención a la presentación y sumar perfiles de storytelling/diseño. — [Judging & Awards Guide](https://www.spaceappschallenge.org/resources/judging-awards-guide/)
- Sobre la demo: "the majority of judges' evaluation will be based on your project submission. Note: a strong project demo can increase the potential for a high score in the Presentation category". — [Project Submission Guide](https://www.spaceappschallenge.org/resources/project-submission-guide/)
- **Phase 1:** jueces locales (reclutados por el Local Lead) eligen proyectos que pasan a Global Judging = **Global Nominees**, anunciados el **3 dic 2026**. Premios locales son aparte y no influyen; "only officially submitted Global Nominees will be considered". Universal Event: jueces SMEs; cupo proporcional al de Local Events. — [Judging & Awards Guide](https://www.spaceappschallenge.org/resources/judging-awards-guide/)
- **Phase 2:** jueces expertos evalúan Global Nominees → **Global Finalists** y **Honorable Mentions**, anunciados el **17 dic 2026**. — [Judging & Awards Guide](https://www.spaceappschallenge.org/resources/judging-awards-guide/)
- **Phase 3:** comité ejecutivo de NASA y Space Agency Partners; asigna 10 Global Awards; ganadores anunciados el **26 ene 2027** e invitados a un Winner's Celebration virtual. — [Judging & Awards Guide](https://www.spaceappschallenge.org/resources/judging-awards-guide/)
- **10 Global Awards 2026 (texto del guide):** Best Use of Science (mejor y más válido uso del método científico); **Best Use of Data** (hace accesible la space data o la aprovecha en una aplicación única); Best Use of Technology; **Galactic Impact** (más potencial de mejorar la vida en la Tierra o el universo); Best Mission Concept; Most Inspirational; Best Storytelling Award; Global Connection Award; Art & Technology Award; **Local Impact Award** (mayor potencial de diferencia en su comunidad local). — [Judging & Awards Guide](https://www.spaceappschallenge.org/resources/judging-awards-guide/)
- La página general de Awards usa nombres levemente distintos ("Best Use of Storytelling", "Global Connection", "Art & Technology", "Local Impact") y describe Best Use of Science como "science and/or the scientific method". — [Awards](https://www.spaceappschallenge.org/awards/)
- Universal Event: se compara solo contra otros Universal Event; tasa de selección de Global Nominees "comparable". — [Participant FAQs](https://www.spaceappschallenge.org/resources/participant-faqs/)

### Inferences
- Para FireSync, los awards más alineados: **Best Use of Data** (hacer accesible un registro de 20+ años armonizado), **Best Use of Science** (método de armonización validado), y **Local Impact** si el demo se ancla en una región concreta del equipo. Galactic Impact requiere un pitch de escala global.
- Validity premia "fully developed" + usabilidad: mejor una app desplegada y funcional con un alcance acotado que una arquitectura ambiciosa a medias.

### Gaps
- No se publican pesos por criterio ni desempates; tampoco cuántos Global Nominees puede enviar cada Local Event (depende del Local Lead; no especificado en el guide).
- Los horarios de jueceo local/premios locales dependen del Local Lead del evento del equipo (no verificado).

## 3. Requisitos de entrega, deadline, tamaño de equipo, código público y trabajo previo

### Takeaway
La entrega se hace en la página "Project" del equipo en spaceappschallenge.org: abre **sáb 14 nov 09:00** y cierra **dom 15 nov 23:59, hora local del Local Event**. Demo obligatoria: **video ≤30 s** o **≤7 slides**; superar límites = **no elegible** para Global Judging. Todo en inglés. Máx. 6 miembros. **Regla crítica: no se permite empezar a trabajar en el challenge antes del hackathon.**

### Cited Findings
- **Horario:** "Project submission opens on Saturday, November 14 at 9:00 a.m. in accordance with the time zone of your team's Local Event... closes on Sunday, November 15 at 11:59 p.m." Universal Event: hora local de residencia del Team Owner. El tab "Project" aparece recién el 14/11 a las 9:00 hora local. — [Project Submission Guide](https://www.spaceappschallenge.org/resources/project-submission-guide/)
- **Campos del formulario:** Project Name; High-Level Project Summary (qué desarrollaron, cómo responde al challenge, por qué importa); **Link to Project Demo**; **Link to Final Project**; Detailed Project Description (qué hace, cómo funciona, beneficios, objetivos, herramientas/lenguajes/hardware/software); **Use of Super Intelligence (SI)**; **NASA Data**; **Space Agency Partner Data and Other References**. — [Project Submission Guide](https://www.spaceappschallenge.org/resources/project-submission-guide/)
- **Demo:** obligatoria; "Video (30 seconds or less) or slide deck (up to seven slides including title and intro slides)"; alojada externamente (YouTube, Drive, GitHub, etc.) con link público sin login; no se pueden subir videos/slides al sitio. "Projects that exceed these limits will not be eligible for Global Judging." — [Project Submission Guide](https://www.spaceappschallenge.org/resources/project-submission-guide/)
- **Idioma:** inglés en la página y en materiales enlazados; un video puede hablarse en otro idioma pero **debe tener subtítulos en inglés**; slides en inglés. — [Project Submission Guide](https://www.spaceappschallenge.org/resources/project-submission-guide/)
- **Archivos:** la página acepta imágenes JPG/PNG/GIF hasta 10 MB; no videos ni documentos. Recomiendan probar links en navegador privado. Si crean un sitio nuevo, recomiendan (no obligatorio) pedir clasificación en FortiGuard Web Filter para que los jueces puedan acceder (categoría a elegir; "Company Name: N/A"). — [Project Submission Guide](https://www.spaceappschallenge.org/resources/project-submission-guide/)
- **NASA data obligatoria para premios:** "To be eligible for a Global Award, you must use at least one NASA data or resource." Se alienta usar datos de los 17 Space Agency Partners 2026 (incluye National Space Activities Commission of Argentina / CONAE). — [Project Submission Guide](https://www.spaceappschallenge.org/resources/project-submission-guide/)
- **Envío:** marcar "Terms and Conditions" y "Confirm All Work is Original", luego "Submit for Judging"; se puede editar y re-enviar ilimitadamente hasta el cierre; "Only your last saved submission will be reviewed". Lo guardado/enviado después del deadline no es elegible. Todos los miembros deben ser participantes confirmados (no en waitlist) del mismo Local Event. — [Project Submission Guide](https://www.spaceappschallenge.org/resources/project-submission-guide/)
- **Texto del checkbox de originalidad:** confirmar que es trabajo original y que todos los recursos externos (código, texto, imágenes, aunque sean open source) están listados en References. — [Judging & Awards Guide](https://www.spaceappschallenge.org/resources/judging-awards-guide/)
- **Equipo:** Local Event ≥1 persona; Universal ≥2; **máx. 6 miembros**; un equipo = un challenge; no se pueden agregar miembros después del cierre de submission. — [Judging & Awards Guide](https://www.spaceappschallenge.org/resources/judging-awards-guide/); [Participant FAQs](https://www.spaceappschallenge.org/resources/participant-faqs/)
- **Trabajo previo:** "Teams are not allowed to begin working on the challenges prior to the hackathon." — [Participant FAQs](https://www.spaceappschallenge.org/resources/participant-faqs/)
- **¿Código público/GitHub?** No se exige GitHub explícitamente: el "Link to Final Project" puede ser sitio web, hosting en la nube o repositorio, pero debe ser **público sin password/registro**. — [Project Submission Guide](https://www.spaceappschallenge.org/resources/project-submission-guide/). Además, por T&C las soluciones publicadas quedan disponibles para descarga/uso y el contenido original debe ser libre o con licencia OSI (ver §4). — [Participant T&C](https://www.spaceappschallenge.org/legal/)
- Otras: China funding restriction (revisión de actividad bilateral con entidades chinas para elegibilidad global); sin imágenes/voces/likeness de menores de 18. — [Judging & Awards Guide](https://www.spaceappschallenge.org/resources/judging-awards-guide/); [Project Submission Guide](https://www.spaceappschallenge.org/resources/project-submission-guide/)
- Certificado de participación solo si se hace "Submit for Judging" antes del deadline. — [Project Submission Guide](https://www.spaceappschallenge.org/resources/project-submission-guide/)

### Inferences
- **Riesgo para FireSync:** si ya existe código/datos procesados antes del 14/11, eso choca con "not allowed to begin working... prior to the hackathon" y con el checkbox de originalidad. Recomendación: que la investigación previa sea solo de lectura/planificación y que todo el código, el pipeline de armonización y los datasets derivados se generen desde el 14/11 09:00 (repo creado ese día, historial de commits visible como evidencia).
- Hacer el submit "borrador" temprano (domingo de tarde) y re-enviar: solo cuenta la última versión, y evita perder elegibilidad por un problema de último minuto.
- Usar un repo público en GitHub con licencia OSI explícita (p. ej., MIT o Apache-2.0) + app desplegada con URL pública; poner ambos en "Link to Final Project"/descripción.

### Gaps
- No se define qué cuenta como "begin working" (¿investigación/lectura cuenta?); no hay aclaración oficial encontrada.
- No se verificaron horarios/reglas específicas del Local Event del equipo (desconocido cuál es).

## 4. Reglas sobre IA ("Super Intelligence"), branding NASA, disclaimers y licencias

### Takeaway
El uso de IA (el sitio la llama ahora **"Super Intelligence (SI)"**) está **permitido** para acelerar el desarrollo, pero: (a) **no debe usarse para concebir la idea de solución**, (b) hay que **declarar dónde y cómo se usó**, (c) imágenes/videos generados requieren **watermark visible**, código y datos generados requieren **reconocimiento en texto descriptivo y metadata**, y (d) el contenido generado **no puede usar ni modificar branding de NASA**. El contenido original debe ser libre o con licencia OSI (default **Apache 2.0**).

### Cited Findings
- **Terminología:** el FAQ indica que, "In accordance with the September 29, 2026 U.S. Executive Order", se usan los términos "Super Intelligence"/"SI" en lugar de "Artificial Intelligence"/"AI"; SI incluye LLMs, asistentes conversacionales, generación de imagen/video, foundation models y code generation tools. "Each team's project submission must include a description of how SI tools were used". — [Participant FAQs](https://www.spaceappschallenge.org/resources/participant-faqs/) (nota: el decreto no fue verificado independientemente; se reporta tal como lo dice el sitio).
- **Reglas del campo "Use of Super Intelligence (SI)":** uso permitido "as a tool to accelerate innovation and creativity"; "SI should not be used to (come up with your idea of how to solve the challenge)". — [Project Submission Guide](https://www.spaceappschallenge.org/resources/project-submission-guide/)
- "Generated content may not use, contain, or modify any NASA branding or design elements (such as the NASA logos, flags, or mission identifiers)" (con link a las [NASA brand guidelines](https://www.nasa.gov/nasa-brand-center/brand-guidelines/)). — [Project Submission Guide](https://www.spaceappschallenge.org/resources/project-submission-guide/)
- **Indicadores obligatorios:** "Images and videos: Must include a visible watermark to indicate SI generation"; "Audio: Must acknowledge SI generation in descriptive text and metadata"; "Code and data: Must acknowledge SI generation in descriptive text and metadata." — [Project Submission Guide](https://www.spaceappschallenge.org/resources/project-submission-guide/)
- La respuesta del campo SI "is for data-collection purposes only, and your response will not be seen by the judges", pero los jueces sí ven los indicadores (watermarks, texto, metadata) y "will evaluate originality, intent, and execution based on the SI-assisted elements". — [Project Submission Guide](https://www.spaceappschallenge.org/resources/project-submission-guide/)
- **Licencias (T&C 2026, actualizados 7 ago 2026):** todo contenido original debe ser "freely available without restriction or is licensed as open source as defined by the Open Source Initiative"; si no se especifica licencia OSI, NASA lo distribuye bajo **Apache 2.0**. Materiales de terceros (datasets/código no originados en NASA o agencias socias) deben ser libres o con licencia OSI, y sus licencias deben identificarse en la documentación; sin documentación de licencias NASA no publica la solución. — [Participant T&C](https://www.spaceappschallenge.org/legal/)
- **Citas:** "You must cite every source... even if it is open source or freely available"; NASA puede retirar nominaciones/premios a equipos que no citen recursos. — [Participant T&C](https://www.spaceappschallenge.org/legal/)
- **No se aceptan** soluciones con material que promueva servicios/productos comerciales, información propietaria sin derecho a publicarla, PII, etc. Al enviar, se otorga a NASA permiso para mostrar, copiar, distribuir la solución. — [Participant T&C](https://www.spaceappschallenge.org/legal/)
- **Disclaimer de datos de terceros** (aplica a sitios no-USG en Resources): cumplir los parámetros de uso de datos de cada sitio. — [Resources tab](https://www.spaceappschallenge.org/2026/challenges/modis-and-viirs-hot-spots/?tab=resources)
- Export control: el participante es responsable de que no haya información controlada por ITAR/EAR. — [Participant T&C](https://www.spaceappschallenge.org/legal/)

### Inferences
- Para FireSync: incluir un archivo `AI_USAGE.md` (o sección en README) + comentarios/encabezados en archivos de código asistidos por IA + watermark "SI-generated" en cualquier imagen o video generado; no usar logos NASA en el UI ni en la demo (usar texto "Data: NASA FIRMS" en lugar del meatball).
- Citar en References: FIRMS (MODIS C6.1 / VIIRS 375 m SNPP/NOAA-20/NOAA-21 según usen), librerías (Leaflet/MapLibre, pandas, etc.), basemaps (OSM con su licencia ODbL) y cualquier paper de armonización.
- La regla "SI no debe usarse para idear la solución" implica documentar que la idea (armonización + calendario + anomalías) es del equipo.

### Gaps
- No se leyó la página de marca de Space Apps (https://www.spaceappschallenge.org/brand/) ni las NASA brand guidelines en detalle; no se verificó si se puede usar el logo de Space Apps en la demo.
- El sitio no especifica formato concreto de "metadata" para código generado por SI.

## 5. Space Apps Connect y Global Offers 2026

### Takeaway
**Space Apps Connect = GitHub Discussions en github.com/nasa/spaceapps** (abrió el 3 nov, cierra al final del hackathon; requiere estar registrado en Space Apps y logueado en GitHub). La página **Global Offers 2026 requiere login** y no pudo verificarse su contenido sin iniciar sesión.

### Cited Findings
- "Space Apps Connect is hosted on GitHub Discussions and is completely free to use"; conecta con participantes, Local Leads, Navigators, SMEs, Global Collaborators y el GO Team. Para participar hay que estar registrado en el challenge 2026 y logueado en GitHub (menores de 13 no pueden usar GitHub). — [Space Apps Connect Guide](https://www.spaceappschallenge.org/resources/space-app-connect-guide/)
- **Categorías:** Announcements (solo GO Team), **Challenges** (poner el nombre del challenge al inicio del título), Find A Team, General, **Global Offers**, **Project Submission Help**, Universal Event. Se filtra por labels por challenge (ejemplo del guide: label "Flame in Freefall"). — [Space Apps Connect Guide](https://www.spaceappschallenge.org/resources/space-app-connect-guide/)
- Space Apps Connect abre el 3 nov y cierra al concluir el hackathon. — [Participant FAQs](https://www.spaceappschallenge.org/resources/participant-faqs/)
- **Global Offers:** la URL https://www.spaceappschallenge.org/2026/global-offers/ muestra "You must be logged in to view this content." (verificado 13/11/2026; no se inició sesión por restricción). — [Global Offers](https://www.spaceappschallenge.org/2026/global-offers/)
- Fecha oficial: "November 13: Global Offers available." — [Participant FAQs](https://www.spaceappschallenge.org/resources/participant-faqs/)
- Definición (Connect Guide): "Global Offers are free tools and resources that are optional to use when creating your project." — [Space Apps Connect Guide](https://www.spaceappschallenge.org/resources/space-app-connect-guide/)
- El Submission Guide remite a una página de "Global Collaborators" para herramientas extra; la URL probada https://www.spaceappschallenge.org/2026/global-collaborators/ devolvió 404. — [Project Submission Guide](https://www.spaceappschallenge.org/resources/project-submission-guide/)

### Inferences
- Postear dudas técnicas (p. ej., criterios de armonización esperados, si se aceptan datos FIRMS archive/standard vs NRT) en la categoría Challenges con el label del challenge, por si responde un SME del challenge.
- Un miembro logueado debería revisar Global Offers (hosting/cloud credits podrían servir para desplegar FireSync).

### Gaps
- Lista concreta de Global Offers 2026 y sus condiciones de elegibilidad: **no verificable sin login**.
- No se revisaron discusiones existentes con el label de este challenge (requiere login en GitHub).

## 6. Repositorio github.com/nasa/spaceapps

### Takeaway
No contiene código ni datos: es solo un **README** que hospeda Space Apps Connect (GitHub Discussions). Participar en sus Discussions equivale a declarar que uno está registrado en el hackathon 2026 y aceptó los Terms & Conditions.

### Cited Findings
- Repo público con un único archivo `README.md`, 12 commits, ~1.3k stars, 121 forks, sin releases; contribuidores Chris-GO-Team y TKantz. — [nasa/spaceapps](https://github.com/nasa/spaceapps)
- README: "By participating in Discussions within this repository, you are confirming that you have registered for the 2026 NASA Space Apps Hackathon and have agreed to and signed the Terms & Conditions." Incluye contacto conduct@spaceappschallenge.org. — [nasa/spaceapps](https://github.com/nasa/spaceapps)
- El link "Space Apps Connect" del banner del sitio apunta a este repo. — [Challenge page](https://www.spaceappschallenge.org/2026/challenges/modis-and-viirs-hot-spots/)

### Inferences
- No es un lugar para subir el proyecto; el código de FireSync va en un repo propio del equipo.

### Gaps
- Contenido de Discussions no leído (requiere login).

## 7. Proyectos previos de Space Apps sobre fuego (2023–2025) y oportunidades de diferenciación

### Takeaway
En 2023–2025 solo hubo **un challenge de fuego: 2023 "Managing Fire: Increasing Community-based Fire Management Opportunities"** (usaba FIRMS MODIS+VIIRS). Sus mejores proyectos fueron finalistas (no ganadores) y se centraron en **predicción de propagación con ML, alertas a comunidades (SMS/LoRa) y mapas en tiempo real**. En 2024 y 2025 no hubo challenge de fuego ni proyectos de fuego entre ganadores/finalistas/menciones. **No se encontró ningún proyecto previo que armonice MODIS–VIIRS en una serie temporal consistente ni que construya un calendario de actividad de quema con anomalías**: ese es el espacio de FireSync.

### Cited Findings
**2023 – challenge "Managing Fire"**
- Challenge 2023: desarrollar soluciones de monitoreo de fuego/recursos naturales con tecnología y datos públicos para que comunidades locales reporten/monitoreen fuegos y/o mejorar la distribución de datos. Menciona que FIRMS publica active fire data global en ~3 h tras el paso del satélite, desde MODIS (Terra/Aqua) y VIIRS (S-NPP, NOAA-20). Difficulty: Advanced/Intermediate/Beginner-Youth; Subjects: Hardware, Software. — [2023 Managing Fire](https://www.spaceappschallenge.org/2023/challenges/managing-fire-increasing-community-based-fire-management-opportunities/)
- Ejemplos sugeridos en 2023: app móvil para atribuir características del fuego, herramientas de respuesta rápida, reportar zonas de mayor riesgo por sequía/combustibles, erosión post-fuego, restauración; tecnologías: ML/AI, APIs, data science, IoT, image processing, cloud. — [2023 Managing Fire](https://www.spaceappschallenge.org/2023/challenges/managing-fire-increasing-community-based-fire-management-opportunities/)
- **2023 Global Finalists del challenge Managing Fire** (de 40 finalistas): **Firefly** (São Paulo, Brasil; estudiantes del Instituto Federal de São Paulo), **PyroFyro** (Lalitpur, Nepal), **Rocket Hacks** (Hermosillo, México). — [2023 Global Finalists](https://www.spaceappschallenge.org/2023/awards/global-finalists/)
- **Lila** (Mendoza, Argentina): Global Finalist + **Honorable Mention** 2023 en Managing Fire. — [2023 Honorable Mentions](https://www.spaceappschallenge.org/2023/awards/honorable-mentions/); [Lila team page](https://www.spaceappschallenge.org/2023/find-a-team/lila/)
- Otros Global Nominees 2023 visibles en Managing Fire: 01-Clan (Sakhir, Bahrain) y 0xspaceX (Buraydah, Arabia Saudita). — [2023 Managing Fire – Teams](https://www.spaceappschallenge.org/2023/challenges/managing-fire-increasing-community-based-fire-management-opportunities/?tab=teams)
- **Ningún** Global Winner 2023 provino de Managing Fire (los 10 ganadores fueron de biodiversidad, sonidos del espacio, turismo planetario, Ocean Gardens, moonquakes, exoplanetas, eclipses, DSCOVR y agua). — [2023 Global Winners](https://www.spaceappschallenge.org/2023/awards/global-winners/)
- **PyroFyro (2023, finalista):** "An AI model, paired with real-time sensor data and emergency text messaging" para reducir víctimas y daños por incendios en países con bosques y veranos secos. — [PyroFyro team page](https://www.spaceappschallenge.org/2023/find-a-team/bunjeri/)
- **Rocket Hacks / "Phoenix Eye" (2023, finalista, Sonora, México):** sistema de ML (Convolutional Neural Networks, Keras/TensorFlow) para predecir trayectoria de incendios; alertas vía **LoRaWAN** sin internet para comunidades remotas; web con **mapa 3D** de ubicación actual y trayectoria; prototipo de dispositivo de mano; notebooks de MODIS LST y NDVI con Google Earth Engine/Folium; **FIRMS para datos VIIRS**; también incluyeron business model y paper. Citaron a un ecólogo local diciendo que no usan plataformas de predicción. — [FlameForecast_Project (GitHub)](https://github.com/jbric16/FlameForecast_Project)
- Prensa: estudiantes del Tec de Monterrey campus Sonora Norte llegaron a la final mundial con su app contra incendios forestales. — [Conecta Tec](https://conecta.tec.mx/en/news/sonora-norte/education/nasa-tec-students-go-world-hackathon-app-vs-forest-fires) (solo se pudo leer el título de la nota).
- Las páginas "Project" de equipos 2023 no son públicas hoy: muestran "make sure the url is correct and you are logged in"; solo se ven About/Members. — [Firefly ?tab=project](https://www.spaceappschallenge.org/2023/find-a-team/firefly/?tab=project)

**2024**
- Lista de challenges 2024 (21) sin challenge específico de fuego (más cercanos: Community Mapping, Human Development & the Environment, Agricultural Decision-Making, Tell Us a Climate Story!). — [2024 Challenges](https://www.spaceappschallenge.org/nasa-space-apps-2024/challenges/)
- Ningún proyecto con términos fire/wildfire/burn en las tarjetas de Global Finalists (40) ni Honorable Mentions (19) 2024. El ganador 2024 **Best Use of Data, GaamaRamma** (challenge de agricultura) menciona "forest fires" solo como contexto en su descripción. — [2024 Global Winners](https://www.spaceappschallenge.org/nasa-space-apps-2024/awards/global-winners/); [2024 Global Finalists](https://www.spaceappschallenge.org/nasa-space-apps-2024/awards/global-finalists/)

**2025**
- Lista de challenges 2025 (19) sin challenge de fuego (cercanos: Animation Celebration of Terra Data, Through the Radar Looking Glass (SAR), BloomWatch, Data Pathways to Healthy Cities). — [2025 Challenges](https://www.spaceappschallenge.org/2025/challenges/)
- Ganadores 2025 (de 11.500+ proyectos): Astro Sweepers (Galactic Impact), Gaia+LEO (Global Connection), HerCode Space (Best Use of Storytelling), Photonics Odyssey (Most Inspirational), PureFlow (Best Mission Concept), **QUEÑARIS – Arequipa, Perú (Local Impact; BloomWatch, monitoreo fenológico de bosques de Polylepis)**, Resonant Exoplanets (Best Use of Data), SpaceGenes+ (Best Use of Science), **Twisters – Monterrey, México (Best Use of Technology; "Will It Rain On My Parade?")**, Zumorroda-X (Art & Technology). Ninguno de fuego. — [2025 Global Winners](https://www.spaceappschallenge.org/2025/awards/global-winners/)
- Sin hits de fuego en tarjetas de Global Finalists (45) ni Honorable Mentions (23) 2025. — [2025 Global Finalists](https://www.spaceappschallenge.org/2025/awards/global-finalists/); [2025 Honorable Mentions](https://www.spaceappschallenge.org/2025/awards/honorable-mentions/)

**CONAE**
- CONAE es Space Agency Partner 2026 y "has supported the NASA Space Apps Challenge since 2021"; link: https://www.argentina.gob.ar/ciencia/conae. — [2026 Space Agency Partners](https://www.spaceappschallenge.org/2026/space-agency-partners/)

**Años anteriores (antes de 2023, solo contexto)**
- Hubo challenges de fuego: 2018 "Real-time fire app", 2019 "Spot That Fire V2.0", 2020 "Spot That Fire V3.0" y "Automated Detection of Hazards" (URLs de proyectos en 2018/2019/2020.spaceappschallenge.org). Según resultados de búsqueda, varios equipos 2020 usaron FIRMS como dato central, advirtieron falsos positivos (p. ej., sun glint) y combinaron con APIs de clima, MOPITT o NLP de noticias/tweets. — [Spot That Fire V3.0 – ej. Flameboyant](https://2020.spaceappschallenge.org/challenges/confront/spot-fire-3/teams/flameboyant); [2019 Spot That Fire V2.0 – Rakete](https://2019.spaceappschallenge.org/challenges/living-our-world/spot-fire-v20/teams/rakete/project); [2018 real-time fire app](https://2018.spaceappschallenge.org/challenges/volcanoes-icebergs-and-asteroids-oh-my/real-time-fire-app/teams/voidstarz) (contenido no leído en detalle; resumen proveniente del buscador).

### Inferences
- **Lo que ya se hizo mucho:** mapas de puntos FIRMS en tiempo real; ML para predicción de propagación/riesgo; alertas a comunidades (SMS, LoRa); apps de reporte ciudadano; mezcla con clima/NDVI/LST.
- **Huecos que FireSync puede ocupar (alineados 1:1 con el challenge 2026):**
  1. Armonización explícita y validada MODIS↔VIIRS (p. ej., usar el período de solapamiento 2012–presente para calibrar conteos por celda/mes, mostrar métricas antes/después) — nadie lo hizo en Space Apps según lo encontrado.
  2. **Burning activity calendar** mes×año 2000s–presente con color ramps accesibles (colorblind-safe) — inexistente en proyectos previos encontrados.
  3. Anomalías vs mediana/promedio multianual y "mes actual vs histórico" con señal de significancia.
  4. Exportables (CSV de hotspots + PNG/PDF del calendario) para usuarios operativos.
- Los finalistas 2023 ganaron visibilidad por **impacto local concreto** (Sonora, Nepal, Mendoza) y storytelling con un usuario real (cita de un ecólogo local). FireSync debería anclar la demo en una región y un usuario concreto (p. ej., un brigadista o land manager) — inferencia útil para Impact/Local Impact.
- Ningún proyecto de fuego ganó un Global Award en 2023–2025: el tema no garantiza premio; la diferencia la hacen Validity (ciencia de la armonización) y Presentation.

### Gaps
- No se pudo acceder a las páginas "Project" (descripción, demo, stack) de Firefly, PyroFyro, Lila ni de los Global Nominees 2023 (requieren login o ya no son públicas).
- No se encontró si CONAE autoró algún challenge en 2025 (la lista 2025 no muestra uno de fuego; autoría por agencia no visible en la lista).
- El filtrado de 2024/2025 se hizo por palabras clave en las tarjetas (texto "About the Team"); un proyecto de fuego cuya tarjeta no mencione "fire" podría haberse escapado.
- Global Nominees 2023–2025 (lista grande) no se revisaron exhaustivamente.

## 8. Guía oficial para hacer una buena entrega/demo

### Takeaway
La guía oficial da un **guion exacto para el video de 30 s** y reglas para slides (≤7, inglés, visuales fuertes, mostrar cómo NASA data hace posible la solución). Recomienda asignar un responsable de la demo y contar una historia comprensible para alguien sin contexto técnico.

### Cited Findings
- **Guion de video ≤30 s:** [0:00] presentarse (nombre y equipo); [0:02] qué challenge y por qué lo eligieron; [0:05] nombre del proyecto + tagline; [0:10] describir la idea: cómo funciona, mostrar imágenes/prototipo, experiencia de usuario, y cómo **NASA open data y datos de Space Agency Partners** la hicieron posible; [0:20–0:30] mirar al futuro: qué puede hacer por la gente y el mundo. — [Project Submission Guide](https://www.spaceappschallenge.org/resources/project-submission-guide/)
- **Slides (≤7 incluyendo título e intro):** fuente legible, pocas palabras, visuales fuertes (imagen del proyecto, experiencia de usuario, cómo los datos NASA/agencias lo hacen posible); incluir nombre del equipo, nombres de miembros y challenge elegido. — [Project Submission Guide](https://www.spaceappschallenge.org/resources/project-submission-guide/)
- Consejos: "Plan Ahead" (decidir video vs slides temprano; "What story does my team want to tell?"), "Delegate" (un responsable de la demo), "Visual Storytelling" (comunicar importancia a alguien sin contexto ni background técnico). — [Project Submission Guide](https://www.spaceappschallenge.org/resources/project-submission-guide/)
- "The more information you provide on this page, the better the judges can rate your submission!" — [Project Submission Guide](https://www.spaceappschallenge.org/resources/project-submission-guide/)
- El guide sugiere ver demos de ganadores previos en la sección Demo de sus páginas de proyecto. — [Project Submission Guide](https://www.spaceappschallenge.org/resources/project-submission-guide/)
- El Judging guide pide dar igual peso a Presentation y sumar habilidades de storytelling y diseño al equipo. — [Judging & Awards Guide](https://www.spaceappschallenge.org/resources/judging-awards-guide/)
- Hay un playlist oficial "Navigating the Hackathon" (video) enlazado desde el FAQ. — [Participant FAQs](https://www.spaceappschallenge.org/resources/participant-faqs/)

### Inferences
- **Plan de demo sugerido para FireSync (video 30 s, inglés o subtitulado):** 0–2 s equipo; 2–5 s "MODIS se apaga, VIIRS lo reemplaza: 20 años de fuego que no se pueden comparar"; 5–10 s "FireSync: one fire record, any sensor"; 10–20 s screencast: dibujar AOI → calendario mes×año → anomalía del mes actual vs mediana → descarga CSV; mostrar "NASA FIRMS MODIS + VIIRS"; 20–30 s impacto para brigadas/land managers. Preferir video (muestra la app funcionando) y adjuntar además slides/README técnico en el Final Project link para Validity.
- Checklist de entrega: (1) app desplegada con URL pública (probada en incógnito; opcional FortiGuard); (2) repo público con licencia OSI + README con método de armonización y validación; (3) References completas (FIRMS, librerías, basemaps); (4) sección SI usage + marcas en código/imágenes; (5) sin logos NASA; (6) todo en inglés; (7) submit temprano y re-submit.

### Gaps
- No se encontró un blog oficial 2026 tipo "how to win"; solo los Participant Guides. No se revisaron videos de demos ganadoras (páginas de proyecto no públicas).
