# Source Documents

Place your source materials in this directory before starting PRD generation.

## What to Upload

| Document Type | Purpose | Priority |
|---------------|---------|----------|
| Product overview / one-pager | Core product definition | Required |
| Pitch deck or investor memo | Business context and positioning | Recommended |
| Customer pain points / user interviews | User needs and validation | Recommended |
| Compliance, risk, or operations notes | Regulatory and operational constraints | Required for fintech |
| API docs / workflow diagrams | Technical context | Recommended |
| Current roadmap notes | Scope and timeline context | Optional |

## File Naming

Use descriptive names with dates:
```
2026-04-10-product-overview.pdf
2026-04-10-customer-interviews.md
2026-04-10-compliance-notes.md
2026-04-10-api-reference.md
```

## Notes

- The PRD agent (see `CLAUDE.md`) treats these files as the source of truth.
- Requirements not grounded in these documents will be flagged as assumptions.
- Missing documents will generate open questions in the PRD.
