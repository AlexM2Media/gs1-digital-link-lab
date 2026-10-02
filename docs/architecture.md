# Architecture

## Overview

The application is structured as a browser-based SPA, with responsibilities separated by functional domain.

### Main layers

- `src/main.ts`: initializes the UI and manages tabs and interaction events.
- `src/core`: GS1 core logic for validation, the AI catalog, URI parsing, and QR generation.
- `src/scanning`: image and camera scanning adapters.
- `src/i18n`: language resources and text translations.

## Generation flow

1. The UI collects the HTTPS domain, GTIN, and optional values.
2. `generationInputToDigitalLinkData()` normalizes and validates the input.
3. `buildDigitalLink()` builds a URI following the uncompressed GS1 Digital Link scheme.
4. `generateQrAssets()` produces PNG, BMP, and SVG assets.
5. The UI renders the result and offers a local download.

## Analysis flow

1. The input is validated with `detectInputFormat()`.
2. If it is a Digital Link, `parseDigitalLink()` is called.
3. The path structure and query parameters are checked.
4. Allowed AIs are validated and the URI is normalized.
5. The UI displays each AI with its localized name and value.

## Scanning flow

1. The app attempts to use the browser's native `BarcodeDetector`.
2. If it is unavailable, ZXing is loaded locally on demand.
3. Image scanning uses a `File`; camera scanning uses `getUserMedia` and a `video` element.
4. The result is passed to the Digital Link analysis logic.

## Design considerations

- The project prioritizes self-containment: it requires no backend or infrastructure.
- Validation is local and explicit, centered on the client's own AI catalog.
- The UI remains small and functional for a lab MVP.
- The AI catalog is sourced from a local CSV and converted in code into `AiDefinition` objects.

For the Spanish version, see [Arquitectura](es_ES/architecture.md).
