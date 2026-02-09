#!/usr/bin/env node
import { spawnSync } from "child_process";
import { copyFileSync, mkdirSync, readdirSync } from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const root = path.resolve(__dirname, "..");
const sbeDir = path.join(root, "simple-binary-encoding");

const result = spawnSync("./gradlew", [":sbe-all:jar"], {
  stdio: "inherit",
  cwd: sbeDir,
  shell: process.platform === "win32",
});

if (result.status !== 0) {
  process.exit(result.status ?? 1);
}

const libsDir = path.join(sbeDir, "sbe-all", "build", "libs");
const jarName = readdirSync(libsDir).find((name) => name.startsWith("sbe-all-") && name.endsWith(".jar"));
if (!jarName) {
  console.error("[build-sbe-jar] sbe-all jar not found in", libsDir);
  process.exit(1);
}

const outDir = path.join(root, "lib");
mkdirSync(outDir, { recursive: true });
const outPath = path.join(outDir, "sbe-all.jar");
copyFileSync(path.join(libsDir, jarName), outPath);
console.log("[build-sbe-jar] copied jar to", outPath);
