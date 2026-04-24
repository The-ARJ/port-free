import { describe, it, expect, vi, afterEach } from "vitest";
import { execSync } from "child_process";

vi.mock("child_process", () => ({
  execSync: vi.fn(),
}));

const mockExec = execSync as unknown as ReturnType<typeof vi.fn>;

afterEach(() => vi.clearAllMocks());

describe("killProcess", () => {
  it("returns success=true when kill succeeds", async () => {
    mockExec.mockReturnValue("");
    const { killProcess } = await import("../src/kill-process");
    const result = killProcess(1234, 3000, "node", "SIGTERM");
    expect(result.success).toBe(true);
    expect(result.pid).toBe(1234);
    expect(result.port).toBe(3000);
    expect(result.name).toBe("node");
  });

  it("returns success=false with error message when kill fails", async () => {
    mockExec.mockImplementation(() => { throw new Error("permission denied"); });
    const { killProcess } = await import("../src/kill-process");
    const result = killProcess(1234, 3000, "node", "SIGTERM");
    expect(result.success).toBe(false);
    expect(result.error).toContain("permission denied");
  });
});
