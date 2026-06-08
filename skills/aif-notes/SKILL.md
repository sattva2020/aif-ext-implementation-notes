---
name: aif-notes
description: View, regenerate, or summarize the implementation-notes decision journal. Use when the user says "show notes", "open implementation notes", "regenerate notes html", "what decisions did we make", or "notes coverage".
argument-hint: '[render | open | coverage | add]'
allowed-tools: Read Edit Bash(ai-factory notes *) Bash(node *) Bash(start *) Bash(open *) Bash(xdg-open *)
disable-model-invocation: false
metadata:
  author: aif-ext-implementation-notes
  version: '1.0'
  category: workflow
---

# Notes — Implementation decision journal

Manual control over the append-only decision journal maintained by the
**aif-ext-implementation-notes** extension during `/aif-implement`.

- Canon: `.ai-factory/IMPLEMENTATION_NOTES.md` (append-only, never auto-edit past entries)
- Render: `.ai-factory/IMPLEMENTATION_NOTES.html` (auto-generated, never hand-edit)

## Modes

Parse `$ARGUMENTS`:

### `render` (default)

Regenerate the HTML view from the markdown canon:

```bash
ai-factory notes render
```

If the CLI command is unavailable, fall back to:

```bash
node .ai-factory/extensions/aif-ext-implementation-notes/assets/render-notes.mjs \
  .ai-factory/IMPLEMENTATION_NOTES.md \
  .ai-factory/extensions/aif-ext-implementation-notes/assets/notes-template.html \
  .ai-factory/IMPLEMENTATION_NOTES.html
```

### `open`

Render first, then open the HTML in the default browser:

- Windows: `start .ai-factory/IMPLEMENTATION_NOTES.html`
- macOS: `open .ai-factory/IMPLEMENTATION_NOTES.html`
- Linux: `xdg-open .ai-factory/IMPLEMENTATION_NOTES.html`

### `coverage`

Print the last session's entries grouped by category and flag open questions:

```bash
ai-factory notes coverage
# optionally check against a plan's completed tasks:
ai-factory notes coverage --plan .ai-factory/PLAN.md
```

### `add`

Interactively append one entry. Ask the user for: task number, category
(DECISION / DEVIATION / TRADEOFF / SURPRISE / QUESTION / NONE), a short title,
and a 1-3 sentence body. Then append to the active `## Session` in
`.ai-factory/IMPLEMENTATION_NOTES.md` using the fixed header schema:

```markdown
### <YYYY-MM-DD HH:mm> · Task #<N> · <CATEGORY>
**<title>**

<body>
```

(separator is `·` U+00B7 MIDDLE DOT; category UPPERCASE). Then run
`ai-factory notes render`. Never edit or delete prior entries.

## Rules

- Markdown is the source of truth; HTML is always regenerated, never hand-edited.
- The journal is append-only — past reasoning is the value, do not rewrite it.
- Never write secrets (API keys, tokens, credentialed URLs) into entries.
