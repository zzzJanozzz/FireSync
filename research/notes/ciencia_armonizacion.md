# Ciencia y métodos publicados para armonizar focos de calor MODIS (1 km) y VIIRS (375 m), con énfasis en CONTEOS y series de anomalías

Notas de investigación para FireSync (NASA Space Apps 2026, reto CONAE "Harmonization of MODIS and VIIRS Hot Spots"). Fecha de corte: 13-nov-2026.
Etiquetas: **[VERIFICADO]** = confirmado en la fuente citada en esta sesión; **[PARCIAL]** = confirmado solo en parte (p. ej. solo el abstract); **[NO VERIFICADO]** = no se encontró la fuente o no se pudo abrir el texto; **[INFERENCIA]** = razonamiento propio a partir de lo citado.
Nota de acceso: MDPI (Remote Sensing), Wiley (JGR) y Medium devolvieron HTTP 403 durante la sesión; para artículos MDPI se usaron los metadatos/abstracts de Crossref y Semantic Scholar. Varios PDF (INPE, CONAE, CEOS, Schroeder 2014) no se pudieron decodificar como texto; para ellos solo hay fragmentos de los resultados de búsqueda.

---

## 1. ¿Cómo se relacionan en la literatura los conteos VIIRS 375 m con los de MODIS 1 km? (cocientes globales, por bioma/región, día/noche, tamaño de fuego, ángulo de escaneo y horario de paso)

### Takeaway
No existe un único cociente "universal". Los estudios publicados dan entre ~3,5× y ~6,5× más detecciones VIIRS 375 m que MODIS según región, bioma, satélite MODIS de referencia (Aqua vs Terra+Aqua) y método. En regiones de fuegos agrícolas o pequeños (Punjab, Amazonia brasileña) el valor típico está en ~4,5–6,5×. El cociente depende mucho del tamaño/intensidad del fuego (MODIS omite fuegos de baja FRP), del ángulo de escaneo (el píxel MODIS crece hasta ~9,7 km² en el borde) y, de forma secundaria, del desfase horario de paso. Por eso un único factor global es una mala aproximación, y conviene calibrar por región, mes o cobertura del suelo.

### Cited Findings
**Cocientes regionales de conteos (VIIRS/MODIS)**
- **Punjab, India (paisaje agrícola)** [VERIFICADO]: VIIRS detectó 4,8× más fuegos que MODIS Aqua+Terra: 87.702 por año (media 2012–2016) frente a 18.270 (media 2003–2016). Respecto de Aqua solo, el cociente es ~6,5× (87.702 vs 13.489). Atención: los periodos de promedio difieren. Ambos sensores cruzan el ecuador ~01:30/13:30, así que los autores descartan el horario de paso como causa principal. — [Vadrevu & Lasko 2018, Remote Sensing 10(7):978, doi:10.3390/rs10070978](https://pmc.ncbi.nlm.nih.gov/articles/PMC6108185/)
- **Pará y Mato Grosso, Brasil** [PARCIAL; abstract vía DOAJ]: la media anual en Pará fue 43.488 focos AQUA (2003–2023) frente a 156.038 S-NPP (2012–2023). En el periodo de solapamiento, S-NPP detectó ~4,5× más focos que AQUA, con "correlación significativa" entre ambas series. Para Mato Grosso se cita un estudio con cociente ~4,7× (media S-NPP 127.992 focos, 2013–2023). — [Acta Amazonica 54(3), oct-2024 (DOAJ)](https://doaj.org/article/94f60fcbf0cd46719e3dba06565655d9); [PDF](https://chs.inpa.gov.br/fasciculos/54-3/PDF/AA-2024-0068.pdf)
- **Noreste de Asia, 2012–2017, MYD14 vs VNP14IMG con observaciones casi simultáneas** [PARCIAL; abstract]: MODIS omitió el 65% de los píxeles de fuego detectados por VIIRS en bosques y el 83% en tierras de baja biomasa (cultivos, pastizales, herbáceas). VIIRS omitió el 35% y el 53% de los píxeles MODIS, respectivamente. La asimetría es mucho mayor en tierras de baja biomasa (fuegos pequeños y frescos). — [Fu et al. 2020, Remote Sensing 12(18):2870, doi:10.3390/rs12182870](https://api.semanticscholar.org/graph/v1/paper/DOI:10.3390/rs12182870?fields=title,authors,abstract,year,venue)
- **Por bioma (muestra de un estudio de datación con Landsat)** [PARCIAL; cocientes derivados por el buscador de una tabla de conteos, no publicados como cocientes por los autores]: ~5,0× en bosques tropicales húmedos, ~4,5× en bosque tropical seco y en boreal, ~3,9× en sabanas/pastizales tropicales, ~3,7× en templado latifoliado y ~3,5× en pastizales templados. El mismo resultado de búsqueda menciona "13 millones más de detecciones VIIRS que MODIS en 2019". — [ISPRS J. Photogramm. Remote Sens. 2024 (Active fire-based dating accuracy…)](https://www.sciencedirect.com/science/article/pii/S0924271624000601)
- **"Fuegos pequeños"** [VERIFICADO]: "VIIRS detects almost four times more small fires than MODIS" (Sect. 3.3.2). Es una afirmación sobre fuegos pequeños, no un cociente total de detecciones. — [Sofiev & Kouznetsov 2026, GMD 19:10123–10142](https://gmd.copernicus.org/articles/19/10123/2026/)

**375 m vs 750 m (VIIRS) y día/noche**
- [VERIFICADO vía abstract en buscador] Frente al producto VIIRS 750 m de referencia, los datos de 375 m aumentaron el número absoluto de píxeles de fuego 3× de día y 25× de noche. El producto 375 m mostró "significantly superior mapping capabilities" respecto de MODIS. — [Schroeder et al. 2014, RSE 143:85–96, doi:10.1016/j.rse.2013.12.008](https://directreadout.sci.gsfc.nasa.gov/publications_documents/Schroeder_et_al_2014b_RSE.pdf)
- [VERIFICADO] Límites de detección de FRP (MODIS C6.1): ~5,7 MW de día y ~3,7 MW de noche para los píxeles más pequeños, frente a ~3,7 MW de día y ~0,7 MW de noche para VIIRS (0,5 MW en el abstract). De noche VIIRS es "about 3× more sensitive than MODIS" para ~1 km². De día el texto lo describe como "about 25% less sensitive", una frase que es internamente inconsistente con los valores de las Conclusiones. — [Sofiev & Kouznetsov 2026](https://gmd.copernicus.org/articles/19/10123/2026/)
- [INFERENCIA] Como la ventaja de sensibilidad de VIIRS es mayor de noche, el cociente VIIRS/MODIS de **conteos nocturnos** debería ser mayor que el diurno. Conviene calibrar día y noche por separado o usar solo pasadas diurnas.

**Tamaño del píxel, ángulo de escaneo y probabilidad de detección**
- [VERIFICADO] El píxel MODIS va de 1 km² en nadir a 9,66 km² en el borde del swath (55°). ~40% del swath tiene píxeles <2 km² y ~20% >6 km². El límite de detección en los píxeles de borde es ~42 MW (día) y ~39 MW (noche) en C6. En VIIRS, la agregación de píxeles limita el crecimiento: los píxeles <0,3 km² cubren ~60% del swath pero aportan ~90% de las detecciones. Probabilidad global de detectar fuegos potentes: ~78% MODIS y ~88% VIIRS; en algunas zonas ecuatoriales cae a <30% (MODIS) y <40% (VIIRS). — [Sofiev & Kouznetsov 2026](https://gmd.copernicus.org/articles/19/10123/2026/)
- [VERIFICADO] FIRMS: el tamaño de 1 km de MODIS vale "only along the nadir" y los píxeles de borde son mayores. VIIRS 375 m agrega 3 píxeles nativos a 1 entre nadir y 31,59°, 2 a 1 entre 31,59° y 44,68°, y 1 a 1 más allá. El swath es de ~2.330 km en MODIS y ~3.040 km en VIIRS. — [NASA FIRMS FAQ](https://www.earthdata.nasa.gov/data/tools/firms/faq)
- [PARCIAL; abstract] En África, MODIS omite muchos fuegos de baja intensidad y subestima la FRP diaria en ≥42,8% respecto de VIIRS. La subestimación depende del tamaño de grilla y del ángulo de visión. Los huecos ecuatoriales entre swaths MODIS subestiman la FRP mensual sumada en 12,5%. Los autores ajustaron modelos de corrección a 7 resoluciones de grilla (0,05°–0,5°). — [Li, Zhang & Kondragunta 2020, Remote Sensing 12(10):1561, doi:10.3390/rs12101561](https://api.semanticscholar.org/graph/v1/paper/DOI:10.3390/rs12101561?fields=title,authors,abstract,year,venue)

**Sudamérica / Argentina**
- [PARCIAL] CONAE distribuye focos de calor para Sudamérica a partir de Aqua, Terra y NOAA-20 (MODIS/VIIRS), según el título y el resumen de búsqueda de su manual de usuario del visor. El PDF no se pudo leer como texto. — [CONAE, Manual de Usuarios del visor de focos (035…e02)](https://catalogos5.conae.gov.ar/catalogofocos/Docs/035_CONAE_AQUA_TERRA_NOAA20_MODIS_VIIRS_FC_VISOR_ManualUsuarios_e02.pdf)
- [PARCIAL] Paraguay, 2007: comparación de tres fuentes MODIS-Aqua (INPE, CONAE, FIRMS). FIRMS dio el mayor número anual de detecciones (24.796), seguido de CONAE. Muestra que incluso con el mismo sensor el procesamiento cambia los conteos. — [Correa et al. 2010, XIV SELPER](https://dataserver-coids.inpe.br/queimadas/queimadas/Publicacoes-Impacto/documentos/2010_Correa_etal_Comparacion_XIV_SELPER.pdf)
- [PARCIAL] Andes de Cusco (Perú): comisión media <1% para MODIS y <0,5% para VIIRS (S-NPP y JPSS-1). MODIS casi siempre pierde los incendios pequeños. Con VIIRS la omisión baja a ~75% para cicatrices de 100–500 ha. — [IGP Perú, "Performance of heat spots… Cusco"](https://cienciaclimatica.igp.gob.pe/interpretaciones/2002658589/descargar-docx)

### Inferences
- [INFERENCIA] Para Argentina no hay un cociente publicado. El rango de la literatura (≈3,5–6,5×) sirve como **prior** de verificación, pero el factor debe estimarse con los propios datos FIRMS del área elegida en el solapamiento 2012–2026. Valores de ~4–5× para Aqua vs S-NPP son plausibles en pastizales, agrícola y delta (Paraná). En bosques andino-patagónicos con incendios grandes de alta FRP el cociente sería menor, porque MODIS sí los detecta.
- [INFERENCIA] El cociente no es constante con la actividad: en meses con pocos fuegos pequeños, MODIS puede dar 0 mientras VIIRS da varios. Un factor multiplicativo único sobrecorrige o subcorrige los extremos. Por eso conviene una relación log-log (potencia) o un mapeo por cuantiles más que una razón lineal.
- [INFERENCIA] Usar solo Aqua (no Terra+Aqua) como "MODIS de referencia" frente a S-NPP o NOAA-20 hace los cocientes más estables, porque comparte la ventana de ~13:30. Lo confirman Vadrevu & Lasko: 4,8× contra Terra+Aqua frente a 6,5× contra Aqua solo.

### Gaps
- No se encontró ningún cociente VIIRS/MODIS publicado para Argentina ni para biomas argentinos (Chaco, Espinal, Delta, Patagonia).
- No se encontró un cociente global estratificado por cobertura del suelo y día/noche en una fuente primaria accesible. Los cocientes por bioma de arriba se derivaron de una tabla de un estudio con otro propósito.
- No se pudo leer el texto completo de Schroeder et al. 2014 para extraer su comparación cuantitativa directa con Aqua-MODIS.

---

## 2. Técnicas prácticas para armonizar CONTEOS y su uso en productos operativos (GFED5/GFED5NRT, GFAS, QFED, FINN v2.5, FireCCI, INPE)

### Takeaway
Ningún producto operativo publica un "factor universal de conteos MODIS→VIIRS". Los sistemas que pasaron de MODIS a VIIRS usan tres patrones, en distintas combinaciones:
- **calibración por estratos** (región × cobertura) contra una referencia, durante el solapamiento (GFED5NRT, QFED 3.3);
- **agregación espacial independiente del sensor**, con clustering de píxeles (FINN v2.5) o grillas (CMG 0,25°);
- **filtros de calidad**: ángulo de escaneo, confianza, tipo de fuego, y ponderación por ángulo.

INPE es el único que publica una serie oficial basada en un **"satélite de referencia" único** (Aqua tarde), sin intercalibración documentada.

### Cited Findings
**(a) Escalado por razón o regresión por estrato durante el solapamiento**
- [VERIFICADO] **GFED5NRT** (Chen et al. 2026, ESSD 18:7535–7555, doi:10.5194/essd-18-7535-2026, publicado el 15-oct-2026) usa conteos diarios VIIRS (SNPP y NOAA-20, calidad científica). Para cada región GFED × tipo de cobertura o quema calcula un **"Effective Fire Area" (EFA)**, el área quemada media por detección, calibrado contra GFED5 (basado en MODIS) en el solapamiento **2012–2022 (132 meses)**. El esquema elegido ("Regftp") admite hasta 224 escalares (14 regiones × 16 tipos). Luego: área quemada = conteo VIIRS × EFA. Skill: Taylor Skill Score espacial global 0,94 (área quemada) y 0,88 (emisiones); temporal global 0,88 (área quemada) y 0,97 (emisiones). Rango regional 0,62–0,98. — [Chen et al. 2026, ESSD](https://essd.copernicus.org/articles/18/7535/2026/)
- [VERIFICADO] GFED5NRT además:
  - aplica una **ponderación por ángulo de escaneo**, con tablas de consulta construidas con detecciones SNPP 2019–2021 por número de muestra (0–6399), día/noche, mes y cobertura dominante en celdas de 0,25°, para eliminar la dependencia angular conservando la FRP total;
  - elimina hotspots que no son vegetación (máscara de celdas de 0,01° con >5 detecciones de tipo ≠ 0 en 2012–2022, más fuentes industriales conocidas);
  - **promedia aritméticamente SNPP y NOAA-20** cuando ambos están disponibles, y si falta uno usa el otro.

  — [Chen et al. 2026](https://essd.copernicus.org/articles/18/7535/2026/)
- [VERIFICADO] **Corrección de la premisa del encargo**: GFED5 (Chen et al. 2023, ESSD 15:5227–5259, doi:10.5194/essd-15-5227-2023) **no** escala VIIRS contra MODIS. Usa solo detecciones activas MODIS, con **confianza ≥30% y ángulo de escaneo <30°** y un ajuste por cos(latitud), para corregir el área quemada de fuegos pequeños. VIIRS aparece solo como trabajo futuro ("understanding the differences between VIIRS and MODIS active fire products" como desafío). Sí trae un precedente metodológico útil: para extender la serie a 1997–2000 ajusta **regresiones lineales forzadas por el origen** entre VIRS/ATSR y GFED5 en el solapamiento (2001–2010 VIRS, 2001–2011 ATSR), las pondera con r² frente a una climatología, y advierte que esos años "not on par" con la era MODIS. — [Chen et al. 2023, ESSD](https://essd.copernicus.org/articles/15/5227/2023/)
- [PARCIAL; fragmentos de búsqueda de diapositivas] **QFED**: la próxima versión (QFED 3.3, "Currently in Progress") pasa a estar **anclada a NOAA-20 VIIRS en lugar de Aqua**, con **factores de escala regionales** para mantener la continuidad con QFED 2.6r1. Un factor de 0,768 (otra diapositiva dice 0,778) reduce la sobreestimación invernal. — [Collow, CEOS AC-VC-22](https://ceos.org/document_management/Virtual_Constellations/AC-VC/Meetings/AC-VC-22/Presentations/AC-VC_5.17_Collow_version1.pdf)
- [VERIFICADO] **CAMS GFAS** incorpora observaciones VIIRS (SNPP, NOAA-20, NOAA-21; el artículo menciona la banda de 750 m) desde el **4-dic-2025**, junto con MODIS. Suma Sentinel-3 para la mañana y planea datos geoestacionarios. No publica factores de armonización. — [CAMS, "Drifting away from MODIS…" (25-feb-2026)](https://atmosphere.copernicus.eu/drifting-away-modis-cams-global-fire-assimilation-system)

**(b) Agregación espacial independiente del sensor**
- [VERIFICADO] **FINN v2.5** (Wiedinmyer et al. 2023, GMD 16:3873–3891, doi:10.5194/gmd-16-3873-2023) tiene dos series: MODIS-only (2002–2019) y MODIS+VIIRS (2012–2019).
  - Cada detección recibe un rectángulo scan × track al 110%. Los rectángulos que se solapan se agrupan como un mismo fuego. El área diaria es la unión espacial, de modo que la identidad del sensor "is not relevant for the determination of the burned area" y la combinación "does not lead to double-counting".
  - Filtros: MODIS con confianza <20% se descarta; VIIRS de baja confianza se descarta; solo type = 0.
  - Resultado: VIIRS "adds approximately 25%" a las emisiones globales.
  - FINN no analiza explícitamente el salto de 2012.

  — [Wiedinmyer et al. 2023, GMD](https://gmd.copernicus.org/articles/16/3873/2023/gmd-16-3873-2023.html)
- [VERIFICADO] Los productos MODIS **CMG** (Climate Modeling Grid) son resúmenes mensuales y de 8 días a **0,25°** de la información de píxeles de fuego, pensados para modelado regional y global. Son la entrada natural "lado MODIS" para comparar en grilla. — [MODIS C6/C6.1 Active Fire User's Guide](https://modis-fire.umd.edu/files/MODIS_C6_C6.1_Fire_User_Guide_1.0.pdf)
- [PARCIAL] Li et al. 2020 construyen modelos de ajuste de FRP MODIS en grillas de 0,05° a 0,5° y muestran que la subestimación depende del tamaño de grilla. Es un precedente de que **agregar en grilla reduce la discrepancia**, y de que esta depende de la resolución elegida. — [Li et al. 2020](https://api.semanticscholar.org/graph/v1/paper/DOI:10.3390/rs12101561?fields=title,authors,abstract,year,venue)

**(c) Emparejar Aqua con SNPP/NOAA-20 (horario similar)**
- [VERIFICADO] Fu et al. 2020 y Vadrevu & Lasko 2018 eligen Aqua-MODIS frente a S-NPP VIIRS precisamente porque cruzan a ~13:30/01:30, lo que permite observaciones casi simultáneas. — [Fu et al. 2020](https://api.semanticscholar.org/graph/v1/paper/DOI:10.3390/rs12182870?fields=title,authors,abstract,year,venue); [Vadrevu & Lasko 2018](https://pmc.ncbi.nlm.nih.gov/articles/PMC6108185/)
- [VERIFICADO] Zheng et al. 2026 fusionan MYD14 (Aqua) y VNP14IMG (SNPP) en 2012–2024. — [Zheng et al. 2026, Remote Sens. 18(10):1650](https://api.crossref.org/works/10.3390/rs18101650)

**(d) Filtrado por ángulo de escaneo / (e) por confianza**
- [VERIFICADO] GFED5 filtra MODIS a ángulo <30° y confianza ≥30%. — [Chen et al. 2023](https://essd.copernicus.org/articles/15/5227/2023/)
- [VERIFICADO] GFED5NRT pondera por ángulo en vez de recortar. — [Chen et al. 2026](https://essd.copernicus.org/articles/18/7535/2026/)
- [VERIFICADO] FINN v2.5 filtra MODIS con confianza <20% y VIIRS "low". — [Wiedinmyer et al. 2023](https://gmd.copernicus.org/articles/16/3873/2023/gmd-16-3873-2023.html)
- [VERIFICADO] FIRMS advierte: "The confidence field should be used with caution". La confianza MODIS va de 0–100% y se mapea a low/nominal/high; VIIRS es categórica (low/nominal/high). — [FIRMS FAQ](https://www.earthdata.nasa.gov/data/tools/firms/faq)

**(f) Producto VIIRS 750 m (M-band) para continuidad con MODIS**
- [VERIFICADO] El algoritmo VIIRS 750 m (VNP14) es una adaptación de MODIS C6 (MOD14/MYD14; Giglio et al. 2016). Usa 6 canales de 750 m y "provides fire data continuity" con el producto MODIS de 1 km. El producto 375 m (VNP14IMG) muestra en general mejor desempeño de detección. — [VNP14 User Guide (LP DAAC)](https://lpdaac.usgs.gov/documents/427/VNP14_User_Guide_V1.pdf); [NASA VIIRS Land, Active Fire](https://viirsland.gsfc.nasa.gov/Products/NASA/FireESDR.html)
- [VERIFICADO] FIRMS compara el producto 375 m con el de 750 m: el de 375 m "will tend to detect more fire pixels". — [FIRMS FAQ](https://www.earthdata.nasa.gov/data/tools/firms/faq)

**(g) Mapeo por cuantiles / (h) machine learning**
- [VERIFICADO] Zheng et al. 2026 usan un modelo de corrección de FRP MODIS dependiente del ángulo cenital de visión, calibrado con VIIRS corregido por nubes, y luego una fusión priorizada por calidad, sin ML profundo. — [Zheng et al. 2026 (Semantic Scholar)](https://api.semanticscholar.org/graph/v1/paper/DOI:10.3390/rs18101650?fields=title,authors,abstract,year,venue,publicationDate)
- No se encontraron publicaciones revisadas por pares que apliquen quantile mapping o CDF matching a **conteos** de focos MODIS/VIIRS. Ver Gaps.

**Otros antecedentes y proyectos**
- [PARCIAL] Diapositivas del MODIS Science Team (2022) describen un proyecto NASA para derivar una serie MODIS/VIIRS armonizada de 25 años, "unbiased" y calibrada contra área quemada de referencia de Landsat/Sentinel-2. Es planificación, no resultados. — [Boschetti, MODIS ST abr-2022](https://modis.gsfc.nasa.gov/sci_team/meetings/202204/presentations/session1/boschetti.pdf)
- [PARCIAL] El producto VIIRS de área quemada VNP64A1 adapta el algoritmo MODIS MCD64A1 y se considera apto para continuar el registro MODIS. Esto es área quemada, no conteos. — [RSE 2025, VNP64A1](https://www.sciencedirect.com/science/article/pii/S0034425725004109)
- [PARCIAL] FireCCI tiene un producto global (FireCCIS311) de Sentinel-3 SYN + detecciones VIIRS. — [Lizundia-Loiola et al. (ResearchGate)](https://www.researchgate.net/publication/364242090_Global_burned_area_mapping_from_Sentinel-3_Synergy_and_VIIRS_active_fires); [ESA Fire CCI data](https://climate.esa.int/en/projects/fire/data/)
- [VERIFICADO; no revisado por pares] Al menos dos repositorios de equipos de Space Apps 2026 para este mismo reto usan **OLS de MODIS sobre VIIRS** en el solapamiento. Uno reporta conteos VIIRS ~2,2–4,9× MODIS. Sirve para conocer a la "competencia", no como evidencia. — [firelens (team scikit)](https://github.com/shahmirkhan106/firelens); [FireChronicle](https://github.com/bhavishyaone1/FireChronicle)

**INPE "satélite de referência"**
- [PARCIAL; fragmentos de búsqueda] Aviso de INPE del 24-ago-2011: "A partir de 22/Agosto/2011, o satélite de referência deixou de ser o NOAA-15 (sensor AVHRR) e passou a ser o AQUA (sensor MODIS)", por ruido y degradación del NOAA-15. El mismo aviso indica que la serie de referencia usa NOAA-12 entre el 1-jul-1998 y el 9-ago-2007, y AQUA desde el 10-ago-2007 en los informes automáticos. — [INPE, Aviso 20110824](https://dataserver-coids.inpe.br/queimadas/queimadas/Publicacoes-Impacto/documentos/20110824_Aviso_Ref_Mudoup_Aqua.pdf). Otro material del Programa Queimadas dice que AQUA fue "adotado como satélite de referência desde 2002". Las fechas **entran en conflicto** entre fuentes. — [material Programa Queimadas (fragmento de búsqueda)](https://inpe-cap-378.netlify.app/_static/2021/mateus/programa_queimadas.pdf)
- [VERIFICADO vía reportaje] INPE usa para su serie histórica solo una de las dos pasadas diarias de Aqua, la de la tarde (~14h hora de Brasilia). El satélite de referencia sirve solo para comparaciones temporales y no es una medida absoluta. Un instrumento VIIRS (S-NPP/NOAA-20) "detecta 10 vezes mais focos" que MODIS, según el reportaje; esa cifra es mayor que la de los estudios revisados por pares. — [Revista Pesquisa FAPESP 2020](https://revistapesquisa.fapesp.br/en/2020/02/04/how-to-monitor-forest-fires/); [FAPESP 2019 (pt)](https://revistapesquisa.fapesp.br/2019/10/07/como-monitorar-o-fogo/)
- [PARCIAL] Hubo un episodio de problemas técnicos en el satélite de referencia AQUA, con publicación suspendida por NASA. INPE pasó entonces a recibir imágenes por sus antenas de Cuiabá y Cachoeira Paulista, y avisó que las estadísticas podían quedar perjudicadas. La fecha no aparece en el fragmento. — [Greenpeace Brasil](https://www.greenpeace.org/brasil/press/devido-a-problemas-tecnicos-no-satelite-referencia-estatisticas-de-focos-de-calor-podem-estar-prejudicadas/)

### Inferences
**[INFERENCIA] Tres enfoques recomendables para el informe (de menor a mayor complejidad):**

1. **"Satélite de referência" + calibración por ratio o potencia en el solapamiento (estilo INPE + QFED/GFED5NRT).**
   - Serie base: Aqua-MODIS (2002–hoy), complementada con Terra 2000–2002.
   - Para cada área y mes, ajustar en 2012–2024 una relación `log(VIIRS+1) = a + b·log(MODIS+1)`, o un ratio mediano por mes calendario, entre conteos S-NPP (y luego NOAA-20) y Aqua.
   - Usar esa relación para expresar todo en "equivalente-VIIRS" (o al revés) y continuar con NOAA-20/21 cuando MODIS termine.
   - Pros: simple, interpretable, factible en horas; reproduce el patrón de QFED 3.3 (anclar a NOAA-20) y de GFED5NRT (escalares por estrato).
   - Contras: el ratio varía con la actividad (no linealidad), con el bioma y por la deriva de Aqua desde ~2022; con áreas pequeñas hay mucho ruido.
2. **Agregación espacial "fire-pixel-days" / celdas únicas.**
   - Contar celdas (p. ej. 0,1° o H3 res. 6–7) con ≥1 detección por día, por sensor. Opcionalmente, solo píxeles con ángulo <30° (GFED5) o ponderados por ángulo (GFED5NRT), y filtrando type = 0 y confianza baja (FINN).
   - Pros: neutraliza buena parte de la diferencia de resolución, porque varias detecciones VIIRS dentro de un mismo píxel o celda MODIS cuentan una vez (equivale a FINN, que es agnóstico al sensor). Es robusto a duplicados.
   - Contras: sigue habiendo sesgo por fuegos pequeños que MODIS no ve. El resultado depende de la resolución de celda (Li et al. 2020 muestran dependencia del tamaño de grilla). Hay que elegir y documentar la celda.
3. **Corrección por estrato + fusión (estilo Zheng et al. 2026 / GFED5NRT, versión simplificada).**
   - Estratificar por cobertura del suelo (p. ej. MCD12Q1) × día/noche × mes, calibrar en el solapamiento y fusionar con prioridad VIIRS donde exista.
   - Pros: es lo más cercano al estado del arte.
   - Contras: no es factible completo en 2 días; solo es aceptable una versión con pocos estratos.

**[INFERENCIA] MVP en 2 días**
- Enfoque 2 (celdas-día a 0,1° o H3) más el enfoque 1 (ratio mediano por mes calendario, o regresión log-log por área, en 2012–2024, Aqua vs S-NPP/NOAA-20, solo pasadas diurnas y nocturnas por separado).
- Mostrar ambas series y la banda de incertidumbre del ajuste. Marcar 2012 (inicio de S-NPP), 2018 (NOAA-20), 2022+ (deriva de Aqua) y 2-nov-2026 (fin de S-NPP).
- Usar datos FIRMS Standard/Archive (SP), no NRT, para la parte histórica: FIRMS indica que el estándar es mejor para tendencias.

### Gaps
- No se encontró documentación de que INPE haya cambiado oficialmente el satélite de referencia a VIIRS/NOAA-20, ni de que lo esté discutiendo formalmente. La búsqueda no devolvió ningún comunicado; hay que revisar directamente el FAQ de TerraBrasilis/BDQueimadas.
- No se pudo leer el detalle de cómo QFED calcula sus factores regionales (PDF ilegible); solo fragmentos.
- No se encontraron artículos revisados por pares sobre quantile mapping, CDF matching o ML aplicados específicamente a **conteos** de focos MODIS→VIIRS.
- GFAS: no se encontraron los factores de armonización FRP VIIRS↔MODIS que usa.
- MapBiomas Fogo y Global Fire Atlas trabajan con área quemada (Landsat / MCD64A1) y no armonizan conteos de focos. Esto se dice por conocimiento previo, no verificado en esta sesión.

---

## 3. Efectos de horario de paso y ciclo diurno; deriva de Terra/Aqua y fin de misiones

### Takeaway
Aqua (~13:30) y S-NPP/NOAA-20/21 (~13:30 nominal, con desfases de decenas de minutos) son el par más comparable. Terra (~10:30) observa una fase distinta del ciclo diurno, con menos actividad. Las órbitas de Terra y Aqua derivan desde 2020–2022: Terra hacia la mañana y Aqua hacia la tarde. Esto altera los conteos MODIS recientes y llevó a GFED5 a cortar en 2022. S-NPP dejó de entregar datos el 2-nov-2026, y NASA prevé apagar MODIS a fines de 2026 o en 2027.

### Cited Findings
- [VERIFICADO] Horarios nominales según FIRMS:
  - Terra ~10:30 / 22:30
  - Aqua ~13:30 / 01:30
  - S-NPP 13:30 / 01:30
  - NOAA-20/21 ~12:40 / 00:40, según la lectura de la FAQ en esta sesión; la FAQ también dice que NOAA-21 pasa "about 50 minutes ahead of Suomi NPP".

  — [FIRMS FAQ](https://www.earthdata.nasa.gov/data/tools/firms/faq)
- [VERIFICADO] Producción y entrega de nuevos datos S-NPP "ceased at 15:40 UTC on November 2, 2026". Hay datos S-NPP VIIRS disponibles del 20-ene-2012 al 2-nov-2026. — [FIRMS FAQ](https://www.earthdata.nasa.gov/data/tools/firms/faq)
- [VERIFICADO] Terra y Aqua deberían comenzar a apagarse "in late 2026/early 2027", y NASA anima a migrar a productos VIIRS (alerta del 2-may-2025). — [Earthdata, Transition from MODIS to VIIRS](https://www.earthdata.nasa.gov/data/alerts-outages/transition-from-modis-viirs)
- [VERIFICADO] Según CAMS, NASA planea terminar la colección de Terra MODIS en ene-2027 y la de Aqua MODIS hacia sep-2027. — [CAMS feb-2026](https://atmosphere.copernicus.eu/drifting-away-modis-cams-global-fire-assimilation-system)
- [PARCIAL] Una página de NASA proyecta el fin de la ciencia en Terra en feb-2027, Aqua en sep-2027 y Aura en ago-2028, como proyecciones. — [NASA Science, "Terra: the end of an era"](https://science.nasa.gov/science-research/earth-science/terra-the-end-of-an-era)
- [VERIFICADO] Maniobras finales: inclinación de Terra en feb-2020 y de Aqua en mar-2021. La pérdida de la órbita matutina afecta el estudio del ciclo diurno de fuego. La detección de fuego en LANCE NRT ya se transicionó de MODIS a VIIRS. — [Earthdata feature, 18-may-2022 (act. 12-may-2025)](https://earthdata.nasa.gov/news/feature-articles/viirs-instruments-become-more-essential-terra-aqua-drift-traditional-orbits)
- [PARCIAL; fragmentos de búsqueda] Datos de deriva:
  - Último maneuver de compensación de arrastre de Terra en jul-2022; Terra se bajó ~5 km en oct-2022.
  - Terra deriva hacia horarios más tempranos; en terra.nasa.gov aparecen horas medias locales de 9:59 y 9:26 AM en distintas secciones.
  - Para Aqua, un documento proyecta que la hora media local "reaching 3:50 PM around August 2026". La fuente exacta no quedó identificada entre los resultados (NTRS/SPIE o MODIS Land News).
  - Giglio (LANCE UWG, may-2025) dice que el impacto de la deriva en los productos MODIS de fuego está "under active investigation" y menciona un cambio de píxel de "1 km → ~970 m along-scan (spring 2025)".

  — [terra.nasa.gov](https://terra.nasa.gov/); [Twedt et al. SPIE 2023 (NTRS)](https://ntrs.nasa.gov/api/citations/20240001409/downloads/2023_SPIE_Twedt_MODIS_EV_orbit_drift_manuscript_v4.pdf); [Giglio, LANCE UWG may-2025](https://landweb.modaps.eosdis.nasa.gov/data/filePost/LANCE_UWG_Orbit_Drift_Giglio_202505.pdf)
- [VERIFICADO] GFED5 termina en 2022 porque "orbital drift-induced changes surpassed the thresholds defined for high-quality science products". Desde 2023, GFED5NRT continúa solo con VIIRS. — [Chen et al. 2026, ESSD](https://essd.copernicus.org/articles/18/7535/2026/)
- [VERIFICADO] En 2020, Aqua registró la mayoría de los fuegos hacia las 13:00–14:00 locales, frente a 12:00–13:30 de S-NPP. Los tiempos de retrieval "differ by 1–2 h" según el caso. El efecto de esa diferencia sobre la FRP queda "within 0%–50%" según los tiempos reales. Se aplica un factor de corrección diurna de ~1,2 a VIIRS. — [Sofiev & Kouznetsov 2026](https://gmd.copernicus.org/articles/19/10123/2026/)
- [VERIFICADO] Ciclo diurno: con 3 años de Terra y Aqua MODIS (C4 CMG), Giglio et al. 2006 (JGR) muestran un ciclo diurno fuerte en latitudes tropicales y subtropicales. Ambos sensores coinciden en el mes pico y la duración de la temporada en la mayoría de las zonas. — [Giglio, Csiszar & Justice 2006, JGR (PDF en INPE)](https://dataserver-coids.inpe.br/queimadas/queimadas/Publicacoes-Impacto/material3os/2006_Giglio_etal_GlobalDistribuiton_JGR_DE3os.pdf)
- [PARCIAL] Con TRMM-VIRS + Terra MODIS, el pico local de quema está entre 13:00 y 18:30, más temprano en regiones boscosas, y los periodos de quema más cortos se asocian a más cobertura arbórea. — [Giglio 2007, RSE (ResearchGate)](https://www.researchgate.net/publication/222248189_Characterization_of_the_tropical_diurnal_fire_cycle_using_VIRS_and_MODIS_observations)
- [VERIFICADO] INPE elige la pasada de la tarde de Aqua (~14h Brasilia) por ser el horario de mayor actividad. — [FAPESP 2020](https://revistapesquisa.fapesp.br/en/2020/02/04/how-to-monitor-forest-fires/)

### Inferences
- [INFERENCIA] Para la serie armonizada:
  - **excluir Terra** del ajuste MODIS↔VIIRS, o tratarlo como serie aparte, porque su horario (~10:30, cada vez más temprano) muestrea menos actividad;
  - usar **Aqua 2002–2021/2022** como núcleo MODIS;
  - marcar 2022–2026 como periodo con **deriva de Aqua**: pasa más tarde, más cerca del pico diurno, y puede inflar los conteos MODIS relativos a VIIRS. Conviene calibrar el ratio con 2012–2021 y validar en 2022–2024 para ver si cambia.
- [INFERENCIA] Con el fin de S-NPP (2-nov-2026), la continuidad VIIRS debe apoyarse en NOAA-20/NOAA-21. Conviene calibrar NOAA-20 vs S-NPP (solapamiento 2018–2026) para que la serie "equivalente-VIIRS" no salte, de forma análoga al promedio SNPP/NOAA-20 de GFED5NRT.
- [INFERENCIA] Contar "día" y "noche" por separado y no sumar distintas cantidades de pasadas por día entre sensores. Más satélites VIIRS activos implican más oportunidades de detección (S-NPP + NOAA-20 + NOAA-21 frente a un solo Aqua), y ese efecto es independiente de la resolución.

### Gaps
- No se encontró ninguna cuantificación publicada del efecto de la deriva de Terra/Aqua sobre los **conteos** de focos (ni % de cambio por año).
- Los horarios NOAA-20/21 de FIRMS (~12:40) no se pudieron confrontar con otra fuente en esta sesión. JPSS tiene cruce nominal ~13:30 con desfases de media órbita entre satélites; esto viene de conocimiento previo, no verificado aquí.
- No se encontraron cocientes Terra/Aqua de conteos por bioma.

---

## 4. Verificación de las afirmaciones (1)–(7) del encargo

### Takeaway
(1) Existe, con matices importantes. (2) La cita es correcta y el "3,82×" está confirmado, pero el resto de las cifras no se pudo verificar (texto completo inaccesible). (3) Es parcial ("<50 min" sí; "1 de cada 8 días" no). (4) No se encontró la fuente de "4,1/33,6 MW". (5) Verificada. (6) Verificada con matiz. (7) Verificada.

### Cited Findings
- **(1) GMD 2026, "38% → ~20%"** [VERIFICADO con corrección]:
  - Cita: Sofiev, M. & Kouznetsov, R., "Observation operator and detection limits for MODIS and VIIRS Fire Radiative Power products", *Geosci. Model Dev.* 19, 10123–10142, 2026, doi:10.5194/gmd-19-10123-2026. Recibido 13-ene-2026, aceptado 29-sep-2026, publicado 26-oct-2026.
  - Cifras (2020, Aqua-MODIS vs S-NPP-VIIRS, mismos gránulos): FRP VIIRS bruta ~38% mayor (177 vs 128 TW). Tras aplicar simétricamente los **observation operators (OOp)**, 106 TW (VIIRS) vs 88 TW (MODIS), ~20% mayor.
  - **Corrección**: el ~20% es la diferencia residual *después* de aplicar los OOp, y los autores **la atribuyen** al horario de paso ("This 20% difference originates from different overpass times"). No es "la diferencia tras corregir por horario". La corrección horaria es un paso aparte (factor ~1,2 aplicado a VIIRS, pie de la Fig. 11). En la Sect. 5.4 el residual figura como 23%.
  - Método: el OOp a nivel de píxel usa una curva logística de detección cuyo punto medio es **lineal en el área del píxel** (correlación >0,99). El OOp en grilla añade un término de oscurecimiento por nubes (fracción de píxeles válidos) y atenuación por aerosol/humo exp(−τ₄). Los autores dicen que es la primera aplicación de un OOp a la FRP.
  - El paper **no** recomienda explícitamente cómo fusionar series ni da cocientes totales de conteos.

  — [GMD](https://gmd.copernicus.org/articles/19/10123/2026/)
- **(2) Zheng et al. 2026** [PARCIAL]:
  - Cita **correcta**: Zheng, Y., Ding, K., Xue, L., Wang, Z., Jiao, G., Zhu, Y., Zhang, J., Ren, Q., "Fire Radiative Power Correction and Spatiotemporal Fusion Based on MYD14 and VNP14IMG", *Remote Sensing* 18(10):1650, publicado el 20-may-2026, doi:10.3390/rs18101650, CC BY. Afiliación: School of Atmospheric Sciences, **Nanjing University** (State Key Lab. of Severe Weather Meteorological Science and Technology, entre otras).
  - Confirmado (abstract): marco de **corrección antes de la fusión**; datos 2012–2024; corrección de FRP MODIS dependiente del ángulo cenital, calibrada contra VIIRS corregido por nubes; producto diario fusionado a escala de huella MODIS con **~3,82× más píxeles de fuego** que el MODIS original; validación con Landsat con mejor detección de fuegos de baja intensidad y baja comisión.
  - Un fragmento de búsqueda menciona además corrección de detecciones duplicadas, emparejamiento MODIS–VIIRS a escala de huella, corrección de nubes VIIRS por área, fusión priorizada por calidad y R² ≥ 98,18% del modelo de corrección.
  - **No verificado** (MDPI 403): RMSE 112,97 → 93,43 MW; ventana ≤5 min; probabilidades de detección para FRP <30 MW de 26,76% (MODIS), 44,25% (VIIRS) y 54,44% (fusionado); que los coeficientes solo valgan para Aqua–SNPP. El diseño (MYD14 + VNP14IMG) hace plausible esto último, pero es [INFERENCIA].

  — [Crossref](https://api.crossref.org/works/10.3390/rs18101650); [Semantic Scholar](https://api.semanticscholar.org/graph/v1/paper/DOI:10.3390/rs18101650?fields=title,authors,abstract,year,venue,publicationDate); [DOI](https://doi.org/10.3390/rs18101650)
- **(3) Desfase entre pasos "segundos a ~50 min; simultáneas ~1 de cada 8 días"** [PARCIAL]:
  - Un fragmento de búsqueda (de un artículo MDPI de fuegos, probablemente Li et al. 2020 o Fu et al. 2020) dice que S-NPP y Aqua observan la misma zona "with an overpassing time difference of fewer than 50 min". — [Li et al. 2020 (MDPI)](https://www.mdpi.com/2072-4292/12/10/1561/htm)
  - Sofiev & Kouznetsov dan "1–2 h" en general. — [GMD 2026](https://gmd.copernicus.org/articles/19/10123/2026/)
  - Un documento canadiense indica que el paso real puede variar ~±90 min respecto del típico. — [NRCan Fo4-256-2025](https://publications.gc.ca/collections/collection_2026/rncan-nrcan/Fo4-256-2025-eng.pdf)
  - **"~1 día de cada 8" no se encontró en ninguna fuente.**
- **(4) "MODIS 4,1 MW en nadir → >33,6 MW en el borde; VIIRS ~1,4–2,2 MW"** [NO VERIFICADO]: ninguna búsqueda encontró esas cifras. Los valores verificados más cercanos son de Sofiev & Kouznetsov 2026: MODIS 3,7 MW (noche, nadir) a ~40–42 MW (día, borde); VIIRS 3,7 MW (día) y 0,5–0,7 MW (noche) en el centro del swath. Las cifras del encargo podrían venir de Zheng et al. 2026 o de Li et al. 2020, pero no se pudo comprobar. — [GMD 2026](https://gmd.copernicus.org/articles/19/10123/2026/)
- **(5) MODIS C6.1: 5,7 MW día / 3,7 MW noche para píxeles pequeños cerca del nadir** [VERIFICADO]: Conclusiones de Sofiev & Kouznetsov 2026, "5.7 and 3.7 MW for day- and night-time overpasses for the smallest-size pixels in the middle of the swath". Los autores dicen que son ~la mitad que en C5. — [GMD 2026](https://gmd.copernicus.org/articles/19/10123/2026/)
- **(6) "Para fuegos detectados por ambos, FRP por píxel VIIRS menor pero total mayor"** [VERIFICADO con matiz]:
  - Fu et al. 2020: para fuegos co-detectados, la FRP **total** fue menor con VIIRS que con MODIS. La FRP mensual total de MODIS fue mucho menor que la de VIIRS, sobre todo por omisiones de MODIS. Es decir: "total mayor" vale para **todos** los fuegos, no para los co-detectados. — [Fu et al. 2020](https://api.semanticscholar.org/graph/v1/paper/DOI:10.3390/rs12182870?fields=title,authors,abstract,year,venue)
  - Vadrevu & Lasko 2018: FRP media mensual por píxel 16,10 MW (Aqua) vs 5,25 MW (VIIRS); FRP anual sumada VIIRS 2,25× MODIS (2,5× en el abstract). — [Vadrevu & Lasko 2018](https://pmc.ncbi.nlm.nih.gov/articles/PMC6108185/)
- **(7) "En África MODIS omite muchos fuegos de baja intensidad y subestima la FRP diaria en ≥42,8% vs VIIRS"** [VERIFICADO; abstract]: Li, F., Zhang, X., Kondragunta, S. (2020), Remote Sensing 12(10):1561, doi:10.3390/rs12101561. Además: huecos ecuatoriales de swath → −12,5% en la FRP mensual; modelos de ajuste a 0,05°–0,5°. — [Semantic Scholar](https://api.semanticscholar.org/graph/v1/paper/DOI:10.3390/rs12101561?fields=title,authors,abstract,year,venue)

### Inferences
- [INFERENCIA] Para el informe:
  - citar (1) como "≈38% más FRP bruta en VIIRS; ≈20% tras el observation operator, residual atribuido al horario";
  - citar (2) solo con lo confirmado (3,82×, corrección antes de fusión, 2012–2024, Aqua+SNPP) hasta que alguien con acceso a MDPI confirme RMSE y probabilidades de detección;
  - no usar (4) sin fuente.

### Gaps
- Texto completo de Zheng et al. 2026 (MDPI bloqueado) para RMSE, ventana temporal y probabilidades de detección.
- Fuente de "~1 día de cada 8" y de "4,1/33,6 MW; 1,4–2,2 MW".

---

## 5. Otros artículos clave (fichas breves)

### Takeaway
La base fundacional es: Schroeder et al. 2014 (algoritmo 375 m), Giglio et al. 2016 (MODIS C6), Li et al. 2018 (FRP VIIRS 750 m vs MODIS), Fu et al. 2020, Li et al. 2020 (África), Vadrevu & Lasko 2018 y Zhang, Wooster & Xu 2017. Lo más reciente y relevante para continuidad (2023–2026) es FINN v2.5 (2023), Sofiev & Kouznetsov (GMD 2026), Zheng et al. (RS 2026), GFED5NRT (ESSD 2026) y la transición de GFAS/QFED a VIIRS.

### Cited Findings
- **Schroeder, Oliva, Giglio & Csiszar 2014**, RSE 143:85–96, doi:10.1016/j.rse.2013.12.008. Algoritmo contextual 375 m derivado de MODIS; 3× (día) y 25× (noche) más píxeles que VIIRS 750 m; mejor delimitación de perímetros que MODIS. — [PDF NASA](https://directreadout.sci.gsfc.nasa.gov/publications_documents/Schroeder_et_al_2014b_RSE.pdf)
- **Oliva & Schroeder 2015**, RSE 160:144–155, doi:10.1016/j.rse.2015.01.010. Agregan detecciones VIIRS 375 m consecutivas en área quemada en 10 zonas, validando con Landsat-8. Mayor exactitud en bosques con fuegos grandes y largos; más omisión y comisión en pastizales, sabanas y agrícola. — [NASA MODIS ST abstract](https://modis.gsfc.nasa.gov/sci_team/pubs/abstract_new.php?id=19541)
- **Li, F., Zhang, X., Kondragunta, S., Csiszar, I. 2018**, "Comparison of Fire Radiative Power Estimates From VIIRS and MODIS Observations", JGR-Atmospheres, doi:10.1029/2017JD027823. Título y DOI confirmados; cifras no accesibles (Wiley 403). — [Wiley](https://agupubs.onlinelibrary.wiley.com/doi/full/10.1029/2017jd027823)
- **Li, Zhang & Kondragunta 2020** (África): ver sección 4, (7). — [doi:10.3390/rs12101561](https://api.semanticscholar.org/graph/v1/paper/DOI:10.3390/rs12101561?fields=title,authors,abstract,year,venue)
- **Fu, Li, Wang, Bergeron, Valeria, Chavardès, Wang & Hu 2020** (NE Asia): ver secciones 1 y 4. — [doi:10.3390/rs12182870](https://api.semanticscholar.org/graph/v1/paper/DOI:10.3390/rs12182870?fields=title,authors,abstract,year,venue)
- **Vadrevu & Lasko 2018** (Punjab): ver sección 1. Además, TPM: VIIRS 93,98–111,72 Gg vs MODIS 42,59–58,75 Gg vs censo agrícola 88,19–91,19 Gg. El MODIS subestima frente al inventario de abajo hacia arriba, mientras que VIIRS queda más cerca. — [PMC](https://pmc.ncbi.nlm.nih.gov/articles/PMC6108185/)
- **Zhang, T., Wooster, M.J., Xu, W. 2017**, RSE 198:407–424. Uso sinérgico de VIIRS I-band (375 m) y M-band (750 m): la I-band detecta fuegos de ≤1 MW, pero satura en fuegos intensos y la M-band aporta su FRP. En el este de China, la FRP regional sumada es hasta ~4× la de MODIS. DOI no verificado en esta sesión. — [NASA MODIS ST abstract](https://modarch.gsfc.nasa.gov/sci_team/pubs/abstract_new.php?id=24455)
- **Wooster et al. 2021**, "Satellite remote sensing of active fires: History and current status, applications and future requirements", RSE 267:112694, doi:10.1016/j.rse.2021.112694. Revisión general; no se extrajeron cifras de conteos. — [NOAA repository](https://repository.library.noaa.gov/view/noaa/67728)
- **Wiedinmyer et al. 2023** (FINN v2.5): ver sección 2. — [GMD](https://gmd.copernicus.org/articles/16/3873/2023/gmd-16-3873-2023.html)
- **Chen et al. 2023** (GFED5) y **Chen et al. 2026** (GFED5NRT): ver sección 2. — [ESSD 2023](https://essd.copernicus.org/articles/15/5227/2023/); [ESSD 2026](https://essd.copernicus.org/articles/18/7535/2026/)
- **Sofiev & Kouznetsov 2026** (GMD) y **Zheng et al. 2026** (RS): ver sección 4. — [GMD](https://gmd.copernicus.org/articles/19/10123/2026/); [doi:10.3390/rs18101650](https://doi.org/10.3390/rs18101650)
- **Acta Amazonica 2024** (Pará, 4,5×): ver sección 1. — [DOAJ](https://doaj.org/article/94f60fcbf0cd46719e3dba06565655d9)

### Inferences
- [INFERENCIA] La literatura 2024–2026 sobre continuidad MODIS–VIIRS se concentra en **FRP y emisiones** (GFAS, QFED, GFED5NRT, Sofiev & Kouznetsov, Zheng) y en **área quemada** (VNP64A1). La armonización explícita de **conteos** es un hueco, y eso puede presentarse como la contribución del equipo.

### Gaps
- Freeborn et al. 2014: no se verificó en esta sesión. De memoria es un estudio sobre la incertidumbre de la FRP MODIS con observaciones Terra/Aqua casi simultáneas, en GRL, pero no se confirmó. No se encontró un "Freeborn 2014 MODIS–VIIRS cross-sensor"; posiblemente la referencia del encargo esté equivocada.
- Giglio, Schroeder & Justice 2016 (MODIS C6, RSE): mencionado como base del algoritmo VNP14, pero no se extrajeron cifras.

---

## 6. Estadística de anomalías y "calendario de quema": cómo lo hacen los sistemas operativos

### Takeaway
Los sistemas operativos usan comparaciones simples y transparentes:
- INPE: mínimo, media y máximo mensual sobre 1998–año anterior, y una "climatología" como media mensual.
- EFFIS: acumulado semanal frente a la media 2006–año anterior.
- GFW: alertas VIIRS de la semana o periodo frente a las mismas semanas de años previos desde 2012.
- GWIS: anomalía en desvíos estándar respecto de la media histórica (desde 2002).

Ninguno documenta públicamente, en las fuentes encontradas, el uso de estadística robusta (mediana/MAD) ni transformaciones log, aunque son recomendables para conteos sesgados y áreas pequeñas.

### Cited Findings
- [PARCIAL] **INPE / CPTEC**: una nota técnica de 2022 compara "as quantidades totais de focos no Brasil… mensalmente com valores históricos de mínimo, média e máximo do período 1998–2021", y define la "climatologia" como la media mensual 2003–2021. — [CPTEC/INPE nota técnica 2022](https://sftp.cptec.inpe.br/clima/nota_tecnica/2022/casa-civil-2022.pdf). Los boletines Infoqueima comparan el mes con la media de 1998 hasta el año anterior (p. ej., ago-2018 vs 1998–2017). — [Infoqueima ago-2018](https://dataserver-coids.inpe.br/queimadas/queimadas/Infoqueima/2018/2018_08_infoqueima.pdf)
- [PARCIAL] **GFW**: compara las alertas VIIRS de una semana con la misma semana de años previos ("high compared to the same week in previous years"). Los usuarios pueden elegir rangos de 3 meses desde 2012. Una capa "significant fires" compara estadísticamente con el promedio histórico. Una descripción de GFW Fires (Blue Raster) dice que comparaba la semana actual con la misma semana de los 16 años previos (datos MODIS). — [GFW blog, wildfire trends](https://globalforestwatch.org/blog/fires/wildfire-trends-gfw-fire-data); [GFW blog, local context](https://blog.globalforestwatch.org/fires/placing-global-wildfires-into-local-context); [WRI 2019](https://www.wri.org/insights/what-can-global-forest-watch-tell-us-about-fires-brazil); [Blue Raster](https://blueraster.com/stories/global-forest-watch-fires/)
- [PARCIAL] **GWIS**: el Country Profile cubre 2002–2024 (número de fuegos, área quemada, estacionalidad, emisiones). Un material de entrenamiento dice que la anomalía es "standard deviation from the historical mean". Un dataset en Zenodo describe anomalías relativas y estandarizadas desde 2002. GWIS usa detecciones FIRMS (MODIS y VIIRS) y clustering espacio-temporal de anomalías térmicas en su visor. — [Uni Bonn, GWIS module](https://www.zfl.uni-bonn.de/resources-1/training-module-handbook-contents/fire-module/introduction-to-the-gwis-1); [Zenodo 15525674](https://zenodo.org/records/15525674); [GWIS active fire detection](https://gwis.jrc.ec.europa.eu/about-gwis/technical-background/active-fire-detection)
- [PARCIAL] **EFFIS**: las curvas estacionales comparan el acumulado del año con la media multianual: 2006–2024 / 2006–2025 en versiones recientes y 2008–2017 en una guía antigua; la página de JRC habla de "average of the last 14 years". El "número de fuegos" de EFFIS son áreas quemadas cartografiadas (MODIS 250 m / Sentinel-2), no focos. — [EFFIS seasonal trend 2026](https://api2.effis.emergency.copernicus.eu/api/effis/seasonaltrend/pdf/EU/2026/CO2); [EFFIS user guide](https://effis.jrc.ec.europa.eu/effis/reports-and-publications/effis-related-publications/effis-userguide-23.pdf); [JRC current situation](https://joint-research-centre.ec.europa.eu/projects-and-activities/natural-and-man-made-hazards/fires/current-wildfire-situation-europe_en)
- [VERIFICADO] Para tendencias y comparaciones regionales, FIRMS recomienda los datos Standard (SP/archivo), "essential for analyses of fire occurrence, temporal trends, and regional comparisons", y no los NRT. — [FIRMS FAQ](https://www.earthdata.nasa.gov/data/tools/firms/faq)
- [VERIFICADO] GFW advierte que una alerta no siempre es un fuego, que no indica tamaño ni intensidad, y que la tasa de falsas alarmas aumenta con la cobertura arbórea. — [GFW blog, local context](https://blog.globalforestwatch.org/fires/placing-global-wildfires-into-local-context)

### Inferences
**[INFERENCIA] Recomendaciones para el calendario mes × año de FireSync**
1. **Línea base**: ofrecer dos opciones.
   - "Larga" (2002/2003–2021, serie armonizada a equivalente-VIIRS o en unidad Aqua). Coincide con la climatología 2003–2021 de INPE y con GWIS desde 2002.
   - "Corta, solo VIIRS" (2012/2013–año anterior). Coincide con GFW desde 2012.
   - Excluir siempre el año en curso de la línea base (INPE/EFFIS usan "hasta el año anterior").
2. **Estadísticos por mes calendario**: mediana, media, P10/P25/P75/P90, mínimo y máximo (estilo INPE), y **rango (rank)** del año actual entre N años.
3. **Anomalía robusta**: `z_rob = (x − mediana) / (1,4826·MAD)`, sobre `log1p(conteo)` para reducir el sesgo y manejar ceros. Alternativa: anomalía relativa `(x − mediana)/mediana`, o percentil empírico del valor actual. Mostrar z clásico `(x − media)/sd` solo como referencia (GWIS).
4. **Áreas pequeñas o con ceros**: usar un mínimo de conteo, p. ej. no colorear la anomalía si la mediana es <3 focos; agregar a trimestre o temporada; o usar un modelo de Poisson/binomial negativa con intervalos.
5. **Categorías** tipo GFW/INPE: "muy por encima" (>P90 o z_rob >2), "por encima" (P75–P90), "normal" (P25–P75), "por debajo" y "muy por debajo". Los umbrales son una propuesta propia.

### Gaps
- No se encontró la fórmula oficial de GFW ("unusually high" / "high"; umbrales en desvíos estándar). La documentación del widget no fue accesible (Medium 403).
- No se encontró la página oficial de INPE con la tabla mín/media/máx ni la fórmula exacta de la "climatologia".
- No se encontró ningún sistema operativo de focos que documente uso de mediana/MAD o log-transform.

---

## 7. ¿Qué incertidumbre mostrar al usuario?

### Takeaway
Las fuentes operativas y académicas muestran que la armonización tiene errores no despreciables:
- skill espacial y temporal de GFED5NRT de 0,62–0,98 según región;
- factores de escala QFED de ~0,77;
- diferencias de FRP de 20–38% en Sofiev & Kouznetsov;
- probabilidades de detección muy variables según región.

Conviene mostrar una banda de incertidumbre derivada del ajuste en el solapamiento y marcar explícitamente las transiciones de sensor y los periodos de deriva.

### Cited Findings
- [VERIFICADO] GFED5NRT reporta skill por región, con un rango temporal de 0,62–0,98 en área quemada. La calidad del escalado depende de la región. — [Chen et al. 2026](https://essd.copernicus.org/articles/18/7535/2026/)
- [VERIFICADO] Probabilidad de detección de fuegos potentes: ~78% (MODIS) y ~88% (VIIRS) global, pero <30% y <40% en algunas zonas ecuatoriales. El efecto del desfase horario sobre la FRP va de 0% a 50%. — [Sofiev & Kouznetsov 2026](https://gmd.copernicus.org/articles/19/10123/2026/)
- [VERIFICADO] GFED5 advierte que los años extendidos con otro sensor (1997–2000) "not on par" con la era MODIS. Es un precedente de etiquetar los años fuera del sensor núcleo. — [Chen et al. 2023](https://essd.copernicus.org/articles/15/5227/2023/)
- [VERIFICADO] INPE avisa que las estadísticas pueden quedar "prejudicadas" cuando el satélite de referencia tiene problemas. — [Greenpeace Brasil](https://www.greenpeace.org/brasil/press/devido-a-problemas-tecnicos-no-satelite-referencia-estatisticas-de-focos-de-calor-podem-estar-prejudicadas/)
- [VERIFICADO] FIRMS: en NRT, errores de posición de "several kilometers" tras maniobras o clima espacial severo; los datos estándar usan la mejor posición disponible, con 2–3 meses de demora. — [FIRMS FAQ](https://www.earthdata.nasa.gov/data/tools/firms/faq)
- [VERIFICADO] GFED5 cortó en 2022 por la deriva orbital de MODIS. — [Chen et al. 2026](https://essd.copernicus.org/articles/18/7535/2026/)

### Inferences
**[INFERENCIA] Elementos de incertidumbre para la interfaz**
- **Banda del ajuste**: intervalo de predicción al 90% de la regresión log-log, o rango intercuartil del ratio mensual en el solapamiento, aplicado a los años 2000–2011 reconstruidos.
- **Indicador de procedencia** por celda del calendario: "MODIS observado / VIIRS observado / reconstruido".
- **Marcas de transición**:
  - nov-2000 (Terra);
  - jul-2002 (Aqua);
  - ene-2012 (S-NPP);
  - 2018 (NOAA-20; FIRMS lo lista desde ~2018–2020);
  - 2023 (NOAA-21);
  - 2022+ (deriva de Aqua/Terra);
  - 2-nov-2026 (fin de S-NPP);
  - fin previsto de MODIS a fines de 2026 o en 2027.
- **Aviso de bajo conteo** en áreas pequeñas.
- **Tipo de dato**: NRT frente a Standard.
- **Validación cruzada temporal**: calibrar con 2012–2018 y validar en 2019–2021, reportando el sesgo y el error absoluto medio en % como métrica de confianza.

### Gaps
- No se encontró ningún producto operativo de **conteos** de focos que publique bandas de incertidumbre de armonización. La propuesta es propia.
- La fecha exacta de inicio de NOAA-20 y NOAA-21 en FIRMS no se verificó en esta sesión.
