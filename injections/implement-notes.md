
---

## Extension: Implementation Notes journal (aif-ext-implementation-notes)

This project has the **implementation-notes** extension installed. While executing plan tasks, maintain an **append-only decision journal** so the reasoning behind non-obvious choices survives `/clear` and is available weeks later.

**Opt-out:** if `.ai-factory/config.yaml` contains `workflow.implementation_notes.enabled: false`, skip this entire section — behave as if the extension were not installed.

**Architecture:** markdown is the canon, HTML is a derived view.
- Canon: `.ai-factory/IMPLEMENTATION_NOTES.md` (append-only, git-friendly diff)
- Render: `.ai-factory/IMPLEMENTATION_NOTES.html` (auto-generated, never hand-edit)

### Step N0 — Initialize the journal (first task of the session)

On the **first task** you execute for this plan in this session:

1. If `.ai-factory/IMPLEMENTATION_NOTES.md` does NOT exist, create it:

   ```markdown
   # Implementation Notes — <plan filename or short description>

   Append-only journal of decisions, deviations, tradeoffs, surprises and open questions made during implementation.

   - Canon: this file (`.md`). HTML render is auto-generated, never hand-edit.

   ## Session <YYYY-MM-DD HH:mm>
   ```

2. If it already exists, append a new `## Session <YYYY-MM-DD HH:mm>` header at the end (blank line before it). All entries this session go under it.

3. Regenerate the HTML render (see "Regenerate" below).

### Step N1 — Append an entry after each completed task

After finishing a task, append **at least one** entry to the active session. Skip only if the task was a pure mechanical exec of the spec with zero deviations/surprises/tradeoffs — in that case append a single `NONE` entry with body `No deviations.` so coverage stays explicit.

**Entry format** (header schema is fixed — the renderer parses it; separator is `·` U+00B7 MIDDLE DOT, category is UPPERCASE):

```markdown
### <YYYY-MM-DD HH:mm> · Task #<N> · <CATEGORY>
**<Short title, ≤80 chars>**

1-3 sentences. What was decided/changed and the concrete reason.
Reference files like `path/to/file.ts:42` when relevant. Inline `code` and **bold** render in HTML.
```

**Categories:**

| Category | When to write |
|---|---|
| `DECISION` | Picked one of several valid implementations not specified in the plan |
| `DEVIATION` | Did something different from what the plan literally said (renamed, restructured, split, skipped) |
| `TRADEOFF` | Cut scope, deferred polish, accepted a known limitation |
| `SURPRISE` | Found something unexpected in code/data while implementing |
| `QUESTION` | Needs human confirmation before this can be considered final |
| `NONE` | Truly mechanical task — declared explicitly |

**Rules:**
- **Append-only.** Never edit or delete past entries in `.md` — past reasoning is the value.
- **One entry per distinct point.** A task with both a decision and a surprise gets two entries.
- **No agent self-state.** Past tense, fact-shaped ("Renamed X to Y because Z"), not "I will now…".
- **No secrets.** Never paste API keys, tokens, or credentialed URLs. File paths and code are fine.

### Regenerate the HTML render

After any change to `.ai-factory/IMPLEMENTATION_NOTES.md`, regenerate the HTML:

```bash
ai-factory notes render
```

Fallback if the CLI command is unavailable:

```bash
node .ai-factory/extensions/aif-ext-implementation-notes/assets/render-notes.mjs \
  .ai-factory/IMPLEMENTATION_NOTES.md \
  .ai-factory/extensions/aif-ext-implementation-notes/assets/notes-template.html \
  .ai-factory/IMPLEMENTATION_NOTES.html
```

The render is idempotent — `.html` is a pure function of `.md` + template. Never hand-edit `.html`.
