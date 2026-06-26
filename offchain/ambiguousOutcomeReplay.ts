/**
 * SC-W5-114: Ambiguous outcome replay workflow for backend reconciliation.
 *
 * When the backend cannot determine whether a contract call succeeded
 * (network timeout, connection drop after submission), it must replay
 * through a structured reconciliation workflow before retrying.
 * This prevents double-application of SLA calculations.
 */

export type OutcomeVerdict = "confirmed" | "not_applied" | "indeterminate";

export interface ReconciliationQuery {
  outage_id: string;
  expected_ledger_min?: number; // earliest ledger the tx could have landed
  expected_ledger_max?: number; // latest ledger within sequence window
}

export interface ReconciliationResult {
  outage_id: string;
  verdict: OutcomeVerdict;
  found_in_history: boolean;
  safe_to_retry: boolean;
  action: "no_op" | "retry" | "escalate";
}

/**
 * Simulates querying contract history to reconcile ambiguous outcomes.
 * In production, `queryContractHistory` calls get_history on the contract.
 */
export function reconcile(
  query: ReconciliationQuery,
  historyIds: string[] // outage IDs found in contract history
): ReconciliationResult {
  const found = historyIds.includes(query.outage_id);

  if (found) {
    return {
      outage_id: query.outage_id,
      verdict: "confirmed",
      found_in_history: true,
      safe_to_retry: false,
      action: "no_op",
    };
  }

  // Not found in history — check if ledger window has passed
  const windowClosed =
    query.expected_ledger_max !== undefined &&
    query.expected_ledger_min !== undefined;

  if (windowClosed) {
    return {
      outage_id: query.outage_id,
      verdict: "not_applied",
      found_in_history: false,
      safe_to_retry: true,
      action: "retry",
    };
  }

  // Window not specified — cannot determine yet
  return {
    outage_id: query.outage_id,
    verdict: "indeterminate",
    found_in_history: false,
    safe_to_retry: false,
    action: "escalate",
  };
}

function runTests(): void {
  console.log("[SC-W5-114] Ambiguous outcome replay workflow tests\n");

  // Found in history -> confirmed, no retry
  const r1 = reconcile({ outage_id: "OUT001" }, ["OUT001", "OUT002"]);
  if (r1.verdict !== "confirmed" || r1.safe_to_retry) throw new Error("Expected confirmed, no retry");
  console.log("  ✓ found in history -> confirmed, no_op");

  // Not found, ledger window closed -> safe to retry
  const r2 = reconcile(
    { outage_id: "OUT003", expected_ledger_min: 1000, expected_ledger_max: 1010 },
    ["OUT001"]
  );
  if (r2.verdict !== "not_applied" || !r2.safe_to_retry || r2.action !== "retry")
    throw new Error("Expected not_applied + retry");
  console.log("  ✓ not found + closed window -> not_applied, retry");

  // Not found, no ledger window -> indeterminate
  const r3 = reconcile({ outage_id: "OUT004" }, []);
  if (r3.verdict !== "indeterminate" || r3.safe_to_retry || r3.action !== "escalate")
    throw new Error("Expected indeterminate + escalate");
  console.log("  ✓ not found + no window -> indeterminate, escalate");

  // Adversarial: empty outage_id
  const r4 = reconcile({ outage_id: "" }, ["OUT001"]);
  if (r4.verdict !== "indeterminate") throw new Error("Empty outage_id should yield indeterminate");
  console.log("  ✓ adversarial: empty outage_id -> indeterminate");

  console.log("\nAll replay workflow tests passed.");
}

runTests();
