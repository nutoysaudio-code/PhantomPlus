#!/usr/bin/env node
// Renderiza assets/icon.svg a los PNG que pide el marketplace:
//   icons/icon.png      128x128
//   icons/icon@2x.png   256x256
// Usa Chrome headless (CHROME o las rutas habituales de Windows).
// Uso: node scripts/render-icon.mjs

import { mkdir, readFile, writeFile, rm } from "node:fs/promises";
import { existsSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { dirname, join, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const svg = await readFile(resolve(root, "assets/icon.svg"), "utf8");

const chromeCandidates = [
  process.env.CHROME,
  "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
  "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe",
  "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
  "C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe",
  "/usr/bin/google-chrome",
  "/usr/bin/chromium",
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
].filter(Boolean);
const chrome = chromeCandidates.find((candidate) => existsSync(candidate));
if (!chrome) fail("No encontre Chrome/Edge. Defini la variable CHROME con la ruta al ejecutable.");

await mkdir(resolve(root, "icons"), { recursive: true });
const workDir = resolve(root, "assets/.icon-render");
await mkdir(workDir, { recursive: true });

async function render(size) {
  const wrapper = join(workDir, `icon-${size}.html`);
  const html = `<!doctype html><html><head><meta charset="utf-8"><style>
    html,body{margin:0;padding:0;background:transparent;overflow:hidden}
    svg{display:block;width:${size}px;height:${size}px}
  </style></head><body>${svg.replace(/<svg([^>]*)width="256" height="256"/, `<svg$1width="${size}" height="${size}"`)}</body></html>`;
  await writeFile(wrapper, html, "utf8");
  const out = resolve(root, `icons/${size === 128 ? "icon.png" : `icon@${size / 128}x.png`}`);
  const result = spawnSync(chrome, [
    "--headless=new",
    "--disable-gpu",
    "--hide-scrollbars",
    "--force-device-scale-factor=1",
    "--default-background-color=00000000",
    `--window-size=${size},${size}`,
    `--screenshot=${out}`,
    pathToFileURL(wrapper).href
  ], { stdio: "pipe" });

  if (result.status !== 0 || !existsSync(out)) {
    fail(`Chrome fallo al renderizar ${size}px: ${result.stderr?.toString() ?? ""}`);
  }
  return out;
}

const one = await render(128);
const two = await render(256);
await rm(workDir, { recursive: true, force: true });
console.log(`OK  ${one}`);
console.log(`OK  ${two}`);

function fail(message) {
  console.error(`FALLA  ${message}`);
  process.exit(1);
}
