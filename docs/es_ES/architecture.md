# Arquitectura

## Visión general

La aplicación está estructurada como una SPA de navegador con responsabilidades separadas por dominio funcional.

### Capas principales

- `src/main.ts`: inicializa la UI, gestiona pestañas y eventos de interacción.
- `src/core`: núcleo GS1 con validación, catálogo de AI, parseo de URIs y generación de QR.
- `src/scanning`: adaptadores de lectura por imagen y cámara.
- `src/i18n`: recursos de idioma y traducción de textos.

## Flujo de generación

1. La UI recoge el dominio HTTPS, GTIN y valores opcionales.
2. `generationInputToDigitalLinkData()` normaliza y valida los datos.
3. `buildDigitalLink()` construye la URI según el esquema GS1 Digital Link no comprimido.
4. `generateQrAssets()` produce PNG, BMP y SVG.
5. La interfaz renderiza el resultado y ofrece descarga local.

## Flujo de análisis

1. La entrada se valida con `detectInputFormat()`.
2. Si es un Digital Link, se llama a `parseDigitalLink()`.
3. Se comprueba la estructura del path y los parámetros query.
4. Se validan los AI permitidos y se normaliza la URI.
5. La UI muestra cada AI con su nombre localizado y su valor.

## Flujo de escaneo

1. La app intenta usar `BarcodeDetector` nativo del navegador.
2. Si no está disponible, se carga ZXing localmente bajo demanda.
3. La lectura de la imagen usa un `File` y la cámara usa `getUserMedia` + `video`.
4. El resultado se reenvía a la lógica de análisis del Digital Link.

## Consideraciones de diseño

- El proyecto prioriza la auto-contención: no requiere backend ni infraestructura.
- La validación es local y explícita, centrada en el catálogo de AI del propio cliente.
- La UI se mantiene pequeña y funcional para un MVP de laboratorio.
- El catálogo de AI se alimenta de un CSV local y se transforma por código en definiciones de tipo `AiDefinition`.