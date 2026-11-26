#!/usr/bin/env node
// Genera assets/preview.html: una maqueta de VS Code pintada con los valores
// reales del tema. Sirve para revisar direccion visual y contraste sin abrir
// el editor. No es un screenshot de VS Code; es una verificacion intermedia.
// Uso: node scripts/preview.mjs  ->  assets/preview.html

import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const theme = JSON.parse(await readFile(resolve(root, "themes/phantom-plus-color-theme.json"), "utf8"));
const colors = theme.colors;

const rgba = (hex) => {
  const value = hex.replace("#", "");
  const r = parseInt(value.slice(0, 2), 16);
  const g = parseInt(value.slice(2, 4), 16);
  const b = parseInt(value.slice(4, 6), 16);
  const a = value.length === 8 ? parseInt(value.slice(6, 8), 16) / 255 : 1;
  return `rgba(${r}, ${g}, ${b}, ${a.toFixed(3)})`;
};
const c = (key) => rgba(colors[key]);

const token = (name) => {
  const entry = (theme.tokenColors ?? []).find((item) => item.name === name);
  return entry?.settings?.foreground ?? colors["editor.foreground"];
};
const t = (name) => rgba(token(name));

const html = `<!doctype html>
<html lang="es">
<head>
<meta charset="utf-8">
<title>PhantomPlus — vista previa del tema</title>
<style>
  :root {
    --ink: ${c("window.background")};
    --fg: ${c("editor.foreground")};
    --muted: ${c("descriptionForeground")};
    --gold: ${rgba("#E8C87E")};
    --gold-deep: ${rgba("#D2A94F")};
    --silver: ${c("editor.foreground")};
    --emerald: ${rgba("#5FD3A4")};
    --ruby: ${rgba("#F2788D")};
    --stroke: ${rgba("#C9CED81F")};
    --stroke-strong: ${rgba("#C9CED833")};
  }
  * { box-sizing: border-box; }
  html, body { height: 100%; margin: 0; }
  body {
    background: var(--ink);
    color: var(--fg);
    font-family: "Segoe UI", system-ui, sans-serif;
    font-size: 13px;
    display: grid;
    place-items: center;
    padding: 24px;
  }
  .window {
    width: 1200px;
    height: 760px;
    display: grid;
    grid-template-rows: 34px 1fr 24px;
    grid-template-columns: 48px 248px 1fr;
    grid-template-areas: "title title title" "activity side editor" "status status status";
    overflow: hidden;
    border: 1px solid var(--stroke-strong);
    border-radius: 10px;
    box-shadow: 0 24px 60px rgba(5, 4, 8, 0.65);
    background: var(--ink);
  }
  .titlebar {
    grid-area: title;
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 0 12px;
    background: ${c("titleBar.activeBackground")};
    color: ${c("titleBar.activeForeground")};
    border-bottom: 1px solid ${c("titleBar.border")};
    font-size: 12px;
    letter-spacing: 0.02em;
  }
  .titlebar .dots { display: flex; gap: 6px; }
  .titlebar .dots i { width: 9px; height: 9px; border: 1px solid var(--stroke-strong); border-radius: 50%; }
  .titlebar .center { flex: 1; text-align: center; color: ${rgba("#CBBFA8")}; }
  .titlebar .right { color: var(--muted); }
  .activity {
    grid-area: activity;
    background: ${c("activityBar.background")};
    border-right: 1px solid ${c("activityBar.border")};
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 18px;
    padding: 12px 0;
  }
  .activity svg { width: 18px; height: 18px; stroke: ${c("activityBar.inactiveForeground")}; fill: none; stroke-width: 1.3; }
  .activity .on { stroke: ${c("activityBar.foreground")}; }
  .activity .badge {
    position: relative;
    width: 26px; height: 26px;
    display: grid; place-items: center;
    background: ${c("activityBar.activeBackground")};
    border-left: 1px solid var(--gold-deep);
  }
  .activity .badge::after {
    content: "2";
    position: absolute; top: -4px; right: -6px;
    min-width: 14px; height: 14px;
    border-radius: 7px;
    background: ${c("activityBarBadge.background")};
    color: ${c("activityBarBadge.foreground")};
    font-size: 9px; line-height: 14px; text-align: center; font-weight: 600;
  }
  .sidebar {
    grid-area: side;
    background: ${c("sideBar.background")};
    border-right: 1px solid ${c("sideBar.border")};
    display: flex; flex-direction: column;
    min-width: 0;
  }
  .side-head {
    height: 30px; display: flex; align-items: center; justify-content: space-between;
    padding: 0 12px;
    font-size: 10px; letter-spacing: 0.14em; text-transform: uppercase;
    color: ${c("sideBarSectionHeader.foreground")};
    background: ${c("sideBarSectionHeader.background")};
    border-bottom: 1px solid ${c("sideBarSectionHeader.border")};
  }
  .tree { padding: 6px 0; font-size: 12.5px; }
  .row {
    height: 24px; display: flex; align-items: center; gap: 7px;
    padding: 0 12px; color: ${c("sideBar.foreground")};
    white-space: nowrap;
  }
  .row .caret { width: 10px; color: var(--muted); font-size: 9px; }
  .row.indent { padding-left: 30px; }
  .row.sel { background: ${c("list.activeSelectionBackground")}; color: ${c("list.activeSelectionForeground")}; }
  .row .name { flex: 1; overflow: hidden; text-overflow: ellipsis; }
  .row .state { font-size: 11px; }
  .added { color: ${c("gitDecoration.addedResourceForeground")}; }
  .modified { color: ${c("gitDecoration.modifiedResourceForeground")}; }
  .deleted { color: ${c("gitDecoration.deletedResourceForeground")}; }
  .ignored { color: ${c("gitDecoration.ignoredResourceForeground")}; }
  .editor { grid-area: editor; display: flex; flex-direction: column; min-width: 0; background: ${c("editor.background")}; }
  .tabs {
    height: 36px; display: flex; align-items: stretch;
    background: ${c("editorGroupHeader.tabsBackground")};
    border-bottom: 1px solid ${c("editorGroupHeader.tabsBorder")};
  }
  .tab {
    display: flex; align-items: center; gap: 8px;
    padding: 0 16px; font-size: 12.5px;
    color: ${c("tab.inactiveForeground")};
    background: ${c("tab.inactiveBackground")};
    border-right: 1px solid ${c("tab.border")};
  }
  .tab.active {
    color: ${c("tab.activeForeground")};
    background: ${c("tab.activeBackground")};
    border-top: 1px solid ${c("tab.activeBorderTop")};
  }
  .tab .dot { width: 7px; height: 7px; border-radius: 50%; background: ${c("tab.activeModifiedBorder")}; }
  .tab .lang { color: ${rgba("#E7D2A6")}; }
  .breadcrumb {
    height: 26px; display: flex; align-items: center; gap: 6px;
    padding: 0 14px; font-size: 11.5px;
    color: ${c("breadcrumb.foreground")};
    background: ${c("breadcrumb.background")};
    border-bottom: 1px solid var(--stroke);
  }
  .breadcrumb .last { color: ${c("breadcrumb.activeSelectionForeground")}; }
  .breadcrumb .sep { color: ${rgba("#6F687E")}; }
  .code { flex: 1; padding: 10px 0 0; overflow: hidden; font-size: 13px; line-height: 22px; }
  .line { display: flex; white-space: pre; }
  .ln {
    width: 58px; flex: none; text-align: right; padding-right: 18px;
    color: ${c("editorLineNumber.foreground")}; font-variant-numeric: tabular-nums;
  }
  .line.current { background: ${c("editor.lineHighlightBackground")}; }
  .line.current .ln { color: ${c("editorLineNumber.activeForeground")}; }
  .src { font-family: "Cascadia Code", "Consolas", monospace; font-size: 12.6px; }
  .src .kw { color: ${t("Keyword")}; }
  .src .st { color: ${t("String")}; }
  .src .nu { color: ${t("Number")}; }
  .src .fn { color: ${t("Function")}; }
  .src .ty { color: ${t("Type and namespace")}; }
  .src .vr { color: ${t("Variable")}; }
  .src .pr { color: ${t("Property and object key")}; }
  .src .op { color: ${t("Operator")}; }
  .src .pu { color: ${t("Punctuation")}; }
  .src .cm { color: ${t("Comment")}; font-style: italic; }
  .src .tg { color: ${t("Tag")}; }
  .find {
    position: absolute; top: 70px; right: 22px; width: 300px;
    background: ${c("editorWidget.background")};
    border: 1px solid ${c("editorWidget.border")};
    border-radius: 6px;
    padding: 8px;
    display: grid; grid-template-columns: 1fr auto auto; gap: 6px; align-items: center;
    box-shadow: 0 10px 24px ${rgba("#050408A6")};
  }
  .find input {
    background: ${c("input.background")};
    border: 1px solid ${c("input.border")};
    border-radius: 3px;
    color: ${c("input.foreground")};
    font: inherit; padding: 3px 7px; outline: none;
  }
  .find .count { font-size: 11px; color: var(--muted); }
  .editor { position: relative; }
  .status {
    grid-area: status;
    display: flex; align-items: center; gap: 14px;
    padding: 0 12px; font-size: 11.5px;
    background: ${c("statusBar.background")};
    color: ${c("statusBar.foreground")};
    border-top: 1px solid ${c("statusBar.border")};
  }
  .status .spacer { flex: 1; }
  .status .branch { color: ${rgba("#CBBFA8")}; }
  .status .err { color: ${c("statusBarItem.errorForeground")}; background: ${c("statusBarItem.errorBackground")}; padding: 0 6px; border-radius: 3px; }
  .status .warn { color: ${c("statusBarItem.warningForeground")}; background: ${c("statusBarItem.warningBackground")}; padding: 0 6px; border-radius: 3px; }
  .status .theme { color: ${c("statusBarItem.prominentForeground")}; }
  .caps { letter-spacing: 0.08em; }
</style>
</head>
<body>
<div class="window">
  <div class="titlebar">
    <span class="dots"><i></i><i></i><i></i></span>
    <span class="center">index.ts — phantom-plus</span>
    <span class="right">PhantomPlus</span>
  </div>

  <div class="activity">
    <span class="badge"><svg viewBox="0 0 16 16" class="on"><path d="M3 1.5h6l4 4v9h-10z"/><path d="M9 1.5v4h4"/></svg></span>
    <svg viewBox="0 0 16 16"><circle cx="7" cy="7" r="4.2"/><path d="M10.2 10.2 14 14"/></svg>
    <svg viewBox="0 0 16 16"><circle cx="4" cy="3.5" r="1.6"/><circle cx="12" cy="3.5" r="1.6"/><circle cx="8" cy="12.5" r="1.6"/><path d="M4 5.1v2.4a2 2 0 0 0 2 2h4a2 2 0 0 0 2-2V5.1M8 9.5v1.4"/></svg>
    <svg viewBox="0 0 16 16"><path d="M5 3.5 12 8l-7 4.5z"/></svg>
    <svg viewBox="0 0 16 16"><rect x="2" y="2" width="5" height="5" rx="1"/><rect x="9" y="2" width="5" height="5" rx="1"/><rect x="2" y="9" width="5" height="5" rx="1"/><rect x="9" y="9" width="5" height="5" rx="1"/></svg>
  </div>

  <div class="sidebar">
    <div class="side-head"><span>Explorer</span><span>···</span></div>
    <div class="tree">
      <div class="row"><span class="caret">▾</span><span class="name">PHANTOMPLUS</span></div>
      <div class="row indent"><span class="caret"></span><span class="name">themes</span></div>
      <div class="row indent" style="padding-left:46px"><span class="caret"></span><span class="name">phantom-plus-color-theme.json</span><span class="state modified">M</span></div>
      <div class="row indent"><span class="caret">▾</span><span class="name">scripts</span></div>
      <div class="row indent" style="padding-left:46px"><span class="caret"></span><span class="name">validate-theme.mjs</span><span class="state added">A</span></div>
      <div class="row indent" style="padding-left:46px"><span class="caret"></span><span class="name">preview.mjs</span><span class="state added">A</span></div>
      <div class="row indent"><span class="caret"></span><span class="name">package.json</span><span class="state modified">M</span></div>
      <div class="row indent"><span class="caret"></span><span class="name">README.md</span><span class="state"></span></div>
      <div class="row indent"><span class="caret"></span><span class="name">CHANGELOG.md</span><span class="state"></span></div>
      <div class="row indent"><span class="caret"></span><span class="name">assets</span></div>
      <div class="row indent" style="padding-left:46px"><span class="caret"></span><span class="name">preview-shot.png</span><span class="state ignored">ignored</span></div>
      <div class="row sel"><span class="caret"></span><span class="name">index.ts</span><span class="state">●</span></div>
    </div>
  </div>

  <div class="editor">
    <div class="tabs">
      <div class="tab active"><span class="lang">TS</span><span>index.ts</span><span class="dot"></span><span>×</span></div>
      <div class="tab"><span class="lang">TS</span><span>phantom.ts</span></div>
      <div class="tab"><span class="lang">MD</span><span>README.md</span></div>
    </div>
    <div class="breadcrumb"><span>src</span><span class="sep">›</span><span>theme</span><span class="sep">›</span><span class="last">index.ts</span><span class="sep">›</span><span>phantom</span></div>

    <div class="find">
      <input value="phantom" readonly>
      <span class="count">1 of 3</span>
      <span class="count">Aa</span>
    </div>

    <div class="code src">
      <div class="line"><span class="ln">1</span><span><span class="cm">// Vidrio ahumado: el fondo nunca compite con la letra.</span></span></div>
      <div class="line"><span class="ln">2</span><span><span class="kw">import</span> <span class="pu">{</span> <span class="fn">defineTheme</span> <span class="pu">}</span> <span class="kw">from</span> <span class="st">"@phantom/core"</span><span class="pu">;</span></span></div>
      <div class="line"><span class="ln">3</span><span></span></div>
      <div class="line"><span class="ln">4</span><span><span class="kw">interface</span> <span class="ty">Palette</span> <span class="pu">{</span></span></div>
      <div class="line"><span class="ln">5</span><span>  <span class="pr">gold</span><span class="pu">:</span> <span class="ty">string</span><span class="pu">;</span></span></div>
      <div class="line"><span class="ln">6</span><span>  <span class="pr">silver</span><span class="pu">:</span> <span class="ty">string</span><span class="pu">;</span></span></div>
      <div class="line"><span class="ln">7</span><span>  <span class="pr">emerald</span><span class="pu">:</span> <span class="ty">string</span><span class="pu">;</span></span></div>
      <div class="line"><span class="ln">8</span><span>  <span class="pr">ruby</span><span class="pu">:</span> <span class="ty">string</span><span class="pu">;</span></span></div>
      <div class="line"><span class="ln">9</span><span><span class="pu">}</span></span></div>
      <div class="line"><span class="ln">10</span><span></span></div>
      <div class="line"><span class="ln">11</span><span><span class="kw">const</span> <span class="vr">palette</span><span class="pu">:</span> <span class="ty">Palette</span> <span class="op">=</span> <span class="pu">{</span></span></div>
      <div class="line current"><span class="ln">12</span><span>  <span class="pr">gold</span><span class="pu">:</span> <span class="st">"#E8C87E"</span><span class="pu">,</span></span></div>
      <div class="line"><span class="ln">13</span><span>  <span class="pr">silver</span><span class="pu">:</span> <span class="st">"#CFD4DF"</span><span class="pu">,</span></span></div>
      <div class="line"><span class="ln">14</span><span>  <span class="pr">emerald</span><span class="pu">:</span> <span class="st">"#5FD3A4"</span><span class="pu">,</span></span></div>
      <div class="line"><span class="ln">15</span><span>  <span class="pr">ruby</span><span class="pu">:</span> <span class="st">"#F2788D"</span><span class="pu">,</span></span></div>
      <div class="line"><span class="ln">16</span><span><span class="pu">};</span></span></div>
      <div class="line"><span class="ln">17</span><span></span></div>
      <div class="line"><span class="ln">18</span><span><span class="kw">export</span> <span class="kw">function</span> <span class="fn">phantom</span><span class="pu">(</span><span class="vr">accent</span><span class="pu">:</span> <span class="ty">string</span><span class="pu">):</span> <span class="ty">Palette</span> <span class="pu">{</span></span></div>
      <div class="line"><span class="ln">19</span><span>  <span class="kw">const</span> <span class="vr">alpha</span> <span class="op">=</span> <span class="vr">accent</span> <span class="op">===</span> <span class="vr">palette</span><span class="pu">.</span><span class="pr">ruby</span> <span class="op">?</span> <span class="nu">0.75</span> <span class="op">:</span> <span class="nu">0.9</span><span class="pu">;</span></span></div>
      <div class="line"><span class="ln">20</span><span>  <span class="kw">return</span> <span class="pu">{</span> <span class="op">...</span><span class="vr">palette</span><span class="pu">,</span> <span class="pr">gold</span><span class="pu">:</span> <span class="vr">accent</span> <span class="pu">};</span></span></div>
      <div class="line"><span class="ln">21</span><span><span class="pu">}</span></span></div>
      <div class="line"><span class="ln">22</span><span></span></div>
      <div class="line"><span class="ln">23</span><span><span class="kw">export</span> <span class="kw">default</span> <span class="fn">defineTheme</span><span class="pu">(</span><span class="st">"PhantomPlus"</span><span class="pu">,</span> <span class="vr">palette</span><span class="pu">);</span></span></div>
    </div>
  </div>

  <div class="status">
    <span class="branch">⑂ main*</span>
    <span class="caps">0</span>
    <span class="err">2 errors</span>
    <span class="warn">1 warning</span>
    <span class="spacer"></span>
    <span>Ln 12, Col 24</span>
    <span>UTF-8</span>
    <span>TypeScript</span>
    <span class="theme">PhantomPlus</span>
  </div>
</div>
</body>
</html>
`;

await mkdir(resolve(root, "assets"), { recursive: true });
const out = resolve(root, "assets/preview.html");
await writeFile(out, html, "utf8");
console.log(`OK  ${out}`);
