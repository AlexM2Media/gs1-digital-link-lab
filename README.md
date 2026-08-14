# GS1 Digital Link Lab

MVP web client-side para generar, analizar y leer datos GS1 Digital Link. No requiere backend, base de datos ni servicios externos en tiempo de ejecución.

## Capacidades

- Genera URI GS1 Digital Link no comprimidas con GTIN, calificadores y atributos iniciales.
- Convierte EAN/GTIN a GTIN-14 y valida el dígito de control GS1 Modulo-10.
- Genera QR en PNG RGB, BMP monocromático de 1 bpp y SVG.
- Analiza URI Digital Link no comprimidas y muestra los AI con significado localizado.
- Admite entrada de pistola como teclado, pegado, imágenes locales y cámara.
- Usa `BarcodeDetector` cuando está disponible y ZXing local como alternativa para imagen y cámara.
- Interfaz disponible en español e inglés.

## Inicio

Requiere Node.js y npm.

```bash
npm install
npm run dev
```

La aplicación se sirve normalmente en `http://127.0.0.1:5173`.

## Comandos

```bash
npm run build
npm run test
npm run lint
npm run format
```

## Arquitectura

- `src/core`: catálogo de AI, GTIN, URI Digital Link, QR y validaciones.
- `src/scanning`: adaptadores de cámara e imagen; no contienen lógica GS1.
- `src/i18n`: recursos de español e inglés.
- `src/main.ts`: controlador de la interfaz y presentación de resultados.

La alternativa ZXing se carga bajo demanda y queda empaquetada localmente. Las imágenes, los códigos y la cámara se procesan en el navegador; no se transmiten a ningún servidor.

## Alcance actual

Implementa URI no comprimidas con AI `01`, `10`, `21`, `22`, `11`, `13`, `15`, `16`, `17`, `3103`, `3922` y `8005`. Las URI Digital Link comprimidas se detectan, pero no se generan ni se analizan en este MVP.

## Licencia

Distribuido bajo la [licencia MIT](LICENSE).