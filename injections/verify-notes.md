
---

## Extension: Implementation Notes coverage gate (aif-ext-implementation-notes)

This project has the **implementation-notes** extension installed. During verification, check that the decision journal covers the completed work. This gate is **WARN-only** — it never fails verification (notes are an aid for the human, not a correctness contract). It is read-only — never modify the journal from `/aif-verify`.

### Step — Implementation Notes coverage

If `.ai-factory/IMPLEMENTATION_NOTES.md` exists:

1. Parse all entry headers `^### (.+?) · Task #(\d+) · (\w+)$` (separator `·` U+00B7) and collect the set of task numbers present.
2. From the plan file, collect every task marked complete (`- [x]`).
3. For each completed task with no journal entry → emit
   `WARN [notes] Task #<n> has no entry in IMPLEMENTATION_NOTES.md (expected at least one, even NONE)`.
4. Scan the **last** `## Session` block for `QUESTION` entries. If any exist → emit
   `WARN [notes] <count> open question(s) left for human review — resolve before commit`.

Include a short "Implementation Notes Coverage" line in the verification report (e.g. `6/6 completed tasks have entries; 0 open questions`).

If the journal file does not exist → skip this gate silently.

Shortcut: `ai-factory notes coverage --plan <plan-file>` prints the coverage summary directly.
