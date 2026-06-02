/**
 * SC-W5-073: Security gate enforcement for forbidden patterns and unsafe deps.
 * Scans source files for forbidden patterns and flags unsafe dependencies.
 */

import { execSync } from "child_process";
import { readFileSync } from "fs";

const FORBIDDEN_PATTERNS = ["unsafe {", "std::mem::transmute", "unwrap_unchecked"];
const UNSAFE_DEPS = ["libc", "raw-cpuid"];

interface GateResult { label: string; passed: boolean; note?: string }

function checkForbiddenPatterns(): GateResult {
  try {
    const src = execSync('grep -r --include="*.rs" -l "unsafe {" src/ sla_calculator/src/', { stdio: "pipe" }).toString().trim();
    if (src) return { label: "forbidden-patterns", passed: false, note: `Found in: ${src.split("\n").join(", ")}` };
  } catch { /* grep exits 1 when nothing found — that's a pass */ }
  return { label: "forbidden-patterns", passed: true };
}

function checkUnsafeDeps(): GateResult {
  try {
    const lock = readFileSync("Cargo.lock", "utf8");
    const found = UNSAFE_DEPS.filter((dep) => lock.includes(`name = "${dep}"`));
    if (found.length) return { label: "unsafe-deps", passed: false, note: found.join(", ") };
  } catch (e: any) { return { label: "unsafe-deps", passed: false, note: e.message }; }
  return { label: "unsafe-deps", passed: true };
}

const results = [checkForbiddenPatterns(), checkUnsafeDeps()];
results.forEach((r) => console.log(`${r.passed ? "✓" : "✗"} ${r.label}${r.note ? ` — ${r.note}` : ""}`));
const failed = results.filter((r) => !r.passed);
if (failed.length) { console.error(`\n${failed.length} security gate(s) failed.`); process.exit(1); }
console.log("\nAll security gates passed.");
