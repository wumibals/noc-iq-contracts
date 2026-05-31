// SC-026: Governance event coverage for proposal and acceptance lifecycles.
// Emits structured events for proposal, acceptance, cancellation, and renounce.

export type GovernanceEventKind =
  | "admin_proposed"
  | "admin_accepted"
  | "admin_renounced"
  | "operator_proposed"
  | "operator_accepted"
  | "proposal_cancelled"
  | "governance_locked"
  | "governance_unlocked";

export interface GovernanceEvent {
  kind: GovernanceEventKind;
  actor: string;
  target: string | null;
  ledger: number;
  reason?: string;
  metadata?: Record<string, string>;
}

const eventLog: GovernanceEvent[] = [];

export function emitGovernanceEvent(event: GovernanceEvent): void {
  eventLog.push(event);
}

export function getGovernanceEvents(kind?: GovernanceEventKind): GovernanceEvent[] {
  return kind ? eventLog.filter((e) => e.kind === kind) : [...eventLog];
}

export function clearGovernanceEvents(): void {
  eventLog.length = 0;
}

// helpers that mirror contract-side governance transitions
export function onAdminProposed(actor: string, target: string, ledger: number): void {
  emitGovernanceEvent({ kind: "admin_proposed", actor, target, ledger });
}

export function onAdminAccepted(actor: string, ledger: number): void {
  emitGovernanceEvent({ kind: "admin_accepted", actor, target: null, ledger });
}

export function onAdminRenounced(actor: string, ledger: number): void {
  emitGovernanceEvent({ kind: "admin_renounced", actor, target: null, ledger });
}

export function onOperatorProposed(actor: string, target: string, ledger: number): void {
  emitGovernanceEvent({ kind: "operator_proposed", actor, target, ledger });
}

export function onOperatorAccepted(actor: string, ledger: number): void {
  emitGovernanceEvent({ kind: "operator_accepted", actor, target: null, ledger });
}

export function onGovernanceLocked(
  actor: string,
  ledger: number,
  reason: string,
  metadata: Record<string, string> = {},
): void {
  emitGovernanceEvent({
    kind: "governance_locked",
    actor,
    target: null,
    ledger,
    reason,
    metadata,
  });
}

export function onGovernanceUnlocked(
  actor: string,
  ledger: number,
  reason: string,
  metadata: Record<string, string> = {},
): void {
  emitGovernanceEvent({
    kind: "governance_unlocked",
    actor,
    target: null,
    ledger,
    reason,
    metadata,
  });
}
