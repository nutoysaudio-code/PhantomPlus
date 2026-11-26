#!/usr/bin/env node
// Valida themes/phantom-plus-color-theme.json sin abrir VS Code:
// 1) todos los colores son hexadecimales validos (#RRGGBB o #RRGGBBAA)
// 2) las claves de workbench criticas existen
// 3) el contraste de texto contra la superficie compuesta (alfa incluido) llega al piso
// Uso: node scripts/validate-theme.mjs

import { readFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const pkg = JSON.parse(await readFile(resolve(root, "package.json"), "utf8"));
const themeEntry = pkg?.contributes?.themes?.[0];
if (!themeEntry?.path) fail("package.json no declara contributes.themes[0].path");

const themePath = resolve(root, themeEntry.path);
const theme = JSON.parse(await readFile(themePath, "utf8"));

const HEX = /^#([0-9a-f]{6}|[0-9a-f]{8})$/i;
const problems = [];
const warnings = [];

function fail(message) {
  console.error(`FALLA  ${message}`);
  process.exit(1);
}

function parseColor(value, where) {
  if (typeof value !== "string" || !HEX.test(value)) {
    problems.push(`${where}: color invalido "${value}"`);
    return null;
  }
  const hex = value.slice(1);
  const r = parseInt(hex.slice(0, 2), 16);
  const g = parseInt(hex.slice(2, 4), 16);
  const b = parseInt(hex.slice(4, 6), 16);
  const a = hex.length === 8 ? parseInt(hex.slice(6, 8), 16) / 255 : 1;
  return { r, g, b, a, hex: value.toUpperCase() };
}

const colors = theme.colors ?? {};
const parsed = new Map();
for (const [key, value] of Object.entries(colors)) {
  const c = parseColor(value, `colors["${key}"]`);
  if (c) parsed.set(key, c);
}

for (const [index, token] of (theme.tokenColors ?? []).entries()) {
  for (const field of ["foreground", "background"]) {
    if (token?.settings?.[field]) parseColor(token.settings[field], `tokenColors[${index}].settings.${field}`);
  }
}
for (const [name, value] of Object.entries(theme.semanticTokenColors ?? {})) {
  if (typeof value === "string") parseColor(value, `semanticTokenColors["${name}"]`);
  else if (value?.foreground) parseColor(value.foreground, `semanticTokenColors["${name}"].foreground`);
}

const required = [
  "editor.background",
  "editor.foreground",
  "sideBar.background",
  "sideBar.foreground",
  "activityBar.background",
  "activityBar.foreground",
  "statusBar.background",
  "statusBar.foreground",
  "titleBar.activeBackground",
  "titleBar.activeForeground",
  "editorGroupHeader.tabsBackground",
  "tab.activeBackground",
  "tab.activeForeground",
  "tab.inactiveForeground",
  "list.activeSelectionBackground",
  "list.activeSelectionForeground",
  "input.background",
  "input.foreground",
  "dropdown.background",
  "dropdown.foreground",
  "button.background",
  "button.foreground",
  "terminal.background",
  "terminal.foreground",
  "panel.background",
  "panelTitle.activeForeground",
  "menu.background",
  "menu.foreground",
  "quickInput.background",
  "editorWidget.background",
  "notifications.background",
  "focusBorder",
  "editorLineNumber.foreground",
  "editorLineNumber.activeForeground",
  "editorCursor.foreground"
];
for (const key of required) {
  if (!(key in colors)) problems.push(`falta la clave critica colors["${key}"]`);
}

// Composicion alfa: VS Code pinta las superficies con alfa sobre window.background
// (o negro si no esta definido). El contraste real se mide sobre ese resultado.
const base = parsed.get("window.background") ?? parseColor("#000000", "base");
const opaqueBase = { r: base.r, g: base.g, b: base.b };

function composite(color, under = opaqueBase) {
  const a = color.a;
  return {
    r: Math.round(color.r * a + under.r * (1 - a)),
    g: Math.round(color.g * a + under.g * (1 - a)),
    b: Math.round(color.b * a + under.b * (1 - a))
  };
}

function channel(value) {
  const s = value / 255;
  return s <= 0.04045 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
}

function luminance({ r, g, b }) {
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
}

function contrast(fg, bg) {
  const l1 = luminance(fg);
  const l2 = luminance(bg);
  return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
}

const editorBg = composite(parsed.get("editor.background"), opaqueBase);
const tokenChecks = [];
function checkText(label, fgKey, bgKey, minimum) {
  const fg = parsed.get(fgKey);
  const bg = parsed.get(bgKey);
  if (!fg || !bg) return;
  const ratio = contrast(composite(fg, editorBg), composite(bg, opaqueBase));
  tokenChecks.push({ label, fgKey, bgKey, ratio, minimum });
  if (ratio < minimum) problems.push(`${label}: ${ratio.toFixed(2)}:1 < ${minimum}:1 (${fgKey} sobre ${bgKey})`);
}

// Texto de sintaxis y de interfaz: piso 4.5:1 (WCAG AA texto normal).
// Los valores salen del propio tema (tokenColors por nombre), no de una copia.
const tokenNames = [
  "Comment",
  "String",
  "Number",
  "Keyword",
  "Operator",
  "Type and namespace",
  "Function",
  "Variable",
  "Parameter",
  "Punctuation",
  "Tag",
  "Attribute",
  "Markup link",
  "Invalid"
];
for (const name of tokenNames) {
  const token = (theme.tokenColors ?? []).find((entry) => entry.name === name);
  const hex = token?.settings?.foreground;
  if (!hex) {
    problems.push(`tokenColors no tiene el grupo "${name}" con foreground`);
    continue;
  }
  const fg = parseColor(hex, `token ${name}`);
  if (!fg) continue;
  const ratio = contrast(composite(fg, editorBg), editorBg);
  tokenChecks.push({ label: `token ${name}`, fgKey: hex, bgKey: "editor.background", ratio, minimum: 4.5 });
  if (ratio < 4.5) problems.push(`token ${name}: ${ratio.toFixed(2)}:1 < 4.5:1 (${hex} sobre editor.background)`);
}

checkText("texto del editor", "editor.foreground", "editor.background", 7);
checkText("barra lateral", "sideBar.foreground", "sideBar.background", 4.5);
checkText("barra de estado", "statusBar.foreground", "statusBar.background", 4.5);
checkText("pestana activa", "tab.activeForeground", "tab.activeBackground", 4.5);
checkText("pestana inactiva", "tab.inactiveForeground", "editorGroupHeader.tabsBackground", 4.5);
checkText("seleccion de lista", "list.activeSelectionForeground", "list.activeSelectionBackground", 4.5);
checkText("entrada", "input.foreground", "input.background", 4.5);
checkText("placeholder", "input.placeholderForeground", "input.background", 4.5);
checkText("menu", "menu.foreground", "menu.background", 4.5);
checkText("boton", "button.foreground", "button.background", 4.5);
checkText("terminal", "terminal.foreground", "terminal.background", 4.5);
checkText("numero de linea", "editorLineNumber.foreground", "editor.background", 4.5);
checkText("numero de linea activo", "editorLineNumber.activeForeground", "editor.background", 4.5);

// Superficies: alfa entre 0.80 y 1.00 para que no se lave la legibilidad.
for (const key of ["editor.background", "sideBar.background", "panel.background", "terminal.background", "statusBar.background"]) {
  const c = parsed.get(key);
  if (!c) continue;
  if (c.a < 0.8) problems.push(`${key}: alfa ${c.a.toFixed(2)} < 0.80 (superficie demasiado transparente)`);
  if (c.a === 1) warnings.push(`${key} es opaca: el tema se lee como solido, no traslucido`);
}

// Un solo acento dominante de marca: el dorado. Aviso si el rojo/verde copan
// demasiadas superficies de UI (no cuentan estados semanticos ni terminal).
const accentSurfaces = Object.entries(colors)
  .filter(([key]) => /^(button|badge|progressBar|statusBarItem\.prominent|tab\.activeBorderTop)/.test(key))
  .map(([key, value]) => [key, value.toUpperCase()]);
const goldSurfaces = accentSurfaces.filter(([, value]) => value.startsWith("#D2A94F") || value.startsWith("#E8C87E"));
if (accentSurfaces.length > 0 && goldSurfaces.length === 0) {
  warnings.push("ninguna superficie de acento usa el dorado de marca");
}

if (problems.length === 0) {
  console.log(`OK  ${themePath}`);
  console.log(`    ${parsed.size} colores, ${Object.keys(theme.tokenColors ?? {}).length} grupos de tokenColors, ${Object.keys(theme.semanticTokenColors ?? {}).length} tokens semanticos`);
  for (const check of tokenChecks) {
    console.log(`    ${check.ratio.toFixed(2).padStart(6)}:1  >= ${check.minimum}  ${check.label}`);
  }
  if (warnings.length) {
    console.log("");
    for (const warning of warnings) console.log(`AVISO  ${warning}`);
  }
} else {
  console.error(`FALLA  ${themePath}`);
  for (const problem of problems) console.error(`    ${problem}`);
  process.exitCode = 1;
}
