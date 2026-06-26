/**
 * SC-W5-111: Transaction submission ambiguity handling guidance and tests.
 *
 * Stellar transaction submission can return ambiguous outcomes (TIMEOUT,
 * connection drop, etc.) where the backend cannot tell if the tx landed.
 * This module defines safe re-submission semantics and tests for the contract
 * to remain idempotent under such conditions.
 */

export type TxStatus = "success" | "failed" | "timeout" | "unknown";

export interface TxSubmissionResult {
  tx_hash: string;
  status: TxStatus;
  ledger_sequence?: number;
}

export interface AmbiguityResolution {
  safe_to_retry: boolean;
  action: "retry" | "query_only" | "abort";
  reason: string;
}

/**
 * Given a submission result, returns the safe action for the backend.
 * Contract state must never be double-applied; query first on ambiguous outcomes.
 */
export function resolveAmbiguity(result: TxSubmissionResult): AmbiguityResolution {
  switch (result.status) {
    case "success":
      return { safe_to_retry: false, action: "query_only", reason: "tx confirmed; query state to verify" };
    case "failed":
      return { safe_to_retry: true, action: "retry", reason: "tx definitively failed; safe to resubmit" };
    case "timeout":
      return { safe_to_retry: false, action: "query_only", reason: "timeout: tx may have landed; query before retry" };
    case "unknown":
      return { safe_to_retry: false, action: "query_only", reason: "unknown outcome: query ledger state first" };
  }
}

interface AmbiguityCase {
  label: string;
  result: TxSubmissionResult;
  expected_action: AmbiguityResolution["action"];
  expected_safe_to_retry: boolean;
}

const cases: AmbiguityCase[] = [
  {
    label: "confirmed success is not retried",
    result: { tx_hash: "HASH1", status: "success", ledger_sequence: 1000 },
    expected_action: "query_only",
    expected_safe_to_retry: false,
  },
  {
    label: "definitive failure allows retry",
    result: { tx_hash: "HASH2", status: "failed" },
    expected_action: "retry",
    expected_safe_to_retry: true,
  },
  {
    label: "timeout requires query first",
    result: { tx_hash: "HASH3", status: "timeout" },
    expected_action: "query_only",
    expected_safe_to_retry: false,
  },
  {
    label: "unknown requires query first",
    result: { tx_hash: "HASH4", status: "unknown" },
    expected_action: "query_only",
    expected_safe_to_retry: false,
  },
];

// Adversarial: empty tx_hash must be flagged
function assertValidTxHash(result: TxSubmissionResult): void {
  if (!result.tx_hash) throw new Error("[SC-W5-111] tx_hash must not be empty");
}

function runTests(): void {
  console.log("[SC-W5-111] Transaction submission ambiguity tests\n");
  for (const c of cases) {
    assertValidTxHash(c.result);
    const resolution = resolveAmbiguity(c.result);
    if (resolution.action !== c.expected_action)
      throw new Error(`"${c.label}": action expected ${c.expected_action}, got ${resolution.action}`);
    if (resolution.safe_to_retry !== c.expected_safe_to_retry)
      throw new Error(`"${c.label}": safe_to_retry mismatch`);
    console.log(`  ✓ ${c.label}`);
  }

  // Adversarial: empty hash rejected
  try {
    assertValidTxHash({ tx_hash: "", status: "success" });
    throw new Error("Should have thrown");
  } catch (e: any) {
    if (!e.message.includes("SC-W5-111")) throw e;
    console.log("  ✓ adversarial: empty tx_hash rejected");
  }

  console.log(`\nAll ambiguity handling tests passed.`);
}

runTests();
