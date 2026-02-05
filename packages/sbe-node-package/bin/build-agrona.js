#!/usr/bin/env node
const { spawnSync } = require("child_process");
const path = require("path");

const root = path.resolve(__dirname, "..");
const tsconfig = path.join(root, "agrona-ts", "tsconfig.json");

const result = spawnSync("npx", ["tsc", "-p", tsconfig], {
  stdio: "inherit",
  cwd: root,
  shell: process.platform === "win32",
});

process.exit(result.status ?? 1);
