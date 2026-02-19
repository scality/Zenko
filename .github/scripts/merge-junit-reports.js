'use strict';
/**
 * Download previous-attempt JUnit reports from Scality artifacts,
 * merge them with the current attempt's reports, and write two output files:
 *
 *   {outputDir}/raw-reports.xml    — current-attempt only (for future runs to download)
 *   {outputDir}/junit-merged.xml   — all attempts merged (for mikepenz/action-junit-report)
 *
 * Suites with the same name are merged so that `check_retries: true` in
 * mikepenz/action-junit-report can detect tests that failed in one attempt
 * but passed in another.
 *
 * Called from actions/github-script@v7 via require():
 *   const merge = require('./.github/scripts/merge-junit-reports.js')
 *   await merge({ core, glob, link, user, password, jobName, runAttempt, junitGlob, outputDir })
 */

const https = require('https');
const http = require('http');
const fs = require('fs');
const path = require('path');
/* @xmldom/xmldom is installed at build time; NODE_PATH is set by the calling step */
const { DOMParser, XMLSerializer } = require('@xmldom/xmldom');

const parser = new DOMParser();
const serializer = new XMLSerializer();

/** Fetch a URL with Basic auth. Returns the response body, or null on failure. */
async function fetchText(url, user, password) {
  return new Promise((resolve) => {
    const auth = `Basic ${Buffer.from(`${user}:${password}`).toString('base64')}`;
    const lib = url.startsWith('https://') ? https : http;
    lib.get(url, { headers: { Authorization: auth } }, (res) => {
      if (res.statusCode !== 200) { res.resume(); resolve(null); return; }
      const chunks = [];
      res.on('data', c => chunks.push(c));
      res.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
    }).on('error', () => resolve(null));
  });
}

/** Parse a JUnit XML string and return all <testsuite> elements. */
function parseSuites(xml) {
  const doc = parser.parseFromString(xml, 'application/xml');
  return Array.from(doc.getElementsByTagName('testsuite'));
}

/**
 * Build a merged <testsuites> XML from an array of <testsuite> DOM elements.
 * Suites sharing the same name are combined into one suite.
 */
function buildXml(allSuites) {
  const suiteMap = new Map();
  for (const s of allSuites) {
    const name = s.getAttribute('name') || '';
    if (!suiteMap.has(name)) suiteMap.set(name, []);
    suiteMap.get(name).push(s);
  }

  let totalTests = 0, totalFailures = 0, totalErrors = 0;
  const suiteParts = [];

  for (const [name, group] of suiteMap) {
    const testcases = group.flatMap(s => Array.from(s.getElementsByTagName('testcase')));
    const failures = testcases.filter(tc => tc.getElementsByTagName('failure').length > 0).length;
    const errors = testcases.filter(tc => tc.getElementsByTagName('error').length > 0).length;
    totalTests += testcases.length;
    totalFailures += failures;
    totalErrors += errors;

    const tcXml = testcases.map(tc => serializer.serializeToString(tc)).join('\n    ');
    suiteParts.push(
      `  <testsuite name="${escapeXmlAttr(name)}" tests="${testcases.length}" failures="${failures}" errors="${errors}">\n    ${tcXml}\n  </testsuite>`
    );
  }

  return (
    '<?xml version="1.0" encoding="UTF-8"?>\n' +
    `<testsuites tests="${totalTests}" failures="${totalFailures}" errors="${totalErrors}">\n` +
    suiteParts.join('\n') +
    '\n</testsuites>\n'
  );
}

/** Escape a string for use as an XML attribute value. */
function escapeXmlAttr(s) {
  return s.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

module.exports = async function mergeJUnitReports({
  core, glob,
  link, user, password,
  jobName, runAttempt,
  junitGlob, outputDir,
}) {
  // ── Current attempt's XML files ───────────────────────────────────────────
  const globber = await glob.create(junitGlob);
  const currentFiles = await globber.glob();
  core.info(`Current JUnit files: ${currentFiles.length ? currentFiles.join(', ') : '(none)'}`);

  const currentSuites = [];
  for (const f of currentFiles) {
    try {
      const suites = parseSuites(fs.readFileSync(f, 'utf8'));
      currentSuites.push(...suites);
      core.info(`Parsed ${path.basename(f)}: ${suites.length} suite(s)`);
    } catch (e) {
      core.warning(`Could not parse ${f}: ${e.message}`);
    }
  }

  // Write current-attempt raw report so future re-runs can download it
  if (currentSuites.length > 0) {
    fs.mkdirSync(outputDir, { recursive: true });
    fs.writeFileSync(path.join(outputDir, 'raw-reports.xml'), buildXml(currentSuites), 'utf8');
    core.info(`Written raw-reports.xml for attempt ${runAttempt}`);
  }

  // ── Download previous attempts' raw reports from Scality ─────────────────
  const allSuites = [...currentSuites];
  if (link && runAttempt > 1) {
    const base = link.replace(/\/$/, '');
    for (let attempt = 1; attempt < runAttempt; attempt++) {
      const url = `${base}/data/${jobName}.${attempt}/raw-reports.xml`;
      core.info(`Downloading attempt ${attempt} from ${url}...`);
      const xml = await fetchText(url, user, password);
      if (xml) {
        try {
          const suites = parseSuites(xml);
          allSuites.push(...suites);
          core.info(`Downloaded attempt ${attempt}: ${suites.length} suite(s)`);
        } catch (e) {
          core.warning(`Could not parse attempt ${attempt} reports: ${e.message}`);
        }
      } else {
        core.warning(`Attempt ${attempt} reports not available (skipped)`);
      }
    }
  }

  if (allSuites.length === 0) {
    core.warning('No JUnit XML files found; skipping merge.');
    return;
  }

  // ── Write merged XML ──────────────────────────────────────────────────────
  fs.mkdirSync(outputDir, { recursive: true });
  const mergedPath = path.join(outputDir, 'junit-merged.xml');
  fs.writeFileSync(mergedPath, buildXml(allSuites), 'utf8');
  core.info(`Merged ${allSuites.length} suite(s) → ${mergedPath}`);
};
