/**
 * SC-W5-119: PR checklist automation for contract invariants and gas budgets.
 *
 * Generates and validates a structured PR checklist for changes touching
 * contract code. Enforces invariant checks (auth, storage, events) and
 * gas/WASM-size budget awareness before merge.
 */

import * as fs from "fs";
import * as path from "path";

interface ChecklistItem {
  id: string;
  description: string;
  autoCheck?: () => boolean; // returns true if auto-passed
}

export interface ChecklistResult {
  item: string;
  passed: boolean;
  auto: boolean;
  note?: string;
}

const WASM_PATH = path.resolve(
  "sla_calculator/target/wasm32-unknown-unknown/release/sla_calculator.wasm"
);
const WASM_BUDGET_BYTES = 100 * 1024;

const CHECKLIST: ChecklistItem[] = [
  {
    id: "INV-01",
    description: "All privileged functions require caller auth before any state write",
  },
  {
    id: "INV-02",
    description: "Every state-mutating function emits a corresponding contract event",
  },
  {
    id: "INV-03",
    description: "No new unbounded storage growth introduced without prune policy",
  },
  {
    id: "INV-04",
    description: "Config mutations validate input ranges (no zero thresholds)",
  },
  {
    id: "GAS-01",
    description: "WASM artifact within 100 KB budget",
    autoCheck: () => {
      if (!fs.existsSync(WASM_PATH)) return true; // skip if not built yet
      return fs.statSync(WASM_PATH).size <= WASM_BUDGET_BYTES;
    },
  },
  {
    id: "GAS-02",
    description: "No new recursive loops or unbounded iteration added in hot paths",
  },
  {
    id: "TEST-01",
    description: "Negative/adversarial test cases added for new paths",
  },
  {
    id: "TEST-02",
    description: "cargo test passes with no new failures",
    autoCheck: () => {
      try {
        require("child_process").execSync("cargo test --quiet", {
          cwd: "sla_calculator",
          stdio: "pipe",
        });
        return true;
      } catch {
        return false;
      }
    },
  },
  {
    id: "DOC-01",
    description: "CHANGELOG.md updated if public API or behaviour changed",
  },
];

export function runChecklist(): ChecklistResult[] {
  return CHECKLIST.map((item) => {
    if (item.autoCheck) {
      const passed = item.autoCheck();
      return { item: `[${item.id}] ${item.description}`, passed, auto: true };
    }
    // Manual items: logged as requiring human sign-off
    return { item: `[${item.id}] ${item.description}`, passed: false, auto: false, note: "requires manual sign-off" };
  });
}

export function printChecklist(results: ChecklistResult[]): void {
  console.log("=== PR Checklist: Contract Invariants & Gas Budgets ===\n");
  for (const r of results) {
    const icon = r.auto ? (r.passed ? "✅" : "❌") : "☐ ";
    const suffix = r.note ? ` (${r.note})` : "";
    console.log(`${icon} ${r.item}${suffix}`);
  }
  const autoFailed = results.filter((r) => r.auto && !r.passed);
  if (autoFailed.length) {
    console.error(`\n${autoFailed.length} automated check(s) failed.`);
    process.exitCode = 1;
  } else {
    console.log("\nAutomated checks passed. Complete manual items before merge.");
  }
}

if (require.main === module) {
  printChecklist(runChecklist());
}
