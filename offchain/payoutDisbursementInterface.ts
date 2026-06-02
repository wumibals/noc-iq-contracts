/**
 * SC-W5-076: Interface contract for future payout/disbursement companion contracts.
 * Defines the shared interface that payout and disbursement contracts must satisfy.
 */

export interface PayoutRequest {
  outage_id: string;
  recipient:  string;
  amount:     number;
  penalty_bps: number;
}

export interface DisbursementResult {
  outage_id: string;
  disbursed: boolean;
  amount:    number;
  reason?:   string;
}

export interface PayoutDisbursementContract {
  requestPayout(req: PayoutRequest): DisbursementResult;
  getPendingPayouts(): PayoutRequest[];
  getTotalDisbursed(): number;
}

// Minimal in-process stub that satisfies the interface for integration testing
export class StubPayoutContract implements PayoutDisbursementContract {
  private disbursed = 0;
  private pending: PayoutRequest[] = [];

  requestPayout(req: PayoutRequest): DisbursementResult {
    if (req.amount <= 0) return { outage_id: req.outage_id, disbursed: false, amount: 0, reason: "invalid amount" };
    this.disbursed += req.amount;
    return { outage_id: req.outage_id, disbursed: true, amount: req.amount };
  }

  getPendingPayouts(): PayoutRequest[] { return this.pending; }
  getTotalDisbursed(): number { return this.disbursed; }
}
