# GS1 Digital Link Lab

Aplicación web client-side para generar, validar, analizar y documentar URIs GS1 Digital Link en el navegador. El proyecto no requiere backend, ni servicios externos en tiempo de ejecución y mantiene el catálogo de AI como fuente local editable en CSV con UTF-8.

## ¿Qué hace esta aplicación?

- Genera Digital Link no comprimidas con HTTPS, GTIN, calificadores y atributos.
- Valida GTIN, fechas y valores según reglas técnicas de GS1.
- Analiza URIs y presenta los AI con título y descripción localizada.
- Detecta entrada en varios formatos: GTIN, Digital Link, element strings con FNC1/GS y valores de escaneo.
- Genera QR en PNG RGB, BMP monocromático y SVG con margen, escala y corrección de errores.
- Admite entrada por teclado, pegado, imágenes locales y cámara.
- Usa `BarcodeDetector` cuando está disponible y hace fallback a ZXing empaquetado localmente.
- Expone enlaces directos a la referencia GS1 para cada AI y para el catálogo completo.
- Mantiene la lista de AI adicionales en `localStorage` para un flujo de uso frecuente.

## Arquitectura real del proyecto

El diseño actual separa contenido editorial y lógica técnica:

- `src/core`: validación GS1, generación y análisis de Digital Link, catálogo de AI, QR y detección de formato.
- `src/data`: catálogo de AI en CSV. La fuente de verdad es un archivo como `AI_Catalog-es_ES.csv`.
- `src/scanning`: lectura desde cámara e imagen con fallback local.
- `src/i18n`: recursos de internacionalización en español e inglés.
- `src/main.ts`: orquestación de la UI y acciones del usuario.

El catálogo no está hardcodeado. Los textos de descripción se cargan desde CSV y luego se transforman en objetos `AiDefinition` en runtime. Las reglas de validación estricta se mantienen en TypeScript porque forman parte de la lógica técnica y no del contenido editorial.

## Catálogo AI y CSV como fuente de verdad

La definición de AI se basa en archivos CSV bajo `src/data`, por ejemplo:

```csv
AI;Descripción;Titulo
01;Número Global de Artículo Comercial (GTIN);GTIN
10;Lote o número de lote;BATCH/LOT
21;Número de serie;SERIAL
```

La app importa este CSV como texto y lo parsea en memoria. Después, el catálogo se combina con overrides técnicos definidos en `src/core/ai-catalog.ts` para aplicar reglas concretas de:

- longitud mínima/máxima
- tipo de valor
- patrón de validación
- número de decimales
- rol (`primary`, `qualifier`, `attribute`)
- orden en path para los calificadores
- validación de GTIN con dígito de control

Esto hace que el catálogo sea más mantenible, editable y menos propenso a errores de duplicación entre código y metadatos.

## Inicio rápido

Requiere Node.js moderno con npm.

```bash
npm install
npm run dev
```

La aplicación se sirve normalmente en `http://127.0.0.1:5173`.

## Comandos disponibles

```bash
npm run dev
npm run build
npm run test
npm run lint
npm run format
```

## Alcance funcional actual

El generador estricto implementado cubre los AI más habituales para la creación de Digital Links en este laboratorio:

- Primario: `01`
- Calificadores: `10`, `21`, `22`
- Fechas: `11`, `13`, `15`, `16`, `17`
- Atributos de medida/precio: `3103`, `3922`, `8005`

Además, el catálogo local incluye más identificadores para análisis y selección manual desde la UI. El proyecto detecta URIs comprimidas, pero no genera ni analiza ese formato en esta versión MVP.

## Flujo principal de uso

1. En la pestaña de generación se introduce un dominio HTTPS y un GTIN válido.
2. Se completan calificadores y atributos básicos desde el formulario o mediante el selector local de AI.
3. La app genera la URI Digital Link no comprimida y renderiza los QR en PNG, BMP y SVG.
4. En la pestaña de análisis se pega o introduce una URI Digital Link para normalizarla y ver los AI detectados.
5. En la pestaña de escaneo se puede leer desde imagen o cámara; si el navegador expone `BarcodeDetector`, se usa nativamente.

## Recomendaciones de mantenimiento

- Mantén los textos descriptivos del AI en CSV y no los dupliques en TypeScript.
- Si añades un AI nuevo o corriges una descripción, actualiza el CSV y verifica la UI.
- Si un AI necesita validación técnica específica, añade la regla en `src/core/ai-catalog.ts` como override estructural.
- Asegura que los CSV se guarden en UTF-8 para evitar problemas de caracteres raros y codificación.

## Documentación adicional

- [Índice de documentación en español](README.md)
- [Arquitectura](architecture.md)
- [Guía de uso](usage.md)
- [Reglas GS1](gs1-rules.md)

## Licencia

Distribuido bajo la [licencia MIT](../../LICENSE).