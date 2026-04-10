# Master PRD Generation Prompt

Use this prompt after uploading source documents into `docs/prd/source-docs/`.

---

## Prompt

```text
Using the uploaded company materials, create a PRD for our fintech infrastructure product.

Process:
1. First extract all explicit requirements, implied requirements, dependencies, and open questions from the source materials.
2. Then propose a PRD outline.
3. Then draft the full PRD using the template in docs/prd/templates/prd-template.md.
4. Clearly separate facts from assumptions.
5. Mark any area where source materials are too vague to support a confident requirement.
6. Avoid generic startup language and avoid inventing product differentiation not present in the documents.

The PRD should be suitable for product, engineering, compliance, and operations review.
```

## Usage Notes

- Do not ask Claude to write the entire PRD in one shot.
- Follow the staged workflow in `docs/prd/workflow/prd-workflow.md`.
- Use the fintech add-on prompt from `docs/prd/prompts/fintech-addon.md` for infrastructure-specific depth.
