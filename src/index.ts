export { findProcess, findAllListening } from "./find-process";
export { killProcess } from "./kill-process";
export type { ProcessInfo } from "./find-process";
export type { KillSignal, KillResult } from "./kill-process";

import { findProcess } from "./find-process";
import { killProcess } from "./kill-process";
import type { KillSignal, KillResult } from "./kill-process";

export interface FreePortOptions {
  signal?: KillSignal;
  dryRun?: boolean;
}

export interface FreePortResult {
  port: number;
  freed: boolean;
  dryRun: boolean;
  process?: { pid: number; name: string };
  error?: string;
}

export async function freePort(
  port: number,
  options: FreePortOptions = {}
): Promise<FreePortResult> {
  const { signal = "SIGTERM", dryRun = false } = options;

  const info = findProcess(port);
  if (!info) {
    return { port, freed: false, dryRun, error: "No process found on port" };
  }

  if (dryRun) {
    return {
      port,
      freed: false,
      dryRun: true,
      process: { pid: info.pid, name: info.name },
    };
  }

  const result: KillResult = killProcess(info.pid, port, info.name, signal);
  return {
    port,
    freed: result.success,
    dryRun: false,
    process: { pid: info.pid, name: info.name },
    error: result.error,
  };
}

export async function freePorts(
  ports: number[],
  options: FreePortOptions = {}
): Promise<FreePortResult[]> {
  return Promise.all(ports.map((p) => freePort(p, options)));
}
