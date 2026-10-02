# Usage Guide

## Generating URIs

The generation tab lets you:

- enter a domain; `https://` is required,
- enter a valid GTIN,
- fill in common qualifiers and attributes,
- add more AIs from the local catalog selector.

### Default fields

The form's main fields are:

- `01`: GTIN / primary identifier
- `10`: batch or lot
- `21`: serial number
- `22`: variant
- `11`, `13`, `15`, `16`, `17`: dates
- `3103`: net weight
- `3922`: price
- `8005`: price per kg

### Adding more AIs

The catalog selector lets you choose AIs that are not part of the fixed form. When an AI is selected:

- path qualifiers are added to the URI path,
- attributes are added to the query string,
- incompatible or disallowed types produce a validation error.

## Analyzing URIs

The analysis tab accepts:

- uncompressed GS1 Digital Link URIs,
- valid GTINs,
- bracketed/FNC1-style element strings,
- invalid input.

The system attempts to detect the format and, for a valid Digital Link, returns:

- the normalized URI,
- the primary AI,
- ordered qualifiers and attributes,
- error messages when the content does not comply with the catalog rules.

## Scanning from a camera or image

The scanning tab offers two options:

- upload a local image,
- activate the device camera.

### Behavior

- If `BarcodeDetector` is available, it is used first.
- Otherwise, ZXing is loaded locally on demand.
- The result is sent through the same analysis logic as manually entered input.

## QR export

The app generates three output formats:

- RGB PNG,
- monochrome BMP,
- vector SVG.

Each format can be downloaded locally with a filename generated from the resulting URI.

## Practical notes

- The domain must use HTTPS; validation rejects insecure domains.
- The resulting URI follows the uncompressed Digital Link scheme, with AIs in the path and attributes in the query.
- Compressed URIs are detected as a format, but full generation and analysis are not implemented.

For the Spanish version, see [Guía de uso](es_ES/usage.md).
