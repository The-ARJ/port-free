import { describe, it, expect, vi, afterEach } from "vitest";
import { execSync } from "child_process";

vi.mock("child_process", () => ({
  execSync: vi.fn(),
}));

const mockExec = execSync as unknown as ReturnType<typeof vi.fn>;

afterEach(() => vi.clearAllMocks());

describe("findProcess", () => {
  it("returns null when no process is on the port", async () => {
    mockExec.mockImplementation(() => { throw new Error("no output"); });
    const { findProcess } = await import("../src/find-process");
    const result = findProcess(9999);
    expect(result).toBeNull();
  });

  it("returns null for invalid pid", async () => {
    mockExec.mockReturnValue("  0\n");
    const { findProcess } = await import("../src/find-process");
    const result = findProcess(3000);
    expect(result).toBeNull();
  });
});

describe("findAllListening", () => {
  it("returns empty array when command fails", async () => {
    mockExec.mockImplementation(() => { throw new Error("fail"); });
    const { findAllListening } = await import("../src/find-process");
    expect(findAllListening()).toEqual([]);
  });
});
