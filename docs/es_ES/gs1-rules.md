# Reglas GS1 y soporte del laboratorio

## Modelo de URI Digital Link

La aplicación sigue el patrón de Digital Link no comprimido:

```text
https://example.org/01/12345678901234/10/LOT123/22/VARIANT
?3103=1250&3922=1299&8005=899
```

### Convenciones aplicadas

- El AI primario `01` representa el GTIN y se coloca en el path.
- Los calificadores se serializan como pares `AI/valor` en el path.
- Los atributos se serializan como parámetros de query usando `AI=valor`.
- La URI se normaliza para evitar duplicados y mantener el esquema válido.

## Validaciones implementadas

### GTIN

- Se acepta EAN/GTIN de 8, 12 o 14 caracteres.
- Se convierte a GTIN-14 antes de generar la URI.
- Se valida el dígito verificador GS1 módulo 10.

### AI de fechas

Los AI de fecha esperados son:

- `11`, `13`, `15`, `16`, `17`

Todos deben cumplir el formato numérico `YYMMDD` en la URI final y se aceptan entradas ISO `YYYY-MM-DD` en el formulario.

### Medidas y precios

Los AI implementados en la generación estricta son:

- `3103`: peso neto con 3 decimales
- `3922`: precio con 2 decimales
- `8005`: precio por kg con 2 decimales

La lógica normaliza separadores decimales y valida que no se excedan los límites de longitud.

## Catálogo de AI

El catálogo local se construye desde un CSV cargado en el navegador y se transforma en definiciones con:

- nombre localizado,
- rol (`primary`, `qualifier`, `attribute`),
- tipo de valor (`numeric`, `alphanumeric`, `date`, `decimal`),
- longitud mínima/máxima,
- patrones de validación,
- orden de serialización para path.

Esto permite que la app pueda describir AI de forma rica incluso cuando no todos forman parte del generador estricto.

## Alcance actual

### Generación estricta

Se soportan por generación directa:

- `01`, `10`, `21`, `22`, `11`, `13`, `15`, `16`, `17`, `3103`, `3922`, `8005`

### Análisis y catálogo

Se detectan y describen más AI del catálogo local para apoyo de análisis y elección manual en la interfaz.

### Formatos no soportados en esta versión

- Digital Link comprimido,
- análisis completo de compresión GS1,
- generación de URIs comprimidas.

Estas rutas se reconocen como formato detectado, pero están fuera del alcance del MVP.