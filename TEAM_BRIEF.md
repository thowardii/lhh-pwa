# Team Brief: Cosmic OS Working Philosophy

**Date:** 2026-05-23

## What Is It?

The Cosmic OS is our working philosophy for how we build and operate L&H Home Solutions software. It's a set of 13 principles, 6 invariants, and guardrails that govern how we measure, decide, and ship — all under deterministic, auditable, human-in-the-loop control.

**One-liner:** *"Cosmic OS optimizes how work is done, not what work is done."*

## Why This Matters

We're a small team that needs to move fast without breaking things. The Cosmic OS gives us:

- **Consistency** — Everyone uses the same measurement and decision framework.
- **Safety** — Guardrails prevent runaway costs, unbounded loops, and silent mutations.
- **Auditability** — Every change has an actor, reason, and diff.
- **Resilience** — Fail-open means business keeps running even when optimization systems hiccup.

## Key Things to Know Day-to-Day

### The PR Checklist (Mandatory for All PRs)

Every pull request must pass the 6-point Cosmic OS checklist (see `.github/PULL_REQUEST_TEMPLATE.md`):

1. **Deterministic execution** via versioned tuning
2. **Budgets/guardrails** enforced (time, cost, bulk)
3. **Explain()** updated with rationale and impact
4. **Envelope schema** emitted by new nodes
5. **Fail-open and rollback** paths validated
6. **PII minimized/redacted** in logs/fields

### The Three Apply Modes

| Mode | When to Use |
|------|------------|
| `recommend_only` | First time / unknown territory |
| `auto_safe` | Proven, low-risk changes |
| `auto_all_with_labels` | Requires `owner_approved` + `pilot_org` labels |

### Canary Defaults (10% Traffic)

- Rollback if: p95 > 800ms, error rate > 2%, or cost/run > $0.50

### Anti-Principles (Don't Do These)

- ✗ Hidden auto-changes (AI must not silently mutate runtime)
- ✗ Blocking on telemetry (ingest failures never fail business runs)
- ✗ Partial schemas (every node emits the uniform envelope)
- ✗ Unbounded retries or parallelism (guard every loop)

## Reference

- Canonical JSON schema: `docs/cosmic_os_principles.json`
- Full philosophy document: [LHH-23](/LHH/issues/LHH-23#document-plan)
- PR template: `.github/PULL_REQUEST_TEMPLATE.md`

## Questions?

Reach out to the CTO.
