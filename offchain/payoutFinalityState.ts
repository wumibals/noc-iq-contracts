/**
 * SC-W5-113: Finality-state annotation model for payout intents.
 *
 * Payout intents must carry an explicit finality annotation so the backend
 * can distinguish between pending, in-flight, finalized, and rolled-back
 * states without polling contract storage on every request.
 */

export type FinalityState =
  | "pending"      // intent created, not yet submitted
  | "submitted"    // submitted to Stellar, awaiting inclusion
  | "finalized"    // included in a closed ledger; contract state written
  | "rolled_back"  // tx failed after submission; contract state unchanged
  | "expired";     // submission window passed without confirmation

export interface PayoutIntent {
  outage_id: string;
  amount: number;
  recipient: string;
  finality: FinalityState;
  ledger_sequence?: number; // set when finalized
  tx_hash?: string;
}

/** Allowed finality state transitions. */
const TRANSITIONS: Record<FinalityState, FinalityState[]> = {
  pending:     ["submitted"],
  submitted:   ["finalized", "rolled_back", "expired"],
  finalized:   [],           // terminal
  rolled_back: ["pending"],  // can requeue
  expired:     ["pending"],  // can requeue
};

export function transition(
  intent: PayoutIntent,
  next: FinalityState
): PayoutIntent {
  const allowed = TRANSITIONS[intent.finality];
  if (!allowed.includes(next)) {
    throw new Error(
      `[SC-W5-113] Invalid transition ${intent.finality} -> ${next} for ${intent.outage_id}`
    );
  }
  return { ...intent, finality: next };
}

function runTests(): void {
  console.log("[SC-W5-113] Finality-state annotation model tests\n");

  const base: PayoutIntent = { outage_id: "OUT001", amount: 500, recipient: "GABC", finality: "pending" };

  // Happy path: pending -> submitted -> finalized
  const submitted = transition(base, "submitted");
  if (submitted.finality !== "submitted") throw new Error("Expected submitted");
  console.log("  ✓ pending -> submitted");

  const finalized = transition(submitted, "finalized");
  if (finalized.finality !== "finalized") throw new Error("Expected finalized");
  console.log("  ✓ submitted -> finalized");

  // finalized is terminal
  try {
    transition(finalized, "pending");
    throw new Error("Should have thrown");
  } catch (e: any) {
    if (!e.message.includes("SC-W5-113")) throw e;
    console.log("  ✓ finalized -> pending rejected (terminal)");
  }

  // rolled_back allows requeue
  const rolled = transition(submitted, "rolled_back");
  const requeued = transition(rolled, "pending");
  if (requeued.finality !== "pending") throw new Error("Expected pending after requeue");
  console.log("  ✓ rolled_back -> pending (requeue)");

  // expired -> pending
  const expiredIntent: PayoutIntent = { ...base, finality: "submitted" };
  const expired = transition(expiredIntent, "expired");
  const requeuedFromExpired = transition(expired, "pending");
  if (requeuedFromExpired.finality !== "pending") throw new Error("Expected pending");
  console.log("  ✓ expired -> pending (requeue)");

  // Adversarial: skip submitted
  try {
    transition(base, "finalized");
    throw new Error("Should have thrown");
  } catch (e: any) {
    if (!e.message.includes("SC-W5-113")) throw e;
    console.log("  ✓ adversarial: pending -> finalized (skip) rejected");
  }

  console.log("\nAll finality-state annotation tests passed.");
}

runTests();
