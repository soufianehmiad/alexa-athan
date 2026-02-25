#!/usr/bin/env node
import { spawn } from "node:child_process";
import { cwd } from "node:process";

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
  console.log("[setup] Installing npm workspace dependencies...");
  await run("npm", ["install"], { cwd: cwd() });

  const swiftAvailable = await hasCommand("swift");
  if (swiftAvailable) {
    console.log("[setup] Resolving Swift package dependencies...");
    await run("swift", ["package", "resolve"], { cwd: "ios-app" });
  } else {
    console.log("[setup] Swift not found. Skipping iOS dependency resolution.");
  }

  console.log("[setup] Complete.");
}

main().catch((error) => {
  console.error(`[setup] Failed: ${error.message}`);
  process.exit(1);
});
