# GS1 Rules and Lab Support

## Digital Link URI model

The application follows the uncompressed Digital Link pattern:

```text
https://example.org/01/12345678901234/10/LOT123/22/VARIANT
?3103=1250&3922=1299&8005=899
```

### Conventions

- The primary AI `01` represents the GTIN and is placed in the path.
- Qualifiers are serialized as `AI/value` pairs in the path.
- Attributes are serialized as query parameters using `AI=value`.
- The URI is normalized to avoid duplicates and keep the scheme valid.

## Implemented validation

### GTIN

- EAN/GTIN values with 8, 12, or 14 characters are accepted.
- Values are converted to GTIN-14 before the URI is generated.
- The GS1 modulo-10 check digit is validated.

### Date AIs

The supported date AIs are:

- `11`, `13`, `15`, `16`, `17`

All must use the numeric `YYMMDD` format in the final URI. The form also accepts ISO `YYYY-MM-DD` input.

### Measurements and prices

The AIs implemented in strict generation are:

- `3103`: net weight with 3 decimal places
- `3922`: price with 2 decimal places
- `8005`: price per kg with 2 decimal places

The logic normalizes decimal separators and checks that length limits are not exceeded.

## AI catalog

The local catalog is built from a CSV loaded in the browser and converted into definitions with:

- localized name,
- role (`primary`, `qualifier`, `attribute`),
- value type (`numeric`, `alphanumeric`, `date`, `decimal`),
- minimum and maximum length,
- validation patterns,
- path serialization order.

This lets the app describe AIs in detail even when they are not all part of the strict generator.

## Current scope

### Strict generation

Direct generation supports:

- `01`, `10`, `21`, `22`, `11`, `13`, `15`, `16`, `17`, `3103`, `3922`, `8005`

### Analysis and catalog

Additional AIs from the local catalog are detected and described to support analysis and manual selection in the UI.

### Formats not supported in this version

- compressed Digital Link,
- full GS1 compression analysis,
- generation of compressed URIs.

These inputs are recognized as a detected format, but are outside the scope of the MVP.

For the Spanish version, see [Reglas GS1 y soporte del laboratorio](es_ES/gs1-rules.md).
