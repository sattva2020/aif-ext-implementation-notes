
---

## Extension: Archive the Implementation Notes journal (aif-ext-implementation-notes)

This project has the **implementation-notes** extension installed. When a plan is archived, archive its decision journal alongside it so the next plan starts with a clean journal (the journal is per-plan, not eternal).

### Step — Archive the journal with the plan

When you move a completed plan into the archive (`paths.archive`, default `.ai-factory/archive/`):

1. If `.ai-factory/IMPLEMENTATION_NOTES.md` exists and is non-empty (has at least one `### … · Task #…` entry):
   - Create `<paths.archive>/notes/` if needed.
   - Move the journal canon to `<paths.archive>/notes/<archived-plan-stem>-IMPLEMENTATION_NOTES.md` (use the same stem the plan was archived under, e.g. `0005_feature-auth`).
   - Move/regenerate the matching `.html` to `<paths.archive>/notes/<archived-plan-stem>-IMPLEMENTATION_NOTES.html` (or just move the existing `.html`; it is a derived artifact).
   - Remove the live `.ai-factory/IMPLEMENTATION_NOTES.md` and `.html` so the next plan's first task starts a fresh journal.
2. If the journal does not exist or has no entries, do nothing.
3. In `--all` mode (archiving multiple plans), only the single live journal exists — archive it under the **most recently completed** plan's stem, and note this in the summary.

This keeps each plan's reasoning bundled with the plan it belongs to.
