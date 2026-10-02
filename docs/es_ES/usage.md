# Guía de uso

## Generación de URIs

La pestaña de generación permite:

- indicar un dominio con `https://` obligatorio,
- introducir un GTIN válido,
- completar calificadores y atributos comunes,
- añadir AI adicionales desde el selector del catálogo local.

### Campos incluidos por defecto

Los principales campos del formulario son:

- `01`: GTIN / primary identifier
- `10`: lote
- `21`: serial
- `22`: variante
- `11`, `13`, `15`, `16`, `17`: fechas
- `3103`: peso neto
- `3922`: precio
- `8005`: precio por kg

### Añadir AI adicionales

El selector del catálogo permite elegir AI que no forman parte del formulario fijo. Cuando se selecciona un AI:

- si el valor es un cualificador de path, se incluye en el segmento de la URI,
- si es un atributo, se añade en la query string,
- si el tipo es incompatible o no está permitido, se reporta un error de validación.

## Análisis de URIs

La pestaña de análisis acepta:

- URIs GS1 Digital Link no comprimidas,
- GTIN validos,
- cadenas element strings tipo bracketed/FNC1,
- entradas inválidas.

El sistema intenta detectar el formato y, si es un Digital Link válido, devuelve:

- la URI normalizada,
- el AI principal,
- calificadores y atributos ordenados,
- los mensajes de error cuando el contenido no cumple las reglas del catálogo.

## Escaneo desde cámara o imagen

La pestaña de escaneo ofrece dos rutas:

- carga de imagen local,
- activación de cámara del dispositivo.

### Comportamiento

- Si `BarcodeDetector` está disponible, se usa como primera opción.
- Si no está disponible, se usa ZXing local cargado bajo demanda.
- El resultado se envía a la misma lógica de análisis que la entrada manual.

## Exportación de QR

La app genera tres formatos de salida:

- PNG RGB,
- BMP monocromático,
- SVG vectorial.

Cada uno se puede descargar localmente con un nombre generado a partir de la URI resultante.

## Observaciones prácticas

- El dominio debe usar HTTPS; la validación rechaza dominios no seguros.
- La URI resultante sigue el esquema de Digital Link no comprimido con AI en path y atributos en query.
- Las URIs comprimidas se detectan como formato, pero no están implementadas para generación ni análisis completo.