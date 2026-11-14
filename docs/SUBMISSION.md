# FireSync: Space Apps 2026 submission draft (English, as required)

> Draft for the project page on spaceappschallenge.org. Update the numbers marked ⟨…⟩ after the final data build. The demo link must be public, with no login, and the video must be **≤ 30 seconds** (or ≤ 7 slides).

## Project name
FireSync: the continuity engine for Earth's fire record

## High-level summary (≈ 150 words)
NASA's MODIS has recorded Earth's fires since 2000 and is now retiring. Its successor, VIIRS, sees fires differently: smaller pixels and better night sensitivity mean 4–6 times more hotspots by day and far more at night. Gluing the two raw records together fakes a fire explosion in 2012, and fire managers lose a consistent 25-year history exactly when they need it most. FireSync processes all 556 million NASA FIRMS detections since November 2000 (plus the 2026 record through the FIRMS API). It harmonizes them with a stratified, validated calibration into one record of *VIIRS-equivalent hotspots*, and turns it into a burning activity calendar for any place on Earth. In a blind hindcast it cuts the error of the usual single-factor approach by 36%. Users pick a country or click anywhere on a 3D globe, see which months and years burned most, compare the current month with the historical median, and download the data.

## Project details
**What it does.** FireSync answers questions a fire manager asks every season. Is this month unusual for my area? Which months and years had the most fire? How does the current fire compare with past ones? The burning activity calendar (year × month) uses an accessible color ramp. Its anomaly mode compares each month with the median of the same month, and every reconstructed value is marked as such and comes with its likely range. A 3D globe shows the hotspots of any month and plays 25 years of global fire as a time-lapse.

**How it works.**
1. Common filters across sensors: vegetation fires only (FIRMS `type = 0`, plus a static-source mask for near-real-time data), MODIS confidence ≥ 30, VIIRS nominal/high.
2. A reference-satellite chain: Terra, then Aqua, then Suomi NPP, then NOAA-20 (Suomi NPP left FIRMS on 2 Nov 2026). Satellites are never summed, so constellation changes cannot inflate counts.
3. Calibration factors per country × calendar month × day/night, fitted on the overlap years and shrunk hierarchically toward country and global factors.
4. Uncertainty from the interannual spread of the factors.
5. Blind validation, published inside the app.

**Results.** Factors fitted on 2012–2017 predict 2018–2021 VIIRS counts from Aqua MODIS alone, over 6,760 country-months:

| Metric | FireSync | Single global factor |
|---|---|---|
| Median absolute error | **22.8%** | 35.7% |
| Total bias | **−1.7%** | −4.2% |

NOAA-20 and Suomi NPP agree within 2% (factors 1.00 by day and 0.98 at night), so the VIIRS-to-VIIRS hand-over needs no correction.

**Benefits.** Early-warning teams, emergency managers, scientists and land managers keep a consistent fire history as MODIS ends. The method recalibrates the same way when NOAA-21 or the next JPSS satellite joins.

**Tools.** C# (aggregation of 45 GB of CSV in about 2 minutes), JavaScript, three.js and globe.gl (globe), Apache ECharts (charts). Static hosting.

**Creativity.** We treat the problem as a *continuity system*, not a single conversion factor. The app is honest about provenance and uncertainty, and it publishes its own validation and a MODIS shutdown simulator.

## Use of NASA data
NASA FIRMS active fire data (MODIS Collection 6.1/6.2 MCD14ML/MCD14DL; VIIRS 375 m VNP14IMG and VJ114IMG, V002), the FIRMS area API (standard and NRT products for 2026) and NASA Blue Marble imagery. FIRMS data is the core of the project: every number in the app comes from it.

## Space agency partner data
The challenge was authored by CONAE (Argentina). Our demo case is the Guanchín fire in Chilecito, La Rioja (27 Jul–4 Aug 2026), which the challenge video features. Within 40 km of Chilecito, FireSync finds 243 VIIRS-equivalent hotspots in July 2026: +3,140% over the 2012–2025 July median of 8, and the highest July in 26 years. The MODIS burned-area product (MCD64A1, via Microsoft Planetary Computer) maps about 11,790 ha burned that month, consistent with the 10,000–15,000 ha preliminary estimates reported in the press. ⟨Add any CONAE resource used.⟩

## References
- NASA FIRMS. https://firms.modaps.eosdis.nasa.gov. *We acknowledge the use of data and imagery from NASA's Fire Information for Resource Management System (FIRMS), part of NASA's ESDIS.*
- Giglio, L., Schroeder, W., Justice, C. O. (2016). The collection 6 MODIS active fire detection algorithm and fire products. *Remote Sensing of Environment* 178, 31–41.
- Schroeder, W., Oliva, P., Giglio, L., Csiszar, I. A. (2014). The New VIIRS 375 m active fire detection data product. *Remote Sensing of Environment* 143, 85–96.
- Chen, Y. et al. (2023). Multi-decadal trends and variability in burned area from the fifth version of the Global Fire Emissions Database (GFED5). *Earth System Science Data* 15, 5227–5259.
- INPE Programa Queimadas (reference-satellite approach). https://terrabrasilis.dpi.inpe.br/queimadas
- Libraries: three.js (MIT), globe.gl and three-globe (MIT), Apache ECharts (Apache-2.0). Fonts: Source Serif 4, IBM Plex (SIL OFL).
- ⟨Add the GMD 2026 and Zheng et al. 2026 papers from `reports/` if cited.⟩

## Use of Super Intelligence (SI)
Claude (Anthropic) assisted with background research, the data pipeline, the web application code and documentation; see `AI_USAGE.md` in the repository. Code files are marked in their headers. Any SI-generated image or video carries a visible watermark.

## 30-second video script
| Time | Voice (English, or Spanish with English subtitles) | Screen |
|---|---|---|
| 0–3 s | "We're FireSync, from Argentina." | Globe spinning, title |
| 3–8 s | "NASA's MODIS fire record is ending, and VIIRS sees fires differently. Glue them together and 2012 looks like a fire explosion." | Annual chart, naive splice jumping |
| 8–18 s | "FireSync harmonizes 25 years of NASA data into one record. Here's Chilecito: July 2026 was 31 times its usual July, the worst in 26 years, with about 11,800 hectares burned." | Search "Chilecito", the globe anchors, July 2026 lights up the calendar |
| 18–25 s | "Validated: 36% less error than a single factor." | Validation lab |
| 25–30 s | "One consistent fire record for every fire manager on Earth." | Time-lapse of the globe |
