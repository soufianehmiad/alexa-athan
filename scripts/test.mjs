#!/usr/bin/env node
import { spawn } from "node:child_process";

function run(command, args, options = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      stdio: "inherit",
      shell: process.platform === "win32",
      ...options
    });

    child.on("close", (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`${command} ${args.join(" ")} failed with code ${code}`));
      }
    });
  });
}

function hasCommand(command) {
  return new Promise((resolve) => {
    const checker = process.platform === "win32" ? "where" : "which";
    const probe = spawn(checker, [command], { stdio: "ignore", shell: process.platform === "win32" });
    probe.on("close", (code) => resolve(code === 0));
  });
}

async function main() {
  console.log("[test] Running Node workspace tests...");
  await run("npm", ["--workspace", "core-prayer-engine", "run", "test"]);
  await run("npm", ["--workspace", "alexa-skill", "run", "test"]);

  const swiftAvailable = await hasCommand("swift");
  if (swiftAvailable) {
    console.log("[test] Running Swift package tests...");
    await run("swift", ["test"], { cwd: "ios-app" });
  } else {
    console.log("[test] Swift not found. Skipping iOS tests.");
  }

  console.log("[test] Complete.");
}

main().catch((error) => {
  console.error(`[test] Failed: ${error.message}`);
  process.exit(1);
});
