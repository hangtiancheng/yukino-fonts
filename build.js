#!/usr/bin/env node

import { exec as _exec, spawn as _spawn } from "node:child_process";
import { rm, copyFile, cp, access, stat } from "node:fs/promises";
import { resolve, join } from "node:path";
import { promisify } from "node:util";

const execAsync = promisify(_exec);

const PROJECT_ROOT = resolve(import.meta.dirname);

const IOSEVKA_DIR = join(PROJECT_ROOT, "Iosevka");

const BUILD_CONFIG = join(PROJECT_ROOT, "build.toml");

const DEST_DIR = join(PROJECT_ROOT, "src", "Yukino");

const REPO_URL = "git@github.com:be5invis/Iosevka.git";

const BUILD_TARGET = "contents::Yukino";

async function execute(command, options = {}) {
  const { cwd, silent = false, timeout } = options;

  try {
    const { stdout, stderr } = await execAsync(command, {
      cwd,
      timeout,
      maxBuffer: 10 * 1024 * 1024,
    });
    return { stdout: String(stdout), stderr: String(stderr) };
  } catch (error) {
    if (!silent) {
      const stderr = error.stderr ? String(error.stderr).trim() : "";
      const message = stderr || error.message || "Unknown error";
      console.error(`  Command failed: ${command}`);
      console.error(`  ${message}`);
    }
    throw error;
  }
}

function spawn(command, args, options = {}) {
  const { cwd } = options;

  return new Promise((res, rej) => {
    const child = _spawn(command, args, {
      cwd,
      stdio: "inherit",
      shell: process.platform === "win32",
    });

    child.on("error", rej);
    child.on("close", (code) => {
      if (code === 0) {
        res();
      } else {
        rej(
          new Error(`'${command} ${args.join(" ")}' exited with code ${code}`),
        );
      }
    });
  });
}

async function pathExists(targetPath) {
  try {
    await access(targetPath);
    return true;
  } catch {
    return false;
  }
}

async function isDirectory(targetPath) {
  try {
    const info = await stat(targetPath);
    return info.isDirectory();
  } catch {
    return false;
  }
}

async function removeDir(dirPath) {
  await rm(dirPath, { recursive: true, force: true });
}

async function copyDir(src, dest) {
  await cp(src, dest, { recursive: true });
}

function detectPlatform() {
  switch (process.platform) {
    case "darwin":
      return "mac";
    case "linux":
      return "linux";
    case "win32":
      return "windows";
    default:
      return "unknown";
  }
}

async function hasCommand(toolName) {
  const cmd =
    process.platform === "win32" ? `where ${toolName}` : `which ${toolName}`;

  try {
    await execute(cmd, { silent: true });
    return true;
  } catch {
    return false;
  }
}

async function isValidGitRepo(dirPath) {
  try {
    await execute("git rev-parse --git-dir", { cwd: dirPath, silent: true });
    return true;
  } catch {
    return false;
  }
}

async function prepareIosevka() {
  console.log("[1/5] Preparing Iosevka source...");

  const dirExists = await isDirectory(IOSEVKA_DIR);
  const isRepo = dirExists && (await isValidGitRepo(IOSEVKA_DIR));

  if (isRepo) {
    try {
      await execute("git checkout -- .", { cwd: IOSEVKA_DIR });
      await execute("git clean -fd", { cwd: IOSEVKA_DIR });
      await execute("git pull", { cwd: IOSEVKA_DIR });

      console.log("  Source updated successfully.");
      return;
    } catch {
      console.warn(
        "  Failed to update existing repository; falling back to a fresh clone.",
      );
    }
  }

  if (dirExists) {
    console.log("  Removing invalid Iosevka directory...");
    await removeDir(IOSEVKA_DIR);
  }

  console.log(`  Cloning from ${REPO_URL} (shallow)...`);
  await execute(`git clone ${REPO_URL} --depth=1`, { cwd: PROJECT_ROOT });
  console.log("  Clone completed.");
}

async function copyBuildConfig() {
  console.log("[2/5] Deploying build configuration...");

  const dest = join(IOSEVKA_DIR, "private-build-plans.toml");
  await copyFile(BUILD_CONFIG, dest);

  console.log(`  ${BUILD_CONFIG} -> ${dest}`);
}

async function cleanAndInstall() {
  console.log("  [npm] Removing stale build artifacts...");

  const distDir = join(IOSEVKA_DIR, "dist");
  const nodeModulesDir = join(IOSEVKA_DIR, "node_modules");

  await removeDir(distDir);
  await removeDir(nodeModulesDir);

  console.log("  [npm] Installing dependencies (this may take a while)...");
  await spawn("npm", ["install"], { cwd: IOSEVKA_DIR });

  console.log("  [npm] Dependencies installed.");
}

async function ensureTtfautohint() {
  const platform = detectPlatform();

  if (await hasCommand("ttfautohint")) {
    console.log("  [hint] ttfautohint is already installed.");
    return;
  }

  console.log("  [hint] ttfautohint not found on PATH.");

  switch (platform) {
    case "mac": {
      if (!(await hasCommand("brew"))) {
        throw new Error(
          "Homebrew is not installed. Visit https://brew.sh for installation instructions.",
        );
      }
      console.log("  [hint] Installing ttfautohint via Homebrew...");
      await execute("brew install ttfautohint");
      break;
    }

    case "linux": {
      console.log("  [hint] Installing ttfautohint via APT (sudo required)...");
      await spawn("sudo", ["apt-get", "install", "-y", "ttfautohint"]);
      break;
    }

    default:
      console.warn(
        "  [hint] Automatic installation is not supported on this platform.",
      );
      console.warn(
        "  [hint] Install ttfautohint manually to enable hinted font output.",
      );
      return;
  }

  console.log("  [hint] ttfautohint installed.");
}

async function runConcurrentSetup() {
  console.log("[3/5] Running concurrent setup tasks...");

  await Promise.all([cleanAndInstall(), ensureTtfautohint()]);
}

async function buildFont() {
  console.log(`[4/5] Building font variant: ${BUILD_TARGET}`);
  console.log("  This step may take several minutes...");

  await spawn("npm", ["run", "build", "--", BUILD_TARGET], {
    cwd: IOSEVKA_DIR,
  });

  console.log("  Font build completed.");
}

async function copyArtifacts() {
  console.log("[5/5] Collecting build artifacts...");

  const source = join(IOSEVKA_DIR, "dist", "Yukino");

  if (!(await isDirectory(source))) {
    throw new Error(
      `Build output directory not found: ${source}\n` +
        "  The font build may have failed silently. Check the output above for errors.",
    );
  }

  if (await pathExists(DEST_DIR)) {
    console.log("  Removing existing artifacts...");
    await removeDir(DEST_DIR);
  }

  console.log(`  ${source} -> ${DEST_DIR}`);
  await copyDir(source, DEST_DIR);

  console.log("  Artifacts copied.");
}

async function main() {
  const startTime = Date.now();

  console.log("=== Yukino Font Build Pipeline ===\n");

  await prepareIosevka();
  await copyBuildConfig();
  await runConcurrentSetup();
  await buildFont();
  await copyArtifacts();

  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);

  console.log("\n=== Build pipeline finished ===");
  console.log(`Total time: ${elapsed}s`);
}

main().catch((error) => {
  console.error("\nBuild pipeline failed:", error.message);
  process.exit(1);
});
