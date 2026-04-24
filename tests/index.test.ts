import { describe, it, expect, vi, afterEach } from "vitest";

vi.mock("../src/find-process", () => ({
  findProcess: vi.fn(),
  findAllListening: vi.fn(() => []),
}));
vi.mock("../src/kill-process", () => ({
  killProcess: vi.fn(),
}));

import { findProcess } from "../src/find-process";
import { killProcess } from "../src/kill-process";

const mockFind = findProcess as ReturnType<typeof vi.fn>;
const mockKill = killProcess as ReturnType<typeof vi.fn>;

afterEach(() => vi.clearAllMocks());

describe("freePort", () => {
  it("returns freed=false when no process on port", async () => {
    mockFind.mockReturnValue(null);
    const { freePort } = await import("../src/index");
    const result = await freePort(3000);
    expect(result.freed).toBe(false);
    expect(result.error).toMatch(/no process/i);
  });

  it("returns dry-run result without killing", async () => {
    mockFind.mockReturnValue({ pid: 1234, port: 3000, name: "node" });
    const { freePort } = await import("../src/index");
    const result = await freePort(3000, { dryRun: true });
    expect(result.dryRun).toBe(true);
    expect(result.freed).toBe(false);
    expect(mockKill).not.toHaveBeenCalled();
    expect(result.process?.pid).toBe(1234);
  });

  it("kills process and returns freed=true on success", async () => {
    mockFind.mockReturnValue({ pid: 1234, port: 3000, name: "node" });
    mockKill.mockReturnValue({ pid: 1234, port: 3000, name: "node", success: true });
    const { freePort } = await import("../src/index");
    const result = await freePort(3000);
    expect(result.freed).toBe(true);
    expect(mockKill).toHaveBeenCalledWith(1234, 3000, "node", "SIGTERM");
  });

  it("uses SIGKILL when force signal specified", async () => {
    mockFind.mockReturnValue({ pid: 5678, port: 8080, name: "python" });
    mockKill.mockReturnValue({ pid: 5678, port: 8080, name: "python", success: true });
    const { freePort } = await import("../src/index");
    await freePort(8080, { signal: "SIGKILL" });
    expect(mockKill).toHaveBeenCalledWith(5678, 8080, "python", "SIGKILL");
  });
});

describe("freePorts", () => {
  it("processes multiple ports", async () => {
    mockFind.mockReturnValue(null);
    const { freePorts } = await import("../src/index");
    const results = await freePorts([3000, 8080, 9000]);
    expect(results).toHaveLength(3);
  });
});
