
---

## Extension: Implementation Notes in commit body (aif-ext-implementation-notes)

This project has the **implementation-notes** extension installed. Before generating the commit message, pull decision-journal entries from the latest session into the commit body so non-obvious reasoning lands in `git log` (findable later via `git log --grep`).

**This is read-only** — never modify `.ai-factory/IMPLEMENTATION_NOTES.md` from `/aif-commit`.

### Step — Pull notes into the commit body

1. If `.ai-factory/IMPLEMENTATION_NOTES.md` does not exist, skip silently (no extension behavior).
2. Parse the **last** `## Session` block. Each entry header matches `^### (.+?) · Task #(\d+) · (\w+)$` (separator is `·` U+00B7). The bolded line after the header is the title; the paragraph(s) until the next `###`/`##` is the body.
3. Group entries by category into **Decisions / Deviations / Tradeoffs / Surprises / Open questions**. Ignore `NONE` entries.
4. If the resulting block is non-empty, append it to the commit body **below** the diff-derived bullets, separated by a blank line:

   ```
   feat(scope): subject line

   - diff-derived bullet
   - diff-derived bullet

   ## Decisions
   - #3 — Short title — reason.

   ## Open questions
   - #7 — …
   ```

5. If the block is empty (only `NONE` entries or no session), add nothing.

Shortcut: `ai-factory notes coverage` prints the parsed last-session entries grouped by category, which you can lift directly into the body.
