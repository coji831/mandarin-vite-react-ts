#!/usr/bin/env node
/**
 * capture-log.mjs — run a shell command and capture its output to logs/<name>-<timestamp>.log
 *
 * Usage:
 *   node scripts/capture-log.mjs <name> -- <command...>
 *     Runs <command...>, tee-ing stdout+stderr into logs/<name>-<yyyyMMdd-HHmmss>.log.
 *     Prints the log path and the command's exit code. Auto-prunes old logs on every run.
 *
 *   node scripts/capture-log.mjs --prune
 *     Deletes logs under LOG_DIR older than LOG_RETENTION_DAYS (default 30).
 *
 * Env:
 *   LOG_DIR             (default "logs")
 *   LOG_RETENTION_DAYS  (default 30)
 *
 * Examples:
 *   node scripts/capture-log.mjs seed -- npm run db:seed --workspace=@mandarin/backend
 *   node scripts/capture-log.mjs gate-build -- npm run build
 */
import { spawn } from "node:child_process";
import {
  createWriteStream,
  existsSync,
  mkdirSync,
  readdirSync,
  statSync,
  unlinkSync,
} from "node:fs";
import { join, resolve } from "node:path";

const LOG_DIR = process.env.LOG_DIR || "logs";
const RETENTION_DAYS = Number(process.env.LOG_RETENTION_DAYS || 30);

function timestamp() {
  const d = new Date();
  const p = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}-${p(d.getHours())}${p(d.getMinutes())}${p(d.getSeconds())}`;
}

function prune() {
  const dir = resolve(LOG_DIR);
  if (!existsSync(dir)) {
    console.log(`[capture-log] ${LOG_DIR}/ does not exist — nothing to prune`);
    return;
  }
  const cutoff = Date.now() - RETENTION_DAYS * 24 * 60 * 60 * 1000;
  let removed = 0;
  for (const f of readdirSync(dir)) {
    if (!f.endsWith(".log")) continue;
    const p = join(dir, f);
    let mtime;
    try {
      mtime = statSync(p).mtimeMs;
    } catch {
      continue;
    }
    if (mtime < cutoff) {
      unlinkSync(p);
      removed++;
      console.log(`[capture-log] pruned ${f}`);
    }
  }
  console.log(`[capture-log] pruned ${removed} log(s) older than ${RETENTION_DAYS}d`);
}

// --- --prune mode ---
const args = process.argv.slice(2);
if (args[0] === "--prune") {
  prune();
  process.exit(0);
}

// --- capture mode ---
const sep = args.indexOf("--");
if (sep === -1 || sep === 0) {
  console.error("Usage: node scripts/capture-log.mjs <name> -- <command...>   (or: --prune)");
  process.exit(1);
}
const name = args[0];
const command = args.slice(sep + 1);
if (command.length === 0) {
  console.error('[capture-log] no command provided after "--"');
  process.exit(1);
}

mkdirSync(resolve(LOG_DIR), { recursive: true });
const logFile = join(LOG_DIR, `${name}-${timestamp()}.log`);
const out = createWriteStream(resolve(logFile));
out.write(`# $ ${command.join(" ")}\n# started ${new Date().toISOString()}\n\n`);

const child = spawn(command.join(" "), { shell: true, stdio: ["ignore", "pipe", "pipe"] });
child.stdout.on("data", (d) => {
  out.write(d);
  process.stdout.write(d);
});
child.stderr.on("data", (d) => {
  out.write(d);
  process.stderr.write(d);
});
child.on("error", (err) => {
  out.write(`\n[spawn error] ${err.message}\n`);
  console.error(`[capture-log] spawn error: ${err.message}`);
});
child.on("close", (code) => {
  out.write(`\n# exit code ${code}\n# finished ${new Date().toISOString()}\n`);
  out.end();
  console.log(`\n[capture-log] wrote ${logFile} (exit ${code})`);
  prune();
  process.exit(code ?? 1);
});
