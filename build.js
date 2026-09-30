#!/usr/bin/env node


/**
 * @fileoverview Yukino Font Build Script
 *
 * Automates the end-to-end build pipeline for the Yukino typeface, a custom
 * variant of the Iosevka programming font. The pipeline consists of the
 * following sequential stages:
 *
 *   1. Prepare Iosevka source - pull updates or perform a fresh shallow clone.
 *   2. Copy build configuration - deploy the private build plan into Iosevka.
 *   3. Concurrent setup (parallel) - clean & install npm deps + ensure the
 *      `ttfautohint` binary is available on the system.
 *   4. Font compilation - invoke the Iosevka build toolchain for the Yukino
 *      variant.
 *   5. Artifact collection - copy the compiled font output into `src/Yukino`.
 *
 * @module build
 * @see {@link https://github.com/be5invis/Iosevka} Iosevka upstream repository
 */

import { exec as _exec, spawn as _spawn } from "node:child_process";
import { rm, copyFile, cp, access, stat } from "node:fs/promises";
import { resolve, join } from "node:path";
import { promisify } from "node:util";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/**
 * @typedef {Object} ExecResult
 * @property {string} stdout - Captured standard output.
 * @property {string} stderr - Captured standard error.
 */

/**
 * @typedef {Object} ExecOptions
 * @property {string}  [cwd]     - Working directory for the child process.
 * @property {boolean} [silent]  - Suppress stdout/stderr on failure when true.
 * @property {number}  [timeout] - Maximum execution time in milliseconds.
 */

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** @type {ReturnType<typeof promisify<typeof _exec>>} */
const execAsync = promisify(_exec);

/** Absolute path to the project root (directory containing this script). */
const PROJECT_ROOT = resolve(import.meta.dirname);

/** Absolute path to the Iosevka source checkout. */
const IOSEVKA_DIR = join(PROJECT_ROOT, "Iosevka");

/** Absolute path to the Yukino build configuration file. */
const BUILD_CONFIG = join(PROJECT_ROOT, "build.toml");

/** Absolute path to the font artifact destination directory. */
const DEST_DIR = join(PROJECT_ROOT, "src", "Yukino");

/** Upstream Iosevka repository URL (SSH). */
const REPO_URL = "git@github.com:be5invis/Iosevka.git";

/** Iosevka build target identifier. */
const BUILD_TARGET = "contents::Yukino";

// ---------------------------------------------------------------------------
// Shell Utilities
// ---------------------------------------------------------------------------

/**
 * Execute a shell command and return its captured output.
 *
 * Uses `child_process.exec` with default (utf-8) encoding. Stdout and stderr
 * are buffered and returned as strings. On failure the error is augmented with
 * the captured stderr for easier debugging unless `silent` is enabled.
 *
 * @param {string} command - The shell command to execute.
 * @param {ExecOptions} [options] - Optional execution parameters.
 * @returns {Promise<ExecResult>} Resolves with captured stdout and stderr.
 * @throws {Error} When the command exits with a non-zero status code.
 */
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

/**
 * Spawn a child process with inherited stdio for real-time terminal output.
 *
 * Unlike {@link execute}, this function streams stdout and stderr directly to
 * the parent process, which is essential for long-running commands where the
 * user needs to observe progress (e.g. font compilation, npm install).
 *
 * @param {string}   command - The command to execute.
 * @param {string[]} args    - Command-line arguments.
 * @param {Object}   [options]
 * @param {string}   [options.cwd] - Working directory for the child process.
 * @returns {Promise<void>} Resolves when the process exits with code 0.
 * @throws {Error} When the process exits with a non-zero code or fails to start.
 */
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

// ---------------------------------------------------------------------------
// Filesystem Utilities
// ---------------------------------------------------------------------------

/**
 * Test whether a path exists on the filesystem.
 *
 * @param {string} targetPath - Absolute or relative path to check.
 * @returns {Promise<boolean>} True if the path exists, false otherwise.
 */
async function pathExists(targetPath) {
  try {
    await access(targetPath);
    return true;
  } catch {
    return false;
  }
}

/**
 * Test whether a path exists and is a directory (not a file or symlink to file).
 *
 * @param {string} targetPath - Path to validate.
 * @returns {Promise<boolean>} True if the path is an existing directory.
 */
async function isDirectory(targetPath) {
  try {
    const info = await stat(targetPath);
    return info.isDirectory();
  } catch {
    return false;
  }
}

/**
 * Recursively remove a directory and all of its contents.
 *
 * Wraps `fs.rm` with `{ recursive: true, force: true }`. No-ops silently if
 * the target does not exist.
 *
 * @param {string} dirPath - Absolute path to the directory to remove.
 * @returns {Promise<void>}
 */
async function removeDir(dirPath) {
  await rm(dirPath, { recursive: true, force: true });
}

/**
 * Recursively copy a directory tree from source to destination.
 *
 * Uses `fs.cp` with `{ recursive: true }` (Node.js >= 16.7.0). The
 * destination is created automatically, including any missing parent
 * directories.
 *
 * @param {string} src - Source directory path.
 * @param {string} dest - Destination directory path.
 * @returns {Promise<void>}
 */
async function copyDir(src, dest) {
  await cp(src, dest, { recursive: true });
}

// ---------------------------------------------------------------------------
// Platform Detection
// ---------------------------------------------------------------------------

/**
 * Supported host operating systems for platform-specific logic.
 *
 * - `mac`     - macOS (Darwin).
 * - `linux`   - Linux distributions.
 * - `windows` - Windows (unsupported by this script).
 * - `unknown` - Unrecognized platform.
 *
 * @typedef {'mac' | 'linux' | 'windows' | 'unknown'} Platform
 */

/**
 * Detect the current host operating system.
 *
 * @returns {Platform} Normalized platform identifier.
 */
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

/**
 * Check whether a CLI tool is available on the system PATH.
 *
 * Uses `which` on Unix-like systems and `where` on Windows. The check is
 * performed silently; failures are suppressed and reported as `false`.
 *
 * @param {string} toolName - Name of the executable to locate (e.g. "brew").
 * @returns {Promise<boolean>} True if the tool is found on PATH.
 */
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

// ---------------------------------------------------------------------------
// Stage 1: Prepare Iosevka Source
// ---------------------------------------------------------------------------

/**
 * Verify that a directory is a valid Git repository.
 *
 * Runs `git rev-parse --git-dir` inside the target directory. The command
 * succeeds only when the directory is (or is inside) a Git working tree.
 *
 * @param {string} dirPath - Path to the directory to validate.
 * @returns {Promise<boolean>} True if the directory is a valid Git repository.
 */
async function isValidGitRepo(dirPath) {
  try {
    await execute("git rev-parse --git-dir", { cwd: dirPath, silent: true });
    return true;
  } catch {
    return false;
  }
}

/**
 * Ensure a local Iosevka source checkout is available and up to date.
 *
 * Resolution strategy:
 *
 *   - If `Iosevka/` exists and is a valid Git repository, discard all local
 *     modifications (both tracked and untracked files) and pull the latest
 *     changes from the remote.
 *
 *   - If the directory is missing, is not a valid Git repo, or any Git
 *     operation fails, remove the directory entirely and perform a fresh
 *     shallow clone (`--depth=1`) from the upstream repository.
 *
 * @returns {Promise<void>}
 * @throws {Error} When the fresh clone also fails (e.g. network or SSH issue).
 */
async function prepareIosevka() {
  console.log("[1/5] Preparing Iosevka source...");

  const dirExists = await isDirectory(IOSEVKA_DIR);
  const isRepo = dirExists && (await isValidGitRepo(IOSEVKA_DIR));

  if (isRepo) {
    try {
      // Discard tracked file modifications
      await execute("git checkout -- .", { cwd: IOSEVKA_DIR });
      // Remove untracked files and directories
      await execute("git clean -fd", { cwd: IOSEVKA_DIR });
      // Fetch and merge latest changes from the remote
      await execute("git pull", { cwd: IOSEVKA_DIR });

      console.log("  Source updated successfully.");
      return;
    } catch {
      console.warn(
        "  Failed to update existing repository; falling back to a fresh clone.",
      );
    }
  }

  // The directory is either missing or unusable - start over with a clean clone
  if (dirExists) {
    console.log("  Removing invalid Iosevka directory...");
    await removeDir(IOSEVKA_DIR);
  }

  console.log(`  Cloning from ${REPO_URL} (shallow)...`);
  await execute(`git clone ${REPO_URL} --depth=1`, { cwd: PROJECT_ROOT });
  console.log("  Clone completed.");
}

// ---------------------------------------------------------------------------
// Stage 2: Deploy Build Configuration
// ---------------------------------------------------------------------------

/**
 * Copy the Yukino build plan into the Iosevka source tree.
 *
 * Copies `build.toml` from the project root to
 * `Iosevka/private-build-plans.toml`, which is the configuration file read
 * by the Iosevka build toolchain to determine which font variants to compile.
 *
 * @returns {Promise<void>}
 * @throws {Error} When the source configuration file (`build.toml`) is missing
 *   or the copy operation fails.
 */
async function copyBuildConfig() {
  console.log("[2/5] Deploying build configuration...");

  const dest = join(IOSEVKA_DIR, "private-build-plans.toml");
  await copyFile(BUILD_CONFIG, dest);

  console.log(`  ${BUILD_CONFIG} -> ${dest}`);
}

// ---------------------------------------------------------------------------
// Stage 3: Concurrent Setup (npm install + ttfautohint)
// ---------------------------------------------------------------------------

/**
 * Clean previous build artifacts and install Iosevka's npm dependencies.
 *
 * Performs the following operations sequentially inside the Iosevka directory:
 *
 *   1. Remove the `dist/` directory if it exists (stale build output).
 *   2. Remove `node_modules/` if it exists (stale or incompatible dependencies).
 *   3. Run `npm install` to fetch and install all required packages.
 *
 * @returns {Promise<void>}
 * @throws {Error} When `npm install` fails or directory removal encounters
 *   an unrecoverable error.
 */
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

/**
 * Ensure the `ttfautohint` binary is available on the system.
 *
 * `ttfautohint` is an optional dependency used by Iosevka to produce hinted
 * TrueType fonts with improved rendering on low-resolution screens.
 *
 * Platform-specific behavior:
 *
 *   - macOS:   Installs via Homebrew (`brew install ttfautohint`) if absent.
 *   - Linux:   Installs via APT (`sudo apt install -y ttfautohint`) if absent.
 *              Requires passwordless sudo or prior authentication.
 *   - Windows / other: Skips installation with a warning. Hinted font output
 *              will not be available.
 *
 * @returns {Promise<void>}
 * @throws {Error} When the package manager is unavailable or installation fails.
 */
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

/**
 * Run independent setup tasks concurrently using `Promise.all`.
 *
 * Executes the following tasks in parallel:
 *
 *   - {@link cleanAndInstall} - Clean artifacts and install npm dependencies.
 *   - {@link ensureTtfautohint} - Verify or install the font hinting tool.
 *
 * Both tasks are I/O-bound (network downloads, package manager operations),
 * so parallel execution reduces total setup time without contention.
 *
 * @returns {Promise<void>}
 * @throws {Error} When any concurrent task fails. The first rejection causes
 *   the entire stage to fail; remaining tasks continue in the background but
 *   their results are discarded.
 */
async function runConcurrentSetup() {
  console.log("[3/5] Running concurrent setup tasks...");

  await Promise.all([cleanAndInstall(), ensureTtfautohint()]);
}

// ---------------------------------------------------------------------------
// Stage 4: Font Compilation
// ---------------------------------------------------------------------------

/**
 * Build the Yukino font variant using the Iosevka build toolchain.
 *
 * Executes `npm run build -- contents::Yukino` inside the Iosevka directory.
 * This triggers the full Iosevka compilation pipeline, which includes glyph
 * generation, OpenType feature assembly, TTF/WOFF2 conversion, and optional
 * TrueType hinting (when `ttfautohint` is available).
 *
 * This is the most time-consuming stage and may take several minutes depending
 * on the number of weights, slopes, and glyph variants configured.
 *
 * @returns {Promise<void>}
 * @throws {Error} When the build process exits with a non-zero status code.
 */
async function buildFont() {
  console.log(`[4/5] Building font variant: ${BUILD_TARGET}`);
  console.log("  This step may take several minutes...");

  await spawn("npm", ["run", "build", "--", BUILD_TARGET], {
    cwd: IOSEVKA_DIR,
  });

  console.log("  Font build completed.");
}

// ---------------------------------------------------------------------------
// Stage 5: Collect Build Artifacts
// ---------------------------------------------------------------------------

/**
 * Copy compiled font artifacts from the Iosevka build output to the project.
 *
 * Copies `Iosevka/dist/Yukino/` to `src/Yukino/`. If the destination already
 * exists, it is removed first to ensure a clean replacement without stale
 * files from a previous build.
 *
 * The copied artifacts typically include:
 *
 *   - TTF/       - TrueType fonts with hinting.
 *   - TTF-Unhinted/ - TrueType fonts without hinting.
 *   - WOFF2/     - Web Open Font Format 2 with hinting.
 *   - WOFF2-Unhinted/ - WOFF2 without hinting.
 *   - *.css      - Stylesheets with embedded base64 font data.
 *
 * @returns {Promise<void>}
 * @throws {Error} When the build output directory does not exist or the copy
 *   operation fails.
 */
async function copyArtifacts() {
  console.log("[5/5] Collecting build artifacts...");

  const source = join(IOSEVKA_DIR, "dist", "Yukino");

  if (!(await isDirectory(source))) {
    throw new Error(
      `Build output directory not found: ${source}\n` +
        "  The font build may have failed silently. Check the output above for errors.",
    );
  }

  // Remove stale artifacts to prevent leftover files from a previous build
  if (await pathExists(DEST_DIR)) {
    console.log("  Removing existing artifacts...");
    await removeDir(DEST_DIR);
  }

  console.log(`  ${source} -> ${DEST_DIR}`);
  await copyDir(source, DEST_DIR);

  console.log("  Artifacts copied.");
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

/**
 * Orchestrate the complete Yukino font build pipeline.
 *
 * Executes all five stages sequentially, with stage 3 running its subtasks
 * concurrently. The process exits with code 1 if any stage fails.
 *
 * @returns {Promise<void>}
 */
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
