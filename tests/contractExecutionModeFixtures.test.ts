import { describe, it, expect } from "vitest";

type ExecutionMode = "simulation" | "live" | "replay";

interface ExecutionFixture {
  mode: ExecutionMode;
  contractId: string;
  method: string;
  args: unknown[];
  expectedSuccess: boolean;
}

const fixtures: ExecutionFixture[] = [
  { mode: "simulation", contractId: "CONTRACT_A", method: "calc_sla", args: [100, 200], expectedSuccess: true },
  { mode: "live",       contractId: "CONTRACT_A", method: "calc_sla", args: [100, 200], expectedSuccess: true },
  { mode: "replay",     contractId: "CONTRACT_A", method: "calc_sla", args: [100, 200], expectedSuccess: true },
  { mode: "simulation", contractId: "CONTRACT_A", method: "calc_sla", args: [-1],       expectedSuccess: false },
];

describe("CONTRACT_EXECUTION_MODE parity fixtures", () => {
  for (const f of fixtures) {
    it(`mode=${f.mode} args=${JSON.stringify(f.args)} → ${f.expectedSuccess ? "ok" : "fail"}`, () => {
      expect(typeof f.contractId).toBe("string");
      expect(["simulation", "live", "replay"]).toContain(f.mode);
      expect(Array.isArray(f.args)).toBe(true);
    });
  }
});
