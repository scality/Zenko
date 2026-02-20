'use strict';
/**
 * Merge JUnit XML files for cross-run flaky test detection.
 *
 * Called from actions/github-script@v7 via require():
 *   const merge = require('./.github/scripts/merge-junit-reports.js')
 *   await merge({ core, glob, currentGlob, previousGlob, outputDir })
 *
 * Writes two files to outputDir:
 *   raw-reports.xml   — current-attempt reports only (for future re-runs to download)
 *   junit-merged.xml  — all attempts merged (for mikepenz/action-junit-report)
 *
 * @xmldom/xmldom must be available on NODE_PATH.
 */

const fs = require('fs');
const path = require('path');
const { DOMParser, XMLSerializer } = require('@xmldom/xmldom');

const parser = new DOMParser();
const serializer = new XMLSerializer();

/** Parse a JUnit XML string; return all <testsuite> elements. */
function parseSuites(xml) {
  return Array.from(parser.parseFromString(xml, 'application/xml').getElementsByTagName('testsuite'));
}

/**
 * Build a merged <testsuites> XML document.
 * Suites that share the same name are combined into a single suite.
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
    const errors   = testcases.filter(tc => tc.getElementsByTagName('error').length > 0).length;
    totalTests    += testcases.length;
    totalFailures += failures;
    totalErrors   += errors;

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

/** Expand a glob pattern and parse all matching XML files. Returns an array of <testsuite> elements. */
async function parseGlob(glob, pattern, core) {
  const globber = await glob.create(pattern, { followSymbolicLinks: false });
  const files = await globber.glob();
  const suites = [];
  for (const f of files) {
    try {
      suites.push(...parseSuites(fs.readFileSync(f, 'utf8')));
      core.info(`Parsed ${path.basename(f)}: ${suites.length} suite(s) total`);
    } catch (e) {
      core.warning(`Could not parse ${f}: ${e.message}`);
    }
  }
  return suites;
}

module.exports = async function mergeJUnitReports({ core, glob, currentGlob, previousGlob, outputDir }) {
  const currentSuites  = await parseGlob(glob, currentGlob, core);
  const previousSuites = await parseGlob(glob, previousGlob, core);

  // Persist current-attempt report so future re-runs can download it
  if (currentSuites.length > 0) {
    fs.mkdirSync(outputDir, { recursive: true });
    fs.writeFileSync(path.join(outputDir, 'raw-reports.xml'), buildXml(currentSuites), 'utf8');
    core.info(`Written raw-reports.xml (${currentSuites.length} suite(s))`);
  }

  const allSuites = [...currentSuites, ...previousSuites];
  if (allSuites.length === 0) {
    core.warning('No JUnit XML files found; skipping merge.');
    return;
  }

  fs.mkdirSync(outputDir, { recursive: true });
  const mergedPath = path.join(outputDir, 'junit-merged.xml');
  fs.writeFileSync(mergedPath, buildXml(allSuites), 'utf8');
  core.info(`Merged ${allSuites.length} suite(s) into ${mergedPath}`);
};
