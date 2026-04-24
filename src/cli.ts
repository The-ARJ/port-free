#!/usr/bin/env node
import { findProcess, findAllListening } from "./find-process";
import { killProcess } from "./kill-process";
import type { KillSignal } from "./kill-process";

const RESET = "\x1b[0m";
const GREEN = "\x1b[32m";
const RED = "\x1b[31m";
const YELLOW = "\x1b[33m";
const CYAN = "\x1b[36m";
const BOLD = "\x1b[1m";
const DIM = "\x1b[2m";

function green(s: string) { return `${GREEN}${s}${RESET}`; }
function red(s: string) { return `${RED}${s}${RESET}`; }
function yellow(s: string) { return `${YELLOW}${s}${RESET}`; }
function cyan(s: string) { return `${CYAN}${s}${RESET}`; }
function bold(s: string) { return `${BOLD}${s}${RESET}`; }
function dim(s: string) { return `${DIM}${s}${RESET}`; }

function printHelp() {
  console.log(`
${bold("port-free")} — kill whatever is running on a port

${bold("USAGE")}
  port-free ${cyan("<port>")} [options]
  port-free ${cyan("<port1> <port2> ...")}  (multiple ports)
  port-free ${cyan("--list")}

${bold("OPTIONS")}
  --force       SIGKILL instead of SIGTERM (immediate, no cleanup)
  --dry-run     Show what would be killed without killing it
  --list        List all processes listening on ports
  --help        Show this help

${bold("EXAMPLES")}
  npx port-free 3000
  npx port-free 3000 8080 9000
  npx port-free 3000 --force
  npx port-free 3000 --dry-run
  npx port-free --list
`);
}

function parseArgs(argv: string[]): {
  ports: number[];
  force: boolean;
  dryRun: boolean;
  list: boolean;
  help: boolean;
} {
  const ports: number[] = [];
  let force = false;
  let dryRun = false;
  let list = false;
  let help = false;

  for (const arg of argv) {
    if (arg === "--force" || arg === "-f") force = true;
    else if (arg === "--dry-run" || arg === "--dryrun") dryRun = true;
    else if (arg === "--list" || arg === "-l") list = true;
    else if (arg === "--help" || arg === "-h") help = true;
    else if (/^\d+$/.test(arg)) ports.push(parseInt(arg, 10));
    else {
      console.error(red(`Unknown option: ${arg}`));
      process.exit(1);
    }
  }

  return { ports, force, dryRun, list, help };
}

function listPorts() {
  const procs = findAllListening();
  if (procs.length === 0) {
    console.log(dim("No processes listening on any port."));
    return;
  }
  console.log(`\n${bold("Listening processes:")}\n`);
  const portW = 8;
  const pidW = 8;
  console.log(`  ${bold("PORT".padEnd(portW))}${bold("PID".padEnd(pidW))}${bold("NAME")}`);
  console.log(`  ${"\u2500".repeat(portW)}${"\u2500".repeat(pidW)}${"\u2500".repeat(20)}`);
  for (const p of procs) {
    console.log(`  ${cyan(String(p.port).padEnd(portW))}${dim(String(p.pid).padEnd(pidW))}${p.name}`);
  }
  console.log();
}

function run() {
  const argv = process.argv.slice(2);

  if (argv.length === 0) {
    printHelp();
    process.exit(0);
  }

  const { ports, force, dryRun, list, help } = parseArgs(argv);

  if (help) { printHelp(); process.exit(0); }
  if (list) { listPorts(); process.exit(0); }

  if (ports.length === 0) {
    console.error(red("Error: provide at least one port number."));
    console.error(dim("Usage: port-free <port> [--force] [--dry-run]"));
    process.exit(1);
  }

  const signal: KillSignal = force ? "SIGKILL" : "SIGTERM";
  let anyFailed = false;

  for (const port of ports) {
    const info = findProcess(port);

    if (!info) {
      console.log(`${yellow("\u2717")} Port ${bold(String(port))} \u2014 ${dim("nothing running")}`);
      continue;
    }

    if (dryRun) {
      console.log(
        `${cyan("~")} Port ${bold(String(port))} \u2014 would kill ${bold(info.name)} ${dim(`(PID ${info.pid})`)}` 
      );
      continue;
    }

    const result = killProcess(info.pid, port, info.name, signal);
    if (result.success) {
      console.log(
        `${green("\u2713")} Port ${bold(String(port))} freed \u2014 killed ${bold(info.name)} ${dim(`(PID ${info.pid})`)}`
      );
    } else {
      console.log(
        `${red("\u2717")} Port ${bold(String(port))} \u2014 failed to kill ${bold(info.name)} ${dim(`(PID ${info.pid})`)}: ${result.error}`
      );
      anyFailed = true;
    }
  }

  if (anyFailed) process.exit(1);
}

run();
