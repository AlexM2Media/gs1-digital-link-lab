# Documentación del proyecto

Esta carpeta recoge la documentación operativa y técnica útil para entender y mantener GS1 Digital Link Lab.

## Índice

- [architecture.md](architecture.md): visión general de la arquitectura cliente y flujo de datos.
- [usage.md](usage.md): guía de uso de las pestañas de generación, análisis y escaneo.
- [gs1-rules.md](gs1-rules.md): reglas GS1 aplicadas, AI soportados y límites de validación.

## Resumen rápido

La aplicación es una SPA sin backend que se ejecuta íntegramente en el navegador. Su propósito es:

- construir URIs GS1 Digital Link no comprimidas,
- validarlas según reglas locales de GS1,
- analizar y normalizar URIs entrantes,
- leer códigos desde imagen o cámara,
- generar QR para exportación local.

Todo el procesamiento se realiza del lado del cliente. No hay autenticación, base de datos ni transmisión a servicios externos en ejecución.
