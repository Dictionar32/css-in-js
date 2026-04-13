#!/usr/bin/env node

import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");

const nativeManifestPath = path.join(root, "native", "Cargo.toml");
const nativeReleaseDir = path.join(root, "native", "target", "release");
const nativeNodeBinaryPath = path.join(root, "native", "tailwind_styled_parser.node");
const bindingsOutDir = path.join(root, "bindings", "c", "lib");
const cHeaderPath = path.join(root, "bindings", "c", "tailwind.h");

const isWindows = process.platform === "win32";

function run(command, args, options = {}) {
  return spawnSync(command, args, { stdio: "inherit", ...options });
}

function runCapture(command, args, options = {}) {
  return spawnSync(command, args, { encoding: "utf8", ...options });
}

function firstExisting(paths) {
  for (const entry of paths) {
    if (entry && fs.existsSync(entry)) return entry;
  }
  return null;
}

function whereFirstWindows(bin) {
  const out = runCapture("where", [bin], { stdio: "pipe" });
  if (out.status !== 0 || !out.stdout) return null;
  return (
    out.stdout
      .split(/\r?\n/)
      .map((line) => line.trim())
      .find(Boolean) ?? null
  );
}

function isMsvcToolchainActive() {
  const clPath = whereFirstWindows("cl.exe");
  const linkPath = whereFirstWindows("link.exe");
  if (!clPath || !linkPath) return false;

  const cl = clPath.toLowerCase();
  const link = linkPath.toLowerCase();
  return (
    cl.includes("\\microsoft visual studio\\") &&
    link.includes("\\microsoft visual studio\\")
  );
}

function findVsDevCmdViaVsWhere() {
  const programFilesX86 = process.env["ProgramFiles(x86)"] ?? "C:\\Program Files (x86)";
  const vswhere = path.join(
    programFilesX86,
    "Microsoft Visual Studio",
    "Installer",
    "vswhere.exe",
  );
  if (!fs.existsSync(vswhere)) return null;

  const out = runCapture(vswhere, [
    "-latest",
    "-products",
    "*",
    "-requires",
    "Microsoft.VisualStudio.Component.VC.Tools.x86.x64",
    "-find",
    "Common7\\Tools\\VsDevCmd.bat",
  ]);

  if (out.status !== 0 || !out.stdout) return null;
  const candidate = out.stdout
    .split(/\r?\n/)
    .map((line) => line.trim())
    .find(Boolean);
  return candidate && fs.existsSync(candidate) ? candidate : null;
}

function findVsDevCmd() {
  const fromEnv = process.env.VSINSTALLDIR
    ? path.join(process.env.VSINSTALLDIR, "Common7", "Tools", "VsDevCmd.bat")
    : null;

  const programFiles = process.env.ProgramFiles ?? "C:\\Program Files";
  const versions = ["18", "2022"];
  const editions = ["Enterprise", "Professional", "Community", "BuildTools"];
  const defaults = [];

  for (const version of versions) {
    for (const edition of editions) {
      defaults.push(
        path.join(
          programFiles,
          "Microsoft Visual Studio",
          version,
          edition,
          "Common7",
          "Tools",
          "VsDevCmd.bat",
        ),
      );
    }
  }

  return firstExisting([fromEnv, findVsDevCmdViaVsWhere(), ...defaults]);
}

function runCargo(cargoArgs) {
  // QA #29 fix: auto-bootstrap Rust on Linux/macOS if cargo not in PATH
  if (!isWindows) {
    const cargoInPath = runCapture("which", ["cargo"], { stdio: "pipe" }).status === 0
    if (!cargoInPath) {
      // Try common rustup installation paths
      const rustupCargoPaths = [
        path.join(os.homedir(), ".cargo", "bin", "cargo"),
        "/usr/local/cargo/bin/cargo",
        "/opt/homebrew/bin/cargo",
      ]
      const foundCargo = rustupCargoPaths.find(p => fs.existsSync(p))
      if (foundCargo) {
        console.log(`[native-tools] cargo not in PATH, using: ${foundCargo}`)
        return run(foundCargo, cargoArgs)
      }
      // Try to install via rustup
      const rustupInPath = runCapture("which", ["rustup"], { stdio: "pipe" }).status === 0
      if (!rustupInPath) {
        const rustupPath = path.join(os.homedir(), ".cargo", "bin", "rustup")
        if (!fs.existsSync(rustupPath)) {
          console.error(
            "[native-tools] Rust toolchain not found.\n" +
            "Install Rust: curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh\n" +
            "Then run: source ~/.cargo/env && npm run build:rust"
          )
          return { status: 1 }
        }
        // rustup exists but not in PATH — add to env
        const cargoHome = path.dirname(path.dirname(rustupPath))
        process.env.PATH = `${cargoHome}/bin:${process.env.PATH ?? ""}`
        const cargoViaRustup = path.join(cargoHome, "bin", "cargo")
        if (fs.existsSync(cargoViaRustup)) {
          console.log(`[native-tools] Using cargo from rustup: ${cargoViaRustup}`)
          return run(cargoViaRustup, cargoArgs)
        }
      }
    }
    return run("cargo", cargoArgs)
  }

  if (isMsvcToolchainActive()) {
    return run("cargo", cargoArgs)
  }

  const vsDevCmd = findVsDevCmd();
  if (!vsDevCmd) {
    console.error(
      "MSVC toolchain not active and VsDevCmd.bat not found. Install Visual Studio C++ Build Tools.",
    );
    return { status: 1 };
  }

  const tempCmdPath = path.join(
    os.tmpdir(),
    `native-tools-${Date.now()}-${process.pid}.cmd`,
  );
  const cmdBody = [
    "@echo off",
    `call "${vsDevCmd}" -arch=x64`,
    "if errorlevel 1 exit /b %errorlevel%",
    "cargo %*",
    "exit /b %errorlevel%",
  ].join("\r\n");

  fs.writeFileSync(tempCmdPath, cmdBody, "utf8");
  try {
    return run("cmd.exe", ["/c", tempCmdPath, ...cargoArgs]);
  } finally {
    try {
      fs.unlinkSync(tempCmdPath);
    } catch {
      // best effort cleanup
    }
  }
}

function resolveNativeArtifactPath() {
  const candidates = isWindows
    ? ["tailwind_styled_parser.dll", "libtailwind_styled_parser.dll"]
    : process.platform === "darwin"
      ? ["libtailwind_styled_parser.dylib", "tailwind_styled_parser.dylib"]
      : ["libtailwind_styled_parser.so", "tailwind_styled_parser.so"];

  for (const name of candidates) {
    const full = path.join(nativeReleaseDir, name);
    if (fs.existsSync(full)) return full;
  }
  return null;
}

function copyNativeNodeBinary() {
  const artifact = resolveNativeArtifactPath();
  if (!artifact) {
    console.error(`Native artifact not found in ${nativeReleaseDir}`);
    return 1;
  }

  fs.copyFileSync(artifact, nativeNodeBinaryPath);
  console.log(
    `Copied ${path.basename(artifact)} -> ${path.relative(root, nativeNodeBinaryPath)}`,
  );
  return 0;
}

function copyBindingsArtifacts() {
  const artifact = resolveNativeArtifactPath();
  if (!artifact) {
    console.error(`Native artifact not found in ${nativeReleaseDir}`);
    return 1;
  }
  if (!fs.existsSync(cHeaderPath)) {
    console.error(`C header not found: ${cHeaderPath}`);
    return 1;
  }

  fs.mkdirSync(bindingsOutDir, { recursive: true });
  fs.copyFileSync(artifact, path.join(bindingsOutDir, path.basename(artifact)));
  fs.copyFileSync(cHeaderPath, path.join(bindingsOutDir, "tailwind.h"));
  console.log(`Copied bindings artifacts -> ${path.relative(root, bindingsOutDir)}`);
  return 0;
}

function printUsage() {
  console.log(
    [
      "Usage: node scripts/native-tools.mjs <command>",
      "",
      "Commands:",
      "  build              Build native release + copy .node binary",
      "  test [extra...]    Run native cargo test",
      "  bindings           Build native release + copy C bindings artifacts",
      "  copy-node          Copy current native release artifact to .node",
      "  cargo <args...>    Run cargo with Windows MSVC auto-bootstrap",
    ].join("\n"),
  );
}

function runOrExit(status) {
  process.exit(status ?? 1);
}

const [command, ...restArgs] = process.argv.slice(2);

if (!command || command === "help" || command === "--help" || command === "-h") {
  printUsage();
  process.exit(0);
}

if (command === "cargo") {
  if (restArgs.length === 0) {
    printUsage();
    process.exit(1);
  }
  runOrExit(runCargo(restArgs).status);
}

if (command === "build") {
  const result = runCargo(["build", "--manifest-path", nativeManifestPath, "--release", ...restArgs]);
  if (result.status !== 0) runOrExit(result.status);
  runOrExit(copyNativeNodeBinary());
}

if (command === "test") {
  const result = runCargo(["test", "--manifest-path", nativeManifestPath, ...restArgs]);
  runOrExit(result.status);
}

if (command === "bindings") {
  const result = runCargo(["build", "--manifest-path", nativeManifestPath, "--release", ...restArgs]);
  if (result.status !== 0) runOrExit(result.status);
  runOrExit(copyBindingsArtifacts());
}

if (command === "copy-node") {
  runOrExit(copyNativeNodeBinary());
}

console.error(`Unknown command: ${command}`);
printUsage();
process.exit(1);
