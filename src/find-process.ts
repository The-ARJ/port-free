import { execSync } from "child_process";

export interface ProcessInfo {
  pid: number;
  port: number;
  name: string;
}

function findOnWindows(port: number): ProcessInfo | null {
  try {
    const out = execSync(`netstat -ano`, {
      encoding: "utf8",
      stdio: ["pipe", "pipe", "pipe"],
    });
    const portSuffix = `:${port}`;
    for (const line of out.split("\n")) {
      if (!/\bLISTENING\b/i.test(line)) continue;
      const parts = line.trim().split(/\s+/);
      if (parts.length < 5 || parts[0].toUpperCase() !== "TCP") continue;
      const local = parts[1];
      const lastColon = local.lastIndexOf(":");
      if (lastColon === -1) continue;
      if (local.slice(lastColon) !== portSuffix) continue;
      const pid = parseInt(parts[parts.length - 1], 10);
      if (pid > 0) {
        return { pid, port, name: getProcessNameWindows(pid) };
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
      const out = execSync("netstat -ano", {
        encoding: "utf8",
        stdio: ["pipe", "pipe", "pipe"],
      });
      const results: Array<{ port: number; pid: number; name: string }> = [];
      const seen = new Set<number>();
      for (const line of out.split("\n")) {
        if (!/\bLISTENING\b/i.test(line)) continue;
        const parts = line.trim().split(/\s+/);
        if (parts.length < 5 || parts[0].toUpperCase() !== "TCP") continue;
        const local = parts[1];
        const lastColon = local.lastIndexOf(":");
        if (lastColon === -1) continue;
        const port = parseInt(local.slice(lastColon + 1), 10);
        const pid = parseInt(parts[parts.length - 1], 10);
        if (!port || !pid || seen.has(port)) continue;
        seen.add(port);
        results.push({ port, pid, name: getProcessNameWindows(pid) });
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
