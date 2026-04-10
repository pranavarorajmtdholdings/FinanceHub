# PRD Generation Workflow

A staged approach to producing high-quality fintech PRDs. Do not attempt to generate the full PRD in a single pass.

## Prerequisites

1. Upload source documents into `docs/prd/source-docs/`:
   - Product overview or one-pager
   - Pitch deck or investor memo
   - Customer pain points and user interviews
   - Compliance, risk, or operations notes
   - API docs, workflow diagrams, and roadmap notes

2. Review the Claude Project instructions in `CLAUDE.md` at the repo root.

---

## Step 1: Extract Requirements and Open Questions

**Goal:** Build a structured inventory of everything the source docs say and don't say.

```text
Review all uploaded source materials. Extract and organize:
1. Explicit requirements (directly stated)
2. Implied requirements (logically necessary but not stated)
3. Dependencies (systems, teams, vendors, regulatory)
4. Open questions (gaps, ambiguities, missing information)

Present this as a structured list, not prose. Flag confidence level for each item.
```

**Checkpoint:** Review the extraction before proceeding. Add any missing items.

---

## Step 2: Produce a PRD Outline

**Goal:** Agree on structure and scope before drafting full sections.

```text
Based on the requirements extraction, propose a PRD outline using the template
in docs/prd/templates/prd-template.md. For each section, include a 1-2 sentence
summary of what will go there. Identify which sections have strong source support
and which will require assumptions.
```

**Checkpoint:** Confirm the outline scope. Remove sections that don't apply. Add any domain-specific sections needed.

---

## Step 3: Draft Section by Section

**Goal:** Expand each section with explicit assumptions and dependencies.

```text
Draft the following PRD section: [SECTION NAME]

Rules:
- Ground every requirement in source material where possible.
- State assumptions explicitly in the Assumptions table.
- Include acceptance criteria that are testable.
- For fintech sections, include the infrastructure-specific details from the
  fintech add-on prompt (docs/prd/prompts/fintech-addon.md).
```

Repeat for each section. Review after each major section group:
- Problem + Users + Goals
- Solution + User Stories + Functional Requirements
- Operational + Compliance + Risk
- Data Model + Metrics + MVP Scope
- Open Questions + Acceptance Criteria

---

## Step 4: Reviewer Pass

**Goal:** Catch gaps, weak requirements, and vague acceptance criteria.

```text
Review the complete PRD as a critical product reviewer. Check for:
1. Missing user flows or edge cases
2. Requirements that are too vague to implement or test
3. Acceptance criteria that are not testable
4. Operational requirements that assume manual processes without stating them
5. Compliance or risk sections that are generic rather than specific to this product
6. Assumptions that are not flagged
7. Scope creep beyond MVP
8. Missing dependencies or integration points

Provide a numbered list of issues with severity (Critical / Major / Minor)
and suggested fixes.
```

**Checkpoint:** Address all Critical and Major issues before finalizing.

---

## Output

The final PRD should be saved to `docs/prd/` with a descriptive filename:
```
docs/prd/PRD-[product-name]-v[version].md
```

Example: `docs/prd/PRD-payment-rails-v1.md`
