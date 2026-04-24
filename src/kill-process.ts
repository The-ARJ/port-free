import { execSync } from "child_process";

export type KillSignal = "SIGTERM" | "SIGKILL";

export interface KillResult {
  pid: number;
  port: number;
  name: string;
  success: boolean;
  error?: string;
}

export function killProcess(
  pid: number,
  port: number,
  name: string,
  signal: KillSignal = "SIGTERM"
): KillResult {
  try {
    if (process.platform === "win32") {
      const flag = signal === "SIGKILL" ? "/F" : "";
      execSync(`taskkill ${flag} /PID ${pid}`, {
        stdio: ["pipe", "pipe", "pipe"],
      });
    } else {
      const sig = signal === "SIGKILL" ? "-9" : "-15";
      execSync(`kill ${sig} ${pid}`, {
        stdio: ["pipe", "pipe", "pipe"],
      });
    }
    return { pid, port, name, success: true };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return { pid, port, name, success: false, error: msg };
  }
}
