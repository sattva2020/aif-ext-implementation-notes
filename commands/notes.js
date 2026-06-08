// commands/notes.js — `ai-factory notes` CLI for aif-ext-implementation-notes
//
// Subcommands:
//   ai-factory notes render              regenerate the HTML view from the markdown canon
//   ai-factory notes path                print canonical + rendered paths
//   ai-factory notes coverage [--plan]   print last-session entries grouped + coverage vs a plan

import { existsSync, readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const TEMPLATE = resolve(__dirname, '../assets/notes-template.html');
const RENDERER = resolve(__dirname, '../assets/render-notes.mjs');

const NOTES_MD = resolve(process.cwd(), '.ai-factory/IMPLEMENTATION_NOTES.md');
const NOTES_HTML = resolve(process.cwd(), '.ai-factory/IMPLEMENTATION_NOTES.html');

const ENTRY_RE = /^### (.+?) · Task #(\d+) · (\w+)$/;
const SESSION_RE = /^## Session (.+)$/;
const TITLE_RE = /^\*\*(.+?)\*\*\s*$/;

function parse(md) {
  const lines = md.split(/\r?\n/);
  const sessions = [];
  let cur = null;
  let entry = null;
  let buf = [];
  const flushE = () => {
    if (!entry) return;
    entry.body = buf.join('\n').trim();
    cur.entries.push(entry);
    entry = null;
    buf = [];
  };
  const flushS = () => {
    flushE();
    if (cur) sessions.push(cur);
    cur = null;
  };
  for (let i = 0; i < lines.length; i++) {
    const sm = lines[i].match(SESSION_RE);
    if (sm) {
      flushS();
      cur = { startedAt: sm[1].trim(), entries: [] };
      continue;
    }
    const em = lines[i].match(ENTRY_RE);
    if (em && cur) {
      flushE();
      entry = { ts: em[1].trim(), task: em[2], cat: em[3].toUpperCase(), title: '', body: '' };
      let j = i + 1;
      while (j < lines.length && lines[j].trim() === '') j++;
      const tm = (lines[j] || '').match(TITLE_RE);
      if (tm) {
        entry.title = tm[1].trim();
        i = j;
      }
      continue;
    }
    if (entry) buf.push(lines[i]);
  }
  flushS();
  return sessions;
}

export function register(program) {
  const notes = program.command('notes').description('Manage the implementation-notes journal');

  notes
    .command('render')
    .description('Regenerate IMPLEMENTATION_NOTES.html from the markdown canon')
    .action(async () => {
      if (!existsSync(NOTES_MD)) {
        console.error(`No journal found at ${NOTES_MD}`);
        process.exit(1);
      }
      const { renderNotes } = await import(pathToFileURL(RENDERER).href);
      const { sessions, entries } = renderNotes({
        mdPath: NOTES_MD,
        templatePath: TEMPLATE,
        outPath: NOTES_HTML,
      });
      console.log(`✓ rendered ${entries} entry(ies) across ${sessions} session(s) → ${NOTES_HTML}`);
    });

  notes
    .command('path')
    .description('Print the journal canon and rendered HTML paths')
    .action(() => {
      console.log(`canon (markdown): ${NOTES_MD}${existsSync(NOTES_MD) ? '' : '  (not created yet)'}`);
      console.log(`render (html):    ${NOTES_HTML}${existsSync(NOTES_HTML) ? '' : '  (not generated yet)'}`);
      console.log(`template:         ${TEMPLATE}`);
    });

  notes
    .command('coverage')
    .description('Show last-session entries grouped by category and coverage vs a plan')
    .option('--plan <file>', 'Plan file to check completed-task coverage against')
    .action((opts) => {
      if (!existsSync(NOTES_MD)) {
        console.log('No journal yet — nothing to report.');
        return;
      }
      const sessions = parse(readFileSync(NOTES_MD, 'utf8'));
      if (!sessions.length) {
        console.log('Journal has no entries.');
        return;
      }
      const last = sessions[sessions.length - 1];
      const groups = {};
      for (const e of last.entries) (groups[e.cat] ||= []).push(e);

      console.log(`Last session: ${last.startedAt}  (${last.entries.length} entries)\n`);
      const order = ['DECISION', 'DEVIATION', 'TRADEOFF', 'SURPRISE', 'QUESTION', 'NONE'];
      const label = {
        DECISION: 'Decisions',
        DEVIATION: 'Deviations',
        TRADEOFF: 'Tradeoffs',
        SURPRISE: 'Surprises',
        QUESTION: 'Open questions',
        NONE: 'Mechanical (none)',
      };
      for (const cat of order) {
        const g = groups[cat];
        if (!g || !g.length) continue;
        console.log(`## ${label[cat]}`);
        for (const e of g) console.log(`- #${e.task} — ${e.title}${e.body ? ' — ' + e.body.replace(/\n/g, ' ') : ''}`);
        console.log('');
      }

      const questions = (groups.QUESTION || []).length;
      if (questions) console.log(`⚠ ${questions} open question(s) left for human review.\n`);

      if (opts.plan) {
        const planPath = resolve(process.cwd(), opts.plan);
        if (!existsSync(planPath)) {
          console.error(`Plan not found: ${planPath}`);
          return;
        }
        const planText = readFileSync(planPath, 'utf8');
        const completed = [...planText.matchAll(/-\s*\[x\][^\n]*?(?:Task\s*)?#?(\d+)?/gi)];
        const completedNums = new Set();
        // Best-effort: match "**N." or "Task #N" or "#N" in completed lines
        for (const line of planText.split(/\r?\n/)) {
          if (!/-\s*\[x\]/i.test(line)) continue;
          const m = line.match(/#?(\d+)[.)]?/);
          if (m) completedNums.add(m[1]);
        }
        const haveEntry = new Set(sessions.flatMap((s) => s.entries.map((e) => e.task)));
        const missing = [...completedNums].filter((n) => !haveEntry.has(n));
        console.log('## Coverage');
        console.log(`completed tasks: ${completedNums.size}, with journal entry: ${completedNums.size - missing.length}`);
        if (missing.length) console.log(`⚠ no entry for task(s): ${missing.map((n) => '#' + n).join(', ')}`);
        else console.log('✓ every completed task has at least one journal entry');
      }
    });
}
