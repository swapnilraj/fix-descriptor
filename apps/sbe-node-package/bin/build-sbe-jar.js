#!/usr/bin/env node
const { spawnSync } = require("child_process");
const path = require("path");

const root = path.resolve(__dirname, "..");
const sbeDir = path.join(root, "simple-binary-encoding");

const result = spawnSync("./gradlew", [":sbe-all:jar"], {
  stdio: "inherit",
  cwd: sbeDir,
  shell: process.platform === "win32",
});

process.exit(result.status ?? 1);
