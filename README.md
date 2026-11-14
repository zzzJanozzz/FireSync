# FireSync: the continuity engine for Earth's fire record

**NASA Space Apps Challenge 2026 · Challenge: Harmonization of MODIS and VIIRS Hot Spots**
Team: Jano, Mel, Siro, Yuri and Valen (Argentina)

**Live app: https://zzzjanozzz.github.io/FireSync/** · Demo case: [Chilecito, July 2026](https://zzzjanozzz.github.io/FireSync/#p=-29.180,-67.640,40&t=2026-07)

MODIS has watched Earth's fires since 2000, and it is retiring. VIIRS, its successor, sees fires differently: smaller pixels (375 m vs 1 km) and far better night sensitivity, so it detects roughly 4–6 times more hotspots by day and many times more at night. Glue the two raw records together and you get a fake fire explosion in 2012. FireSync rebuilds one consistent, validated record of hotspot activity from November 2000 to the present, for any place on Earth, and turns it into a burning activity calendar that emergency managers can read in seconds.

## What it does

- **Global harmonized record.** All 556 million NASA FIRMS detections from 48 yearly global archives (MODIS 2000–2025, VIIRS Suomi NPP 2012–2025, VIIRS NOAA-20 2018–2025), expressed in *VIIRS-equivalent hotspots*.
- **Any area.** Search a country, province, department, city or town (boundaries from OpenStreetMap), click anywhere on the 3D globe (circle with an adjustable radius) or type a latitude and longitude. The globe then anchors on that area and shows only its hotspots.
- **Burned hectares.** For the selected area and month, FireSync queries the MODIS MCD64A1 burned-area product through Microsoft Planetary Computer. It reports burned hectares as the burned-pixel fraction × the geodesic area of the shape. Chilecito, July 2026: ≈ 11,800 ha, consistent with the 10,000–15,000 ha reported in the press.
- **Burning activity calendar.** A year × month heatmap with an accessible, perceptually uniform color ramp (inferno). It has an anomaly mode with a colorblind-safe diverging ramp, hatched cells wherever the value is reconstructed from MODIS, and era separators.
- **Current vs historical.** For each month: the median of the same calendar month over a selectable baseline (excluding the year being evaluated), the anomaly in percent, the rank among all years, and a plain-language sentence.
- **Honest uncertainty.** Reconstructed months carry a likely range from the interannual spread of the calibration ratios.
- **Validation lab.** A blind hindcast: factors fitted on 2012–2017 predict 2018–2021 VIIRS counts from Aqua MODIS alone. It also includes a MODIS shutdown simulator that shows Aqua's orbit drift after 2022.
- **3D globe.** NASA Blue Marble imagery with relief, specular oceans, moving clouds and an atmosphere. Hotspot columns are GPU-instanced and ease smoothly from month to month. The globe shows the area outline and pulsing rings on its strongest cells. A time-lapse plays 25 years of fire with the camera anchored on the chosen area.
- **Downloads.** The calendar matrix as CSV, the monthly series as CSV (harmonized value, likely range, provenance, reference satellite, raw counts) and the calendar as PNG. The app state lives in a shareable URL.
- **English and Spanish** interface.

## Method (summary)

1. **Common filters.** Keep FIRMS `type = 0` (presumed vegetation fire), MODIS confidence ≥ 30 and VIIRS nominal/high confidence. Low-confidence VIIRS is dropped across the whole record, so the South Atlantic Anomaly filter that FIRMS applies only to near-real-time data cannot create a break.
2. **Reference-satellite chain.** One satellite defines each month: Terra (Nov 2000–Jun 2002) → Aqua (Jul 2002–Jan 2012) → Suomi NPP (Feb 2012–Oct 2026; FIRMS production ended 2 Nov 2026) → NOAA-20. Satellites are never summed, so constellation changes cannot inflate counts.
3. **Stratified calibration.** For each country × calendar month × day/night stratum, the factor is the ratio of sums over the overlap: Aqua vs Suomi NPP 2012–2021, Terra vs Suomi NPP 2012–2019, NOAA-20 vs Suomi NPP 2018–2025. Factors are shrunk hierarchically (country, then global) with k = 30 pseudo-detections.
4. **Uncertainty.** The interquartile range of the yearly ratios in each stratum.
5. **Validation.** Blind hindcast on 6,760 country-months with ≥ 20 hotspots:

| Metric (2018–2021, predicted from Aqua) | FireSync engine | Single global factor |
|---|---|---|
| Median absolute error | **22.8 %** | 35.7 % |

The full metrics (bias, log correlation, per-country errors) are in `web/data/validation.json` and on the app's Validation lab. NOAA-20 vs Suomi NPP factors come out at 1.00 (day) and 0.98 (night), which confirms the VIIRS-to-VIIRS hand-over.

## Repository layout

| Path | Content |
|---|---|
| `pipeline/FireSync.cs` | Aggregation and harmonization pipeline (C#, compiles with the .NET Framework compiler that ships with Windows) |
| `scripts/firms_zips.curlrc` | Download list of the 48 FIRMS yearly global archives |
| `scripts/serve.ps1` | Zero-install local web server |
| `web/` | Static web app (no build step) and the generated data products in `web/data/` |
| `docs/EVALUACION_Y_PLAN.md` | Judging self-assessment and hackathon plan (Spanish) |
| `reports/` | Background research report (Spanish) |

## Reproduce

```powershell
# 1. Download the FIRMS yearly global archives 2000-2025 (~9 GB) into data/raw/zips
curl.exe -K scripts\firms_zips.curlrc -Z --parallel-max 4 --retry 5 -f --create-dirs
# 2. Download 2026 through the FIRMS API (put your free MAP_KEY in scripts\firms_key.txt; ~40 min within the key's rate limit)
powershell -ExecutionPolicy Bypass -File scripts\fetch_2026.ps1
# 3. Compile the pipeline
C:\Windows\Microsoft.NET\Framework64\v4.0.30319\csc.exe /optimize+ /platform:x64 /out:pipeline\bin\firesync.exe /r:System.IO.Compression.dll /r:System.IO.Compression.FileSystem.dll pipeline\FireSync.cs
# 4. Aggregate (about 2 minutes on 8 cores), ingest 2026 and build the products
pipeline\bin\firesync.exe aggregate data\raw\zips data\work 8
pipeline\bin\firesync.exe ingest-api data\raw\api data\raw\zips data\work
pipeline\bin\firesync.exe build data\work web\data 0.25
# 5. Serve
powershell -ExecutionPolicy Bypass -File scripts\serve.ps1 -Port 8080
```

## Run it on any laptop

The app is static: it only needs the `web/` folder (about 120 MB including its data) and any local web server. Opening `index.html` by double-click does not work, because browsers block `fetch` from `file://`.

| Laptop | Command, run from the `FireSync` folder |
|---|---|
| Windows (no installs) | `powershell -ExecutionPolicy Bypass -File scripts\serve.ps1` |
| Any OS with Python 3 | `python -m http.server 8080 --directory web` |
| Any OS with Node.js | `npx serve web -l 8080` |

Then open http://localhost:8080. Rebuilding the data needs the 9 GB raw archives and the pipeline. The pipeline compiles on Windows with the built-in `csc.exe`; on macOS or Linux, use Mono (`mcs`) or the .NET SDK. `scripts/make_portable.ps1` packs everything except the raw archives into a single zip.

## Data sources and credits

- **NASA FIRMS** (Fire Information for Resource Management System) country yearly archives: MODIS MCD14ML (the archive `version` field reads 6.2), VIIRS 375 m Suomi NPP VNP14IMG and NOAA-20 VJ114IMG (V002). https://firms.modaps.eosdis.nasa.gov. *We acknowledge the use of data and imagery from NASA's Fire Information for Resource Management System (FIRMS) (https://earthdata.nasa.gov/firms), part of NASA's Earth Science Data and Information System (ESDIS).*
- **MODIS MCD64A1** burned area (Collection 6.1, NASA LP DAAC), accessed through the **Microsoft Planetary Computer** STAC and data APIs (a Space Apps 2026 Global Offer).
- Place search and boundaries: **OpenStreetMap Nominatim**, © OpenStreetMap contributors (ODbL). Queries are only sent on explicit search, within Nominatim's usage policy.
- **NASA Blue Marble** Earth imagery, topology and water mask, as packaged in the `three-globe` examples (MIT). Cloud texture from the `globe.gl` examples.
- Libraries: three.js (MIT), globe.gl and three-globe (MIT), Apache ECharts (Apache-2.0). Fonts: Inter and JetBrains Mono (SIL OFL).
- Background literature is listed in `reports/`.

FireSync is a NASA Space Apps Challenge project. It is not endorsed by NASA, and it uses no NASA logos or branding.

## Use of Super Intelligence (SI)

This project was built with the help of an SI assistant (Claude, by Anthropic) for research, code and documentation. See [AI_USAGE.md](AI_USAGE.md).

## License

Apache License 2.0. See [LICENSE](LICENSE).
