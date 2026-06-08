# aif-ext-implementation-notes

An [AI Factory](https://github.com/lee-to/ai-factory) extension that keeps a
**running decision journal** while you implement — so the reasoning behind
non-obvious choices survives `/clear` and is still there weeks later.

> Inspired by [Thariq Shihipar](https://x.com/trq212/status/2052809885763747935)'s
> "keep a running implementation-notes file with the decisions you had to make
> that weren't in the spec" prompt, and his
> [HTML-as-output](https://thariqs.github.io/html-effectiveness) approach.

## What it does

While `/aif-implement` runs, after each task it appends an entry to an
**append-only journal** classifying what happened:

| Category | Meaning |
|---|---|
| `DECISION` | Picked one of several valid options not specified in the plan |
| `DEVIATION` | Did something different from what the plan literally said |
| `TRADEOFF` | Cut scope, deferred polish, accepted a known limitation |
| `SURPRISE` | Found something unexpected in the code/data |
| `QUESTION` | Needs human confirmation before it's final |
| `NONE` | Mechanical task — declared explicitly for coverage |

- **Markdown is the canon** (`.ai-factory/IMPLEMENTATION_NOTES.md`) — git-friendly, hand-editable.
- **HTML is an auto-generated view** (`.ai-factory/IMPLEMENTATION_NOTES.html`) — dark theme, category filter chips, "copy session for commit" button. Regenerated from the markdown after every change; never hand-edited.

It then wires the journal into the rest of the workflow:

| Skill | What the extension adds |
|---|---|
| `/aif-implement` | Maintains the journal (init + append + regenerate HTML) |
| `/aif-commit` | Pulls the last session's Decisions/Deviations/Open-questions into the commit body (→ findable via `git log --grep`) |
| `/aif-verify` | WARN-only coverage gate: flags completed tasks with no entry + leftover open questions |
| `/aif-archive` | Archives the journal alongside the plan, so the next plan starts clean |

All of this is **append-injection** into the base skills — it survives
`ai-factory update` (injections are re-applied automatically) and does not
fork or replace any built-in skill.

## Install

```bash
# from git
ai-factory extension add https://github.com/sattva2020/aif-ext-implementation-notes.git

# or from a local clone
ai-factory extension add ./aif-ext-implementation-notes
```

Verify:

```bash
ai-factory extension list
ai-factory notes path
```

## CLI

```bash
ai-factory notes render                          # regenerate the HTML view from markdown
ai-factory notes open                            # (via /aif-notes) render + open in browser
ai-factory notes path                            # print journal paths
ai-factory notes coverage                        # last-session entries grouped by category
ai-factory notes coverage --plan .ai-factory/PLAN.md   # + completed-task coverage check
```

Or use the `/aif-notes` skill (`render` | `open` | `coverage` | `add`).

## Opt-out per project

The journal is on by default once installed. To disable it for a project
without removing the extension, add to `.ai-factory/config.yaml`:

```yaml
workflow:
  implementation_notes:
    enabled: false
```

## Entry format

The journal markdown uses a fixed header schema (the renderer parses it;
separator is `·` U+00B7 MIDDLE DOT, category UPPERCASE):

```markdown
# Implementation Notes — <plan name>

## Session 2026-05-19 14:00

### 2026-05-19 14:12 · Task #1 · DECISION
**Short title (≤80 chars)**

1-3 sentences explaining what was decided/changed and why.
Reference files like `src/foo.ts:42`. Inline `code` and **bold** render in HTML.
```

## How it survives updates

Because the integration is **append-only injection** rather than editing the
base skills inline, `ai-factory update` can restructure `aif-implement`,
`aif-verify`, etc. freely — the extension's appended sections are
re-applied automatically after each update and remain self-contained.

## Uninstall

```bash
ai-factory extension remove aif-ext-implementation-notes
```

This strips the injections from all skills, removes the `/aif-notes` skill and
the `notes` CLI command. Your existing `IMPLEMENTATION_NOTES.md` / `.html`
files are left untouched.

## License

MIT © Ruslan Griban
