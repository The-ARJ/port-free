import { execSync } from "child_process";

export interface ProcessInfo {
  pid: number;
  port: number;
  name: string;
}

function findOnWindows(port: number): ProcessInfo | null {
  try {
    const out = execSync(
      `netstat -ano | findstr ":${port} "`,
      { encoding: "utf8", stdio: ["pipe", "pipe", "pipe"] }
    );
    for (const line of out.split("\n")) {
      const match = line.match(/\s+(\d+)\s*$/);
      if (match && line.includes(`0.0.0.0:${port}`) || line.includes(`127.0.0.1:${port}`) || line.includes(`[::]:${port}`)) {
        const pid = parseInt(match![1], 10);
        if (pid > 0) {
          const name = getProcessNameWindows(pid);
          return { pid, port, name };
        }
      }
    }
    return null;
  } catch {
    return null;
  }
}

function getProcessNameWindows(pid: number): string {
  try {
    const out = execSync(
      `tasklist /FI "PID eq ${pid}" /FO CSV /NH`,
      { encoding: "utf8", stdio: ["pipe", "pipe", "pipe"] }
    );
    const match = out.match(/^"([^"]+)"/);
    return match ? match[1] : "unknown";
  } catch {
    return "unknown";
  }
}

function findOnUnix(port: number): ProcessInfo | null {
  try {
    const out = execSync(
      `lsof -ti tcp:${port}`,
      { encoding: "utf8", stdio: ["pipe", "pipe", "pipe"] }
    );
    const pid = parseInt(out.trim().split("\n")[0], 10);
    if (!pid) return null;
    const name = getProcessNameUnix(pid);
    return { pid, port, name };
  } catch {
    return null;
  }
}

function getProcessNameUnix(pid: number): string {
  try {
    const out = execSync(
      `ps -p ${pid} -o comm=`,
      { encoding: "utf8", stdio: ["pipe", "pipe", "pipe"] }
    );
    return out.trim() || "unknown";
  } catch {
    return "unknown";
  }
}

export function findProcess(port: number): ProcessInfo | null {
  return process.platform === "win32"
    ? findOnWindows(port)
    : findOnUnix(port);
}

export function findAllListening(): Array<{ port: number; pid: number; name: string }> {
  try {
    if (process.platform === "win32") {
      const out = execSync("netstat -ano", { encoding: "utf8", stdio: ["pipe", "pipe", "pipe"] });
      const results: Array<{ port: number; pid: number; name: string }> = [];
      const seen = new Set<number>();
      for (const line of out.split("\n")) {
        const m = line.match(/\s+(?:TCP|UDP)\s+(?:0\.0\.0\.0|127\.0\.0\.1|\[::\]):(\d+)\s+\S+\s+(?:LISTENING)?\s+(\d+)/i);
        if (m) {
          const port = parseInt(m[1], 10);
          const pid = parseInt(m[2], 10);
          if (!seen.has(port) && pid > 0) {
            seen.add(port);
            results.push({ port, pid, name: getProcessNameWindows(pid) });
          }
        }
      }
      return results.sort((a, b) => a.port - b.port);
    } else {
      const out = execSync("lsof -iTCP -sTCP:LISTEN -nP", { encoding: "utf8", stdio: ["pipe", "pipe", "pipe"] });
      const results: Array<{ port: number; pid: number; name: string }> = [];
      const seen = new Set<number>();
      for (const line of out.split("\n").slice(1)) {
        const m = line.match(/^(\S+)\s+(\d+).*:(\d+)\s+\(LISTEN\)/);
        if (m) {
          const port = parseInt(m[3], 10);
          const pid = parseInt(m[2], 10);
          if (!seen.has(port)) {
            seen.add(port);
            results.push({ port, pid, name: m[1] });
          }
        }
      }
      return results.sort((a, b) => a.port - b.port);
    }
  } catch {
    return [];
  }
}
