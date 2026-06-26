# Contributor Verification Guide — Wave Acceptance Quality

**SC-W5-120** | Track: Contracts | Difficulty: Medium

This guide defines the minimum verification steps every contributor must
complete before a PR is eligible for Wave acceptance review.

---

## 1. Local Build and Test

```bash
cd sla_calculator
cargo test
cargo check --target wasm32-unknown-unknown --lib
```

Both commands must pass with zero errors. The second (`--lib`) enforces
no-std compliance — any accidental `std` import surfaces here before deployment.

---

## 2. WASM Size Check

```bash
cargo build --target wasm32-unknown-unknown --release
npx ts-node scripts/check-wasm-size.ts
```

The WASM artifact must stay within the 100 KB budget. Exceeding this requires
a documented justification PR before the budget can be raised.

---

## 3. PR Checklist

Run the automated PR checklist before opening a pull request:

```bash
npx ts-node tooling/prChecklist.ts
```

All automated checks (WASM size, cargo test) must pass. Manual sign-off
items (`INV-*`, `DOC-*`) require a comment in the PR confirming each one.

---

## 4. Security Gate

For PRs touching privileged or stateful contract code (auth, storage, config):

```bash
git add <changed .rs files>
npx ts-node scripts/security-gate.ts
```

Address every pattern hit before requesting review. If a hit is a false
positive, document why in the PR description.

---

## 5. Roadmap Traceability

Every PR must reference at least one SC-W5-xxx issue ID in the commit message
and PR description. Run the traceability checker to confirm coverage:

```bash
npx ts-node tooling/roadmapTraceability.ts
```

---

## 6. Branch and PR Naming

| Item | Convention |
|------|-----------|
| Branch | `fix/issue-<number>-short-description` |
| PR title | Under 70 characters, prefixed with `feat:` or `fix:` |
| PR body | Must include `Closes #<issue-number>` |
| Base branch | `main` on `OpSoll/noc-iq-contracts` |

---

## 7. Wave Acceptance Criteria Checklist

Before marking a PR ready for Wave review, confirm:

- [ ] `cargo test` passes locally
- [ ] `cargo check --target wasm32-unknown-unknown --lib` passes
- [ ] WASM size is within budget
- [ ] PR checklist automation passes (`tooling/prChecklist.ts`)
- [ ] Security gate clean (no unresolved pattern hits)
- [ ] Roadmap traceability checker passes
- [ ] Negative/adversarial test cases included for new paths
- [ ] CHANGELOG.md updated if behaviour changed
- [ ] PR description references the issue with `Closes #<N>`

---

## 8. Common Rejection Reasons

| Reason | Fix |
|--------|-----|
| Missing `require_auth` before state write | Add auth check; re-run security gate |
| Test coverage gap on error paths | Add negative tests matching acceptance criteria |
| WASM size over budget | Optimize or justify in PR description |
| No issue reference in commit | Amend commit with `SC-W5-xxx` reference |
| Snapshot tests not updated | Run `cargo test` after logic changes |
