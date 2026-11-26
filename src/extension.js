"use strict";

// Opacidad real de la ventana en Windows: compila SetTransparency.cs con
// Add-Type y aplica WS_EX_LAYERED + SetLayeredWindowAttributes al proceso de
// VS Code. Portado de Russian Hacker Theme / GlassIt-VSC (MIT).
//
// Diferencias con el original:
// - solo actua mientras el tema activo es PhantomPlus
// - reaplica al cambiar de tema o editar phantomplus.alpha
// - restaurar a 255 no deja la ventana translucida

const vscode = require("vscode");
const { execFile } = require("child_process");

const ALPHA_MIN = 1;
const ALPHA_MAX = 255;
const ALPHA_DEFAULT = 240;
const SECTION = "phantomplus";

let lastApplied = null;

function clamp(value) {
  const number = Number(value);
  if (!Number.isFinite(number)) return ALPHA_DEFAULT;
  return Math.min(ALPHA_MAX, Math.max(ALPHA_MIN, Math.round(number)));
}

function config() {
  return vscode.workspace.getConfiguration(SECTION);
}

function currentAlpha() {
  return clamp(config().get("alpha", ALPHA_DEFAULT));
}

function stepSize() {
  return clamp(config().get("step", 5));
}

function isPhantomThemeActive() {
  const label = vscode.workspace.getConfiguration("workbench").get("colorTheme", "");
  return typeof label === "string" && label.toLowerCase().startsWith("phantomplus");
}

function applyAlpha(context, alpha) {
  alpha = clamp(alpha);
  return new Promise((resolve) => {
    if (process.platform !== "win32") {
      resolve({ ok: false, reason: "la opacidad de ventana solo esta implementada en Windows" });
      return;
    }

    const scriptPath = context.asAbsolutePath("src/glassit/SetTransparency.cs").replace(/'/g, "''");
    const command =
      `[Console]::OutputEncoding = [Text.Encoding]::UTF8; ` +
      `Add-Type -Path '${scriptPath}'; ` +
      `[GlassIt.SetTransparency]::ApplyTransparency(${process.pid}, [byte]${alpha})`;

    execFile(
      "powershell.exe",
      ["-NoProfile", "-ExecutionPolicy", "RemoteSigned", "-Command", command],
      { windowsHide: true },
      (error, stdout, stderr) => {
        if (error) {
          resolve({ ok: false, reason: (stderr || error.message || "").trim() });
          return;
        }
        if (String(stdout).trim() === "False") {
          resolve({ ok: false, reason: "no se encontro una ventana visible para aplicar el alfa" });
          return;
        }
        lastApplied = alpha;
        resolve({ ok: true });
      }
    );
  });
}

async function setAlpha(context, alpha, { persist = true, quiet = false } = {}) {
  alpha = clamp(alpha);
  const result = await applyAlpha(context, alpha);
  if (!result.ok) {
    if (!quiet) {
      vscode.window.showWarningMessage(`PhantomPlus: no se pudo aplicar la opacidad (${result.reason})`);
    }
    return result;
  }
  if (persist) {
    await config().update("alpha", alpha, vscode.ConfigurationTarget.Global);
  }
  if (!quiet) {
    vscode.window.setStatusBarMessage(`PhantomPlus: opacidad ${alpha}/255`, 2500);
  }
  return result;
}

function activate(context) {
  context.subscriptions.push(
    vscode.commands.registerCommand("phantomplus.transparency.increase", () =>
      setAlpha(context, currentAlpha() - stepSize())
    ),
    vscode.commands.registerCommand("phantomplus.transparency.decrease", () =>
      setAlpha(context, currentAlpha() + stepSize())
    ),
    vscode.commands.registerCommand("phantomplus.transparency.opaque", () =>
      setAlpha(context, ALPHA_MAX)
    ),

    vscode.window.onDidChangeActiveColorTheme(() => {
      if (isPhantomThemeActive()) {
        setAlpha(context, currentAlpha(), { persist: false, quiet: true });
      } else if (lastApplied !== null && lastApplied !== ALPHA_MAX) {
        // Al salir del tema, la ventana vuelve a ser opaca.
        setAlpha(context, ALPHA_MAX, { persist: false, quiet: true });
      }
    }),

    vscode.workspace.onDidChangeConfiguration((event) => {
      if (!event.affectsConfiguration(`${SECTION}.alpha`) || !isPhantomThemeActive()) {
        return;
      }
      const next = currentAlpha();
      if (next !== lastApplied) {
        setAlpha(context, next, { persist: false, quiet: true });
      }
    })
  );

  if (isPhantomThemeActive()) {
    setAlpha(context, currentAlpha(), { persist: false, quiet: true });
  }
}

function deactivate() {}

module.exports = { activate, deactivate };
