# Contract Module Map and Ownership Hints

**SC-W5-116** | Track: Contracts | Difficulty: Medium

A quick-reference map of every module in `noc-iq-contracts` for new
contributors. Each entry notes the primary responsibility, the main files,
and the issue IDs that created or extend it.

---

## Repository Layout

```
noc-iq-contracts/
├── sla_calculator/src/      # Soroban contract (Rust)
├── offchain/                # Off-chain TypeScript helpers for the backend
├── tooling/                 # DX / release / governance tooling
├── scripts/                 # CI scripts and one-shot runners
├── tools/                   # Miscellaneous developer tools
├── tests/                   # TypeScript integration test fixtures
├── docs/                    # Documentation
├── artifacts/               # Canonical test vector snapshots
└── ts/                      # Shared TypeScript utilities
```

---

## Module Ownership

### `sla_calculator/src/lib.rs`
**Owner:** contracts-core  
**Responsibility:** All on-chain logic — initialization, SLA calculation,
config management, pause/unpause, governance (admin/operator two-step),
stats, and history.  
**Do not** add off-chain logic here. Keep it `#![no_std]`.  
**Key issues:** SC-W5-001 through SC-W5-080

---

### `sla_calculator/src/tests.rs`
**Owner:** contracts-core  
**Responsibility:** Soroban unit and integration tests for the contract.
Add a test for every new function or edge case.  
**Run with:** `cd sla_calculator && cargo test`

---

### `offchain/`
**Owner:** backend-integration  
**Responsibility:** TypeScript helpers that the backend calls to validate
SLA results, manage tx lifecycle, and reconcile ambiguous outcomes.  
Key files and their SC issues:

| File | Issue | Purpose |
|------|-------|---------|
| `slaPaymentIntentConformance.ts` | SC-W5-110 | SLA->payment mapping validation |
| `txSubmissionAmbiguity.ts`       | SC-W5-111 | Safe retry semantics |
| `txHashCorrelation.ts`           | SC-W5-112 | Duplicate tx prevention |
| `payoutFinalityState.ts`         | SC-W5-113 | Payout state machine |
| `ambiguousOutcomeReplay.ts`      | SC-W5-114 | Reconciliation workflow |
| `failureRecoverySemantics.ts`    | SC-W5-115 | Partial observation recovery |
| `governanceConsistency.ts`       | SC-W5-029 | Event/state consistency |
| `eventSizeRegression.ts`         | SC-W5-029 | Event size budgets |
| `readCostRegression.ts`          | SC-W5-029 | Read cost budgets |

---

### `tooling/`
**Owner:** dx-and-release  
**Responsibility:** DX automation, release gates, and governance summaries.

| File | Issue | Purpose |
|------|-------|---------|
| `releaseChecklist.ts`         | SC-W5-old  | Pre-tag release checks |
| `governanceSummary.ts`        | SC-W5-old  | Governance state aggregation |
| `releaseCandidateGate.ts`     | SC-W5-121  | RC promotion gate |
| `prChecklist.ts`              | SC-W5-119  | PR invariant checklist |
| `roadmapTraceability.ts`      | SC-W5-118  | SC-ID to roadmap validation |
| `rollbackDecisionMatrix.ts`   | SC-W5-124  | HOLD/MONITOR/ROLLBACK logic |
| `waveReliabilityScorecard.ts` | SC-W5-125  | 0-100 release scorecard |

---

### `scripts/`
**Owner:** ci-and-ops  
**Responsibility:** CI-runnable scripts for size checks, tests, security
scans, and deployment verification.

| File | Issue | Purpose |
|------|-------|---------|
| `check-wasm-size.ts`    | SC-W5-old  | WASM size budget enforcement |
| `run-tests.ts`          | SC-W5-old  | Cargo test preset runner |
| `security-gate.ts`      | SC-W5-old  | Staged Rust security scan |
| `pre-deploy-verify.ts`  | SC-W5-122  | Pre-deploy manifest check |
| `post-deploy-smoke.ts`  | SC-W5-123  | Post-deploy entrypoint smoke |

---

### `docs/`
**Owner:** documentation  
**Responsibility:** Context documents for contributors and AI tooling.

| File | Purpose |
|------|---------|
| `CODEX_CONTEXT.md`               | AI/LLM context for the repo |
| `PROJECT_CONTEXT.md`             | Architecture and design overview |
| `config-validation.md`           | Config validation rules |
| `contributor-verification-guide.md` | SC-W5-120: Wave acceptance steps |
| `contract-module-map.md`         | This file |

---

## Where to Start

- **Bug in SLA logic** → `sla_calculator/src/lib.rs` + `tests.rs`
- **Backend integration issue** → `offchain/` helpers
- **Release or deployment issue** → `tooling/` or `scripts/`
- **Documentation gap** → `docs/`
- **New contributor** → read `docs/contributor-verification-guide.md` first
