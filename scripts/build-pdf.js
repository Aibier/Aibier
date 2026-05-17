#!/usr/bin/env node
/**
 * Generic Markdown → PDF builder
 *
 * Usage:
 *   node scripts/build-pdf.js <input.md> [options]
 *
 * Options:
 *   --output <path>   Output PDF (default: <input>.pdf in same directory)
 *   --theme  <name>   resume | portfolio | default  (auto-detected if omitted)
 *   --help            Show usage
 *
 * Front matter (YAML block at top of .md):
 *   theme:         resume | portfolio | default
 *   title:         string
 *   format:        A4 | Letter         (default: A4)
 *   footer:        false               (disable page numbers)
 *   margin:        0.75in              (all sides; can be overridden per side)
 *   margin_top:    1in
 *   margin_bottom: 0.75in
 *   margin_left:   0.75in
 *   margin_right:  0.75in
 */

import { readFileSync, existsSync, mkdirSync } from 'fs';
import { resolve, basename, dirname, join, extname } from 'path';
import { fileURLToPath } from 'url';
import matter from 'gray-matter';
import { marked } from 'marked';
import puppeteer from 'puppeteer';

const __filename = fileURLToPath(import.meta.url);
const __dirname  = dirname(__filename);
const ROOT       = resolve(__dirname, '..');

// ── CLI parsing ──────────────────────────────────────────────────────────────

const args = process.argv.slice(2);

if (args.length === 0 || args.includes('--help') || args.includes('-h')) {
  console.log(`
Usage: node scripts/build-pdf.js <input.md> [--output <path>] [--theme <name>]

Themes:  resume | portfolio | default  (auto-detected from filename / front matter)
Format:  Add "format: Letter" to the YAML front matter for US Letter pages.

Examples:
  node scripts/build-pdf.js resume.md
  node scripts/build-pdf.js resume.md --output dist/tony-aizize-resume.pdf
  node scripts/build-pdf.js docs/spec.md --theme portfolio
  `.trim());
  process.exit(0);
}

function getFlag(flag) {
  const i = args.indexOf(flag);
  return i !== -1 ? args[i + 1] : null;
}

const inputArg = args.find(a => !a.startsWith('--'));
if (!inputArg) {
  console.error('Error: No input file specified.  Run with --help for usage.');
  process.exit(1);
}

const absInput = resolve(process.cwd(), inputArg);
if (!existsSync(absInput)) {
  console.error(`Error: File not found — ${absInput}`);
  process.exit(1);
}
if (extname(absInput).toLowerCase() !== '.md') {
  console.error('Error: Input must be a .md file.');
  process.exit(1);
}

// ── Front matter ─────────────────────────────────────────────────────────────

const raw                     = readFileSync(absInput, 'utf8');
const { data: fm, content }   = matter(raw);

// ── Output path ──────────────────────────────────────────────────────────────

const defaultOutput = absInput.replace(/\.md$/, '.pdf');
const outputPath    = resolve(process.cwd(), getFlag('--output') ?? fm.output ?? defaultOutput);

mkdirSync(dirname(outputPath), { recursive: true });

// ── Theme detection ──────────────────────────────────────────────────────────

function detectTheme() {
  const cliTheme = getFlag('--theme');
  if (cliTheme) return cliTheme;
  if (fm.theme)  return fm.theme;
  const name = basename(absInput, '.md').toLowerCase();
  if (/resume|cv/.test(name))    return 'resume';
  if (/portfolio|spec|api/.test(name)) return 'portfolio';
  return 'default';
}

const theme = detectTheme();

// ── CSS loading ───────────────────────────────────────────────────────────────

function loadCSS(themeName) {
  return ['base', themeName]
    .map(n => join(ROOT, 'templates', `${n}.css`))
    .filter(existsSync)
    .map(p => readFileSync(p, 'utf8'))
    .join('\n');
}

const css = loadCSS(theme);

// ── Markdown → HTML ──────────────────────────────────────────────────────────

// Custom heading renderer: "### Title | Date" → flex row with right-aligned date
marked.use({
  renderer: {
    heading(text, depth) {
      // Apply date-alignment only to h3 and h4
      if (depth >= 3) {
        const match = text.match(/^(.+?)\s+\|\s+(.+)$/);
        if (match) {
          return `<h${depth} class="dated">`
            + `<span class="job-title">${match[1]}</span>`
            + `<span class="job-date">${match[2]}</span>`
            + `</h${depth}>\n`;
        }
      }
      const id = text.toLowerCase().replace(/[^\w\s-]/g, '').replace(/\s+/g, '-');
      return `<h${depth} id="${id}">${text}</h${depth}>\n`;
    },
  },
});

const bodyHtml = marked.parse(content);

// ── HTML document ─────────────────────────────────────────────────────────────

const docTitle = fm.title ?? basename(absInput, '.md');

const html = /* html */`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>${escHtml(docTitle)}</title>
  <style>${css}</style>
</head>
<body>
  <article class="page">${bodyHtml}</article>
</body>
</html>`;

function escHtml(s) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

// ── PDF rendering ─────────────────────────────────────────────────────────────

const format     = fm.format      ?? 'A4';
const margin     = fm.margin      ?? '0.75in';
const showFooter = fm.footer      !== false;

const footerTemplate = showFooter
  ? `<div style="font-size:8px;color:#aaa;width:100%;text-align:right;
                 padding-right:0.8in;height:18px;line-height:18px;">
       <span class="pageNumber"></span>&nbsp;/&nbsp;<span class="totalPages"></span>
     </div>`
  : '<span></span>';

console.log(`\nBuilding PDF`);
console.log(`  Input  : ${inputArg}`);
console.log(`  Output : ${outputPath}`);
console.log(`  Theme  : ${theme}  |  Format: ${format}`);

const browser = await puppeteer.launch({
  headless: true,
  args: ['--no-sandbox', '--disable-setuid-sandbox'],
});

try {
  const page = await browser.newPage();
  await page.setContent(html, { waitUntil: 'networkidle0' });

  await page.pdf({
    path:              outputPath,
    format,
    printBackground:   true,
    margin: {
      top:    fm.margin_top    ?? margin,
      bottom: fm.margin_bottom ?? (showFooter ? '0.6in' : margin),
      left:   fm.margin_left   ?? margin,
      right:  fm.margin_right  ?? margin,
    },
    displayHeaderFooter: showFooter,
    headerTemplate:      '<span></span>',
    footerTemplate,
  });
} finally {
  await browser.close();
}

console.log(`\n✓ PDF written to: ${outputPath}\n`);
