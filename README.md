# GS1 Digital Link Lab

A client-side web application for generating, validating, analyzing, and documenting GS1 Digital Link URIs in the browser. The project requires no backend or runtime external services, and keeps its AI catalog in an editable local UTF-8 CSV file.

## What does this application do?

- Generates uncompressed Digital Links with HTTPS, GTINs, qualifiers, and attributes.
- Validates GTINs, dates, and values according to GS1 technical rules.
- Analyzes URIs and displays AIs with localized titles and descriptions.
- Detects several input formats: GTIN, Digital Link, element strings with FNC1/GS, and scanner output.
- Generates QR codes as RGB PNG, monochrome BMP, and SVG, with configurable margin, scale, and error correction.
- Accepts keyboard input, pasted content, local images, and camera input.
- Uses `BarcodeDetector` when available and falls back to locally bundled ZXing.
- Provides direct links to the GS1 reference for each AI and for the complete catalog.
- Keeps the list of additional AIs in `localStorage` for frequent use.

## Project architecture

The current design separates editorial content from technical logic:

- `src/core`: GS1 validation, Digital Link generation and analysis, the AI catalog, QR codes, and format detection.
- `src/data`: AI catalog in CSV. The source of truth is a file such as `AI_Catalog-es_ES.csv`.
- `src/scanning`: camera and image scanning with a local fallback.
- `src/i18n`: Spanish and English internationalization resources.
- `src/main.ts`: UI orchestration and user actions.

The catalog is not hardcoded. Descriptions are loaded from CSV and then converted into `AiDefinition` objects at runtime. Strict validation rules remain in TypeScript because they are technical logic rather than editorial content.

## AI catalog and CSV as the source of truth

AI definitions are based on CSV files under `src/data`, for example:

```csv
AI;Description;Title
01;Global Trade Item Number (GTIN);GTIN
10;Batch or lot number;BATCH/LOT
21;Serial number;SERIAL
```

The app imports this CSV as text and parses it in memory. The catalog is then combined with technical overrides defined in `src/core/ai-catalog.ts` to apply specific rules for:

- minimum and maximum length
- value type
- validation pattern
- number of decimal places
- role (`primary`, `qualifier`, `attribute`)
- path ordering for qualifiers
- GTIN check-digit validation

This makes the catalog easier to maintain and edit, while reducing the risk of duplicated code and metadata.

## Quick start

Requires a modern version of Node.js and npm.

```bash
npm install
npm run dev
```

The application is usually served at `http://127.0.0.1:5173`.

## Available commands

```bash
npm run dev
npm run build
npm run test
npm run lint
npm run format
```

## Current functional scope

The implemented strict generator covers the most common AIs used to create Digital Links in this lab:

- Primary identifier: `01`
- Qualifiers: `10`, `21`, `22`
- Dates: `11`, `13`, `15`, `16`, `17`
- Measurement and price attributes: `3103`, `3922`, `8005`

The local catalog also includes additional identifiers for analysis and manual selection in the UI. The project detects compressed URIs, but does not generate or analyze that format in this MVP.

## Main workflow

1. Enter an HTTPS domain and a valid GTIN on the generation tab.
2. Fill in qualifiers and basic attributes using the form or the local AI selector.
3. The app generates the uncompressed Digital Link URI and renders QR codes in PNG, BMP, and SVG.
4. Paste or enter a Digital Link URI on the analysis tab to normalize it and view detected AIs.
5. Scan an image or use a camera on the scanning tab; if the browser exposes `BarcodeDetector`, it is used natively.

## Maintenance recommendations

- Keep AI descriptions in CSV rather than duplicating them in TypeScript.
- When adding an AI or correcting a description, update the CSV and verify the UI.
- If an AI needs specific technical validation, add a structural override in `src/core/ai-catalog.ts`.
- Save CSV files as UTF-8 to avoid character encoding issues.

## Documentation

- [Documentation index](docs/README.md)
- [Architecture](docs/architecture.md)
- [Usage guide](docs/usage.md)
- [GS1 rules and support](docs/gs1-rules.md)
- [Documentación en español](docs/es_ES/README.md)
- [Descripción del proyecto en español](docs/es_ES/overview.md)

## License

Distributed under the [MIT License](LICENSE).

---

## Repository Activity

![Alt](https://repobeats.axiom.co/api/embed/ec00c3c09b3870902d0e3ee0913221635e021211.svg "Repobeats analytics image")

---

**Author:** Alejandro Mateo - [@AlexM2Media](https://github.com/AlexM2Media)  
**Repo:** [GS1 Digital Link Lab](https://github.com/AlexM2Media/gs1-digital-link-lab)  
**Web/Portfolio:** [alexm2.media](https://alexm2.media)
