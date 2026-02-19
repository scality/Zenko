#!/usr/bin/env node
'use strict';
/**
 * Merge multiple JUnit XML files for cross-run flaky test detection.
 *
 * Suites with the same name across files are combined so that
 * mikepenz/action-junit-report check_retries can detect tests that failed in
 * one attempt but passed in another (both testcase entries end up in the same
 * suite, which is what check_retries inspects).
 *
 * Assumes standard JUnit format with no nested <testsuite> elements
 * (i.e. <testsuites> -> <testsuite> -> <testcase>).
 *
 * Usage: node merge-junit-reports.js <output> <input1> [input2 ...]
 */

const fs = require('fs');
const path = require('path');

const [, , output, ...inputs] = process.argv;

if (!output || inputs.length === 0) {
  process.stderr.write('Usage: node merge-junit-reports.js <output> <input1> [input2 ...]\n');
  process.exit(1);
}

/**
 * Extract all top-level <testsuite>...</testsuite> blocks from an XML string.
 * Returns an array of objects: { name, inner }
 * where `inner` is the content between the opening and closing testsuite tags.
 *
 * Handles both <testsuites> root and bare <testsuite> root.
 * Assumes no nested <testsuite> elements (standard JUnit format).
 */
function extractSuites(xml) {
  // Strip XML declaration
  xml = xml.replace(/<\?xml[^?]*\?>\s*/i, '');

  // Unwrap <testsuites> root if present
  const tsMatch = xml.match(/^<testsuites\b[^>]*>([\s\S]*)<\/testsuites>\s*$/);
  const inner = tsMatch ? tsMatch[1] : xml;

  const suites = [];
  let pos = 0;
  while (pos < inner.length) {
    const start = inner.indexOf('<testsuite', pos);
    if (start === -1) break;

    // Get the opening tag (up to and including '>')
    const openEnd = inner.indexOf('>', start);
    if (openEnd === -1) break;
    const openTag = inner.slice(start, openEnd + 1);

    // Self-closing <testsuite ... /> — treat as empty suite
    if (openTag.endsWith('/>')) {
      const nameMatch = openTag.match(/\bname="([^"]*)"/);
      suites.push({ name: nameMatch ? nameMatch[1] : '', inner: '' });
      pos = openEnd + 1;
      continue;
    }

    // Find closing tag
    const closeStart = inner.indexOf('</testsuite>', openEnd + 1);
    if (closeStart === -1) break;

    const nameMatch = openTag.match(/\bname="([^"]*)"/);
    suites.push({
      name: nameMatch ? nameMatch[1] : '',
      inner: inner.slice(openEnd + 1, closeStart),
    });
    pos = closeStart + '</testsuite>'.length;
  }
  return suites;
}

// Collect suites keyed by name; merge same-name suites across files
const suiteMap = new Map(); // name -> concatenated inner content

let fileCount = 0;
for (const file of inputs) {
  if (!fs.existsSync(file)) {
    process.stderr.write(`Warning: file not found: ${file}\n`);
    continue;
  }

  let xml;
  try {
    xml = fs.readFileSync(file, 'utf8');
  } catch (e) {
    process.stderr.write(`Warning: could not read ${file}: ${e.message}\n`);
    continue;
  }

  const suites = extractSuites(xml);
  fileCount++;

  for (const { name, inner } of suites) {
    if (suiteMap.has(name)) {
      suiteMap.set(name, suiteMap.get(name) + '\n' + inner);
    } else {
      suiteMap.set(name, inner);
    }
  }

  process.stdout.write(`Parsed ${file}: ${suites.length} suite(s)\n`);
}

if (fileCount === 0) {
  process.stderr.write('No input files were found or readable\n');
  process.exit(1);
}

// Build merged XML
let totalTests = 0;
let totalFailures = 0;
let totalErrors = 0;

const outputSuites = [];
for (const [name, combined] of suiteMap) {
  const tests = (combined.match(/<testcase\b/g) || []).length;
  const failures = (combined.match(/<failure\b/g) || []).length;
  const errors = (combined.match(/<error\b/g) || []).length;

  totalTests += tests;
  totalFailures += failures;
  totalErrors += errors;

  const escapedName = name
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
  outputSuites.push(
    `  <testsuite name="${escapedName}" tests="${tests}" failures="${failures}" errors="${errors}">${combined}\n  </testsuite>`
  );
}

const merged =
  '<?xml version="1.0" encoding="UTF-8"?>\n' +
  `<testsuites tests="${totalTests}" failures="${totalFailures}" errors="${totalErrors}">\n` +
  outputSuites.join('\n') +
  '\n</testsuites>\n';

fs.mkdirSync(path.dirname(path.resolve(output)), { recursive: true });
fs.writeFileSync(output, merged, 'utf8');
process.stdout.write(
  `Merged ${fileCount} file(s), ${suiteMap.size} suite(s) into ${output}\n`
);
