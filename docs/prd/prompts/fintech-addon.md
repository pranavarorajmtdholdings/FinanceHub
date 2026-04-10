# Fintech Infrastructure Add-On Prompt

Append this to the master prompt when drafting PRDs for fintech infrastructure products (ledgering, BaaS, payments, onboarding, treasury, compliance, risk, embedded finance).

---

## Prompt

```text
When drafting requirements, explicitly include:
- Ledger and balance implications
- Transaction lifecycle states (initiated, pending, posted, failed, reversed, reconciled)
- Reconciliation logic (internal vs. external, frequency, exception handling)
- Permissions and role controls (who can initiate, approve, view, audit)
- Exception handling (partial failures, timeouts, duplicate detection, idempotency)
- Audit logging (what is logged, retention period, immutability)
- Compliance review touchpoints (where human review is required, escalation paths)
- Failure states and operational fallbacks (what happens when a downstream system is unavailable)
- Money movement controls (limits, velocity checks, dual authorization thresholds)
- Data residency and retention requirements
```

## Domain-Specific Variants

### For Payments Products

```text
Additionally cover:
- Payment rail specifics (ACH, wire, RTP, card networks)
- Settlement timing and cutoff windows
- Return and chargeback handling
- Fee structures and pass-through economics
```

### For BaaS / Ledgering Products

```text
Additionally cover:
- Chart of accounts structure
- Double-entry accounting implications
- Sub-ledger vs. general ledger separation
- End-of-day balance snapshots and reporting
- Interest accrual and calculation methods
```

### For Onboarding / KYC Products

```text
Additionally cover:
- Identity verification provider integration
- Document collection and verification workflows
- Risk scoring and tiering
- Ongoing monitoring and periodic review cadence
- Adverse media and sanctions screening
```

### For Treasury Products

```text
Additionally cover:
- Cash positioning and forecasting
- FBO account structures
- Sweep logic and investment policies
- Counterparty risk management
- Regulatory capital and reserve requirements
```
