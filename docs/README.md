# Project Documentation

This directory contains the operational and technical documentation for understanding and maintaining GS1 Digital Link Lab.

## Contents

- [architecture.md](architecture.md): overview of the client-side architecture and data flows.
- [usage.md](usage.md): guide to the generation, analysis, and scanning tabs.
- [gs1-rules.md](gs1-rules.md): applied GS1 rules, supported AIs, and validation limits.

## Quick overview

The application is a backend-free SPA that runs entirely in the browser. It is designed to:

- build uncompressed GS1 Digital Link URIs,
- validate them against local GS1 rules,
- analyze and normalize incoming URIs,
- scan codes from images or a camera,
- generate QR codes for local export.

All processing happens client-side. There is no authentication, database, or runtime transmission to external services.

For the Spanish documentation, see the [Spanish documentation index](es_ES/README.md).
