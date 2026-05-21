/**
 * Verifies that every Scenario in the ctst feature files
 * has a semver version tag (e.g. @2.6.0), either on the Feature,
 * an enclosing Rule, or directly on the scenario.
 *
 * Exits with code 1 and lists offenders if any are missing.
 */

/* eslint-disable no-console */

import { Parser, AstBuilder, GherkinClassicTokenMatcher } from '@cucumber/gherkin';
import { IdGenerator } from '@cucumber/messages';
import * as fs from 'fs';
import * as path from 'path';

const VERSION_TAG_REGEX = /^@\d+\.\d+\.\d+$/;
const FEATURES_DIR = path.resolve(__dirname, '../features');

function collectFeatureFiles(dir: string): string[] {
    const files: string[] = [];
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        const full = path.join(dir, entry.name);
        if (entry.isDirectory()) {
            files.push(...collectFeatureFiles(full));
        } else if (entry.name.endsWith('.feature')) {
            files.push(full);
        }
    }
    return files;
}

let totalScenarios = 0;
const offenders: string[] = [];
const parser = new Parser(new AstBuilder(IdGenerator.incrementing()), new GherkinClassicTokenMatcher());

for (const file of collectFeatureFiles(FEATURES_DIR)) {
    const rel = path.relative(FEATURES_DIR, file);
    const ast = parser.parse(fs.readFileSync(file, 'utf8'));
    const feature = ast.feature;
    if (!feature) { continue; }

    const featureHasVersion = feature.tags.some(t => VERSION_TAG_REGEX.test(t.name));

    for (const child of feature.children) {
        if (child.scenario) {
            totalScenarios++;
            const hasVersion = featureHasVersion || child.scenario.tags.some(t => VERSION_TAG_REGEX.test(t.name));
            if (!hasVersion) {
                offenders.push(`  ${rel}:${child.scenario.location.line} — "${child.scenario.name}"`);
            }
        } else if (child.rule) {
            // Version tag can be inherited from Feature or Rule
            const ruleHasVersion = child.rule.tags.some(t => VERSION_TAG_REGEX.test(t.name));
            for (const ruleChild of child.rule.children) {
                if (!ruleChild.scenario) { continue; } // skip Background inside Rule
                totalScenarios++;
                const hasVersion = featureHasVersion || ruleHasVersion
                    || ruleChild.scenario.tags.some(t => VERSION_TAG_REGEX.test(t.name));
                if (!hasVersion) {
                    offenders.push(`  ${rel}:${ruleChild.scenario.location.line} — "${ruleChild.scenario.name}"`);
                }
            }
        }
        // Background nodes are intentionally ignored
    }
}

if (offenders.length > 0) {
    console.error(`\n${offenders.length} scenario(s) missing a version tag (@X.Y.Z):\n`);
    offenders.forEach(o => console.error(o));
    console.error('\nAdd a version tag (e.g. @2.15.0) to each scenario or its parent Feature.\n');
    process.exit(1);
}

console.log(`All ${totalScenarios} scenarios have a version tag.`);
