# Use of Super Intelligence (SI) in FireSync

The NASA Space Apps 2026 Project Submission Guide asks teams to describe how SI tools were used. It also asks them to mark SI-generated code and data in descriptive text and metadata, and to watermark SI-generated images and video. This file is that description.

**Tool:** Claude (Anthropic), used through Claude Code.

| Part of the project | How SI was used |
|---|---|
| Background research (`reports/`, `research_notes/`) | SI searched and summarized sources about the sensors, FIRMS products, harmonization literature, data access, prior Space Apps projects and terms of use. The team reviewed the findings. |
| Self-assessment and plan (`docs/EVALUACION_Y_PLAN.md`) | SI-drafted, based on the official judging criteria. |
| Data pipeline (`pipeline/FireSync.cs`) | SI-generated code. The method follows the reference-satellite and stratified-ratio approaches documented in the literature (INPE, GFED5, QFED). |
| Derived data (`web/data/`) | Produced by the SI-generated pipeline from NASA FIRMS archives. Each file is generated, not hand-edited. |
| Web application (`web/`) | SI-generated code: layout, globe, calendar, charts, animations, colors and texts. |
| Images and video | Any SI-generated image or video in the demo carries a visible "SI-generated" watermark. Screenshots of the running app are not SI-generated imagery. |

Every SI-assisted source file states it in its header comment.

No SI-generated content uses NASA logos, flags or mission identifiers.
