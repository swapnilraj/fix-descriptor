#!/usr/bin/env node
import { spawnSync } from "child_process";
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

process.exit(result.status ?? 1);
