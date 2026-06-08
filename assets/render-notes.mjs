#!/usr/bin/env node
// render-notes.mjs — render IMPLEMENTATION_NOTES.html from IMPLEMENTATION_NOTES.md
//
// Part of the aif-ext-implementation-notes AI Factory extension.
// Markdown is the canonical source; HTML is a derived, auto-regenerated view.
//
// Usage as a module:
//   import { renderNotes } from './render-notes.mjs';
//   renderNotes({ mdPath, templatePath, outPath });
//
// Usage as a CLI:
//   node render-notes.mjs <notes.md> <template.html> <output.html>
//
// Markdown structure expected:
//   # Implementation Notes — <plan name>
//   <optional meta paragraph>
//
//   ## Session <YYYY-MM-DD HH:mm>
//
//   ### <YYYY-MM-DD HH:mm> · Task #<N> · <CATEGORY>
//   **<title>**
//
//   <body paragraph(s)>
//
// The header line must match: ^### (.+?) · Task #(\d+) · (\w+)$
// (separator is U+00B7 MIDDLE DOT, not an ASCII dot). CATEGORY is uppercase.
//
// Template must contain the placeholder <!-- ENTRIES --> which is replaced
// with rendered <section class="session">…</section> blocks. The tokens
// {{PLAN_NAME}} and {{STARTED_AT}} are substituted from the markdown.

import { readFileSync, writeFileSync } from 'node:fs';

const H1_RE = /^#\s+Implementation Notes\s+—\s+(.+)$/;
const SESSION_RE = /^## Session (.+)$/;
const ENTRY_RE = /^### (.+?) · Task #(\d+) · (\w+)$/;
const TITLE_RE = /^\*\*(.+?)\*\*\s*$/;

const escapeHtml = (s) =>
  s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

// Inline-format a small markdown subset: `code` and **bold**.
const inlineMd = (s) => {
  let out = escapeHtml(s);
  out = out.replace(/`([^`]+)`/g, (_m, c) => `<code>${c}</code>`);
  out = out.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  return out;
};

/**
 * Parse a notes markdown string into structured sessions.
 * @param {string} md
 * @returns {{ planName: string, sessions: Array<{startedAt: string, entries: Array<{ts:string, task:string, cat:string, title:string, body:string}>}> }}
 */
export function parseNotes(md) {
  const lines = md.split(/\r?\n/);
  let planName = '';
  const sessions = [];
  let currentSession = null;
  let currentEntry = null;
  let bodyBuf = [];

  const flushEntry = () => {
    if (!currentEntry) return;
    currentEntry.body = bodyBuf.join('\n').trim();
    currentSession.entries.push(currentEntry);
    currentEntry = null;
    bodyBuf = [];
  };
  const flushSession = () => {
    flushEntry();
    if (currentSession) sessions.push(currentSession);
    currentSession = null;
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (!planName) {
      const hm = line.match(H1_RE);
      if (hm) {
        planName = hm[1].trim();
        continue;
      }
    }
    const sm = line.match(SESSION_RE);
    if (sm) {
      flushSession();
      currentSession = { startedAt: sm[1].trim(), entries: [] };
      continue;
    }
    const em = line.match(ENTRY_RE);
    if (em && currentSession) {
      flushEntry();
      currentEntry = {
        ts: em[1].trim(),
        task: em[2],
        cat: em[3].toLowerCase(),
        title: '',
        body: '',
      };
      // Look ahead for the bold title line, skipping blank lines after the header.
      let j = i + 1;
      while (j < lines.length && lines[j].trim() === '') j++;
      const tm = (lines[j] || '').match(TITLE_RE);
      if (tm) {
        currentEntry.title = tm[1].trim();
        i = j;
      }
      continue;
    }
    if (currentEntry) bodyBuf.push(line);
  }
  flushSession();

  return { planName, sessions };
}

const renderEntry = (e) => `
  <article class="note" data-cat="${e.cat}" data-task="${e.task}" data-ts="${escapeHtml(e.ts)}">
    <header><span class="cat">${e.cat.toUpperCase()}</span><span class="task">Task #${e.task}</span><time>${escapeHtml(e.ts)}</time></header>
    <h3>${inlineMd(e.title)}</h3>
    <p>${inlineMd(e.body)}</p>
  </article>`;

const renderSession = (s) => `
<section class="session" data-started="${escapeHtml(s.startedAt)}">
  <h2>Session ${escapeHtml(s.startedAt)}</h2>${s.entries.map(renderEntry).join('')}
</section>`;

/**
 * Render notes markdown → HTML using a template.
 * @param {{ mdPath: string, templatePath: string, outPath: string }} opts
 * @returns {{ sessions: number, entries: number }}
 */
export function renderNotes({ mdPath, templatePath, outPath }) {
  const md = readFileSync(mdPath, 'utf8');
  const tpl = readFileSync(templatePath, 'utf8');

  if (!tpl.includes('<!-- ENTRIES -->')) {
    throw new Error('Template is missing the <!-- ENTRIES --> placeholder.');
  }

  const { planName, sessions } = parseNotes(md);
  const entriesHtml = sessions.map(renderSession).join('\n');
  const firstStartedAt = sessions[0]?.startedAt ?? '';

  const output = tpl
    .replaceAll('{{PLAN_NAME}}', escapeHtml(planName || '(unknown)'))
    .replaceAll('{{STARTED_AT}}', escapeHtml(firstStartedAt || '(unknown)'))
    .replace('<!-- ENTRIES -->', entriesHtml);

  writeFileSync(outPath, output);

  const entries = sessions.reduce((acc, s) => acc + s.entries.length, 0);
  return { sessions: sessions.length, entries };
}

// CLI shim — only runs when invoked directly, not when imported.
const invokedDirectly =
  process.argv[1] && import.meta.url === new URL(`file://${process.argv[1].replace(/\\/g, '/')}`).href;

if (invokedDirectly || process.argv[1]?.endsWith('render-notes.mjs')) {
  const [, , mdPath, templatePath, outPath] = process.argv;
  if (!mdPath || !templatePath || !outPath) {
    console.error('Usage: render-notes.mjs <notes.md> <template.html> <output.html>');
    process.exit(2);
  }
  const { sessions, entries } = renderNotes({ mdPath, templatePath, outPath });
  console.log(`render-notes: ${sessions} session(s), ${entries} entry(ies) → ${outPath}`);
}
