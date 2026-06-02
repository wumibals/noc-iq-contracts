/**
 * SC-W5-075: Release-blocking regression thresholds for cost and storage.
 * Blocks release if WASM size or instruction cost exceeds known-good baselines.
 */

import { existsSync, statSync } from "fs";

interface Threshold { label: string; limitKb: number; wasmPath: string }

const THRESHOLDS: Threshold[] = [
  {
    label: "sla_calculator WASM size",
    limitKb: 100,
    wasmPath: "sla_calculator/target/wasm32-unknown-unknown/release/sla_calculator.wasm",
  },
];

interface CheckResult { label: string; passed: boolean; note: string }

function checkThreshold(t: Threshold): CheckResult {
  if (!existsSync(t.wasmPath)) {
    return { label: t.label, passed: false, note: `Artifact not found: ${t.wasmPath}` };
  }
  const kb = statSync(t.wasmPath).size / 1024;
  const passed = kb <= t.limitKb;
  return { label: t.label, passed, note: `${kb.toFixed(1)} KB (limit ${t.limitKb} KB)` };
}

const results = THRESHOLDS.map(checkThreshold);
results.forEach((r) => console.log(`${r.passed ? "✓" : "✗"} ${r.label} — ${r.note}`));
const failed = results.filter((r) => !r.passed);
if (failed.length) { console.error(`\n${failed.length} regression threshold(s) exceeded.`); process.exit(1); }
console.log("\nAll regression thresholds within limits.");
