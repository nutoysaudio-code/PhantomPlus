# Changelog

## 0.2.0

- Opacidad real de ventana en Windows con `src/glassit/SetTransparency.cs`
  (GlassIt-VSC, la misma clase de Russian Hacker Theme), compilada al vuelo con
  `Add-Type` desde la extensión.
- `phantomplus.alpha` (1–255, default 240), `phantomplus.step` y comandos
  aumentar/disminuir/opaca; atajos `Ctrl+Alt+Shift+Z` y `Ctrl+Alt+Shift+C`.
- La opacidad solo se aplica con el tema PhantomPlus activo y vuelve a 255 al
  cambiar de tema; se reaplica al editar la configuración y al recargar.
- `src/extension.js` sin paso de build; `node --check` como validación.

## 0.1.1

- Ícono de extensión: monograma **P** en oro con eco fantasma plateado y rubí
  (`assets/icon.svg`, exportado a `icons/icon.png` y `icons/icon@2x.png`).
- `scripts/render-icon.mjs` regenera los PNG desde el SVG maestro con Chrome
  headless.

## 0.1.0

- Primera pasada del tema **PhantomPlus**: vidrio ahumado con alfa en editor,
  lateral, panel, terminal y widgets.
- Gramática de color: dorado para funciones/números/acento, plata y platino
  para estructura y tipos, esmeralda para strings y éxito, rubí para keywords
  y errores.
- Workbench completo, tokens semánticos, ANSI de terminal, diff, Git, debug,
  testing y notebook.
- `scripts/validate-theme.mjs`: valida hexadecimales, claves críticas y
  contraste ≥ 4.5:1 sobre la superficie compuesta.
- `scripts/preview.mjs`: genera una maqueta HTML desde los valores del tema.
