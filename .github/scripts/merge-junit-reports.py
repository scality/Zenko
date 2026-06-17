#!/usr/bin/env python3
"""
merge-reports.py - JUnit XML merger
Usage: python3 merge-reports.py output.xml input1.xml input2.xml ...

Merges JUnit XML reports by combining testsuites with the same name.
This ensures flaky test detection works properly in CI when tests are retried.
"""

import xml.etree.ElementTree as ET
import os
import re
import sys
from collections import defaultdict
from copy import deepcopy

# Mocha reports a failed hook as a synthetic testcase titled
# '"<before|after> <each|all>" hook for "<test>"' and emits nothing for the
# hook on a passing run. Capture "<test>" so the hook failure can be
# re-attributed to the test it belongs to.
HOOK_FOR_RE = re.compile(r'"(?:before|after) (?:each|all)" hook for "(.*)"')

def get_suite_key(suite):
    """Generate a unique key for a testsuite based on name and package."""
    name = suite.get('name', '')
    package = suite.get('package', '')
    return f"{package}::{name}"

def attribute_hook_failures(suite):
    """Re-attribute mocha hook-failure testcases to their owning test.

    The flaky-test detection in action-junit-report pairs a failure with a
    later pass by (name, classname, file). A hook-failure entry can never have
    a passing counterpart with the same key, so a single hook flake would fail
    the build on every retry. mocha names a failed hook after the test it ran
    for, so rewriting the entry to that test's name/classname lets a retried
    pass cancel it out. A suite-level hook with no test to attach to keeps a
    bare '"... hook"' title and is left as-is (does not happen in practice).
    """
    for tc in suite.findall('testcase'):
        for attr in ('name', 'classname'):
            value = tc.get(attr)
            if value is not None:
                tc.set(attr, HOOK_FOR_RE.sub(r'\1', value))

def merge_testsuites(testsuites_list):
    """
    Merge testsuites with the same name/package by combining their testcases.
    Preserves all testcases (including duplicates from retries) so the action
    can detect flaky tests.
    """
    # Group testsuites by their key
    suite_groups = defaultdict(list)
    for suite in testsuites_list:
        key = get_suite_key(suite)
        suite_groups[key].append(suite)

    merged_suites = []
    for _, suites in suite_groups.items():
        if len(suites) == 1:
            # No merging needed
            merged_suites.append(deepcopy(suites[0]))
        else:
            # Merge multiple suites with the same name
            merged_suite = deepcopy(suites[0])

            # Collect all testcases from all suites
            all_testcases = []
            for suite in suites:
                testcases = suite.findall('testcase')
                all_testcases.extend(deepcopy(tc) for tc in testcases)

            # Remove old testcases and add merged ones
            for tc in merged_suite.findall('testcase'):
                merged_suite.remove(tc)
            for tc in all_testcases:
                merged_suite.append(tc)

            # Recalculate suite totals
            tests = len(all_testcases)
            failures = sum(1 for tc in all_testcases if tc.find('failure') is not None)
            errors = sum(1 for tc in all_testcases if tc.find('error') is not None)
            skipped = sum(1 for tc in all_testcases if tc.find('skipped') is not None)
            time_val = sum(float(tc.get('time', 0)) for tc in all_testcases)

            merged_suite.set('tests', str(tests))
            merged_suite.set('failures', str(failures))
            merged_suite.set('errors', str(errors))
            merged_suite.set('skipped', str(skipped))
            merged_suite.set('time', str(time_val))

            merged_suites.append(merged_suite)

    return merged_suites

def merge_reports(output_file, input_files):
    all_testsuites = []

    # Collect all testsuites from all input files
    for file in input_files:
        try:
            tree = ET.parse(file)
            source_root = tree.getroot()

            # Handle both testsuites and testsuite root elements
            if source_root.tag == 'testsuites':
                testsuites = source_root.findall('testsuite')
            else:
                testsuites = [source_root]

            all_testsuites.extend(testsuites)

        except ET.ParseError as e:
            print(f"::error::Error parsing {file}: {e}", file=sys.stderr)
            sys.exit(1)
        except FileNotFoundError:
            print(f"::warning::File not found: {file}", file=sys.stderr)
            continue

    # Merge testsuites with the same name
    merged_suites = merge_testsuites(all_testsuites)

    # Build output tree
    root = ET.Element('testsuites')
    total_tests = total_failures = total_errors = total_skipped = 0

    for suite in merged_suites:
        attribute_hook_failures(suite)
        root.append(suite)
        total_tests += int(suite.get('tests', 0))
        total_failures += int(suite.get('failures', 0))
        total_errors += int(suite.get('errors', 0))
        total_skipped += int(suite.get('skipped', 0))

    root.set('tests', str(total_tests))
    root.set('failures', str(total_failures))
    root.set('errors', str(total_errors))
    root.set('skipped', str(total_skipped))

    github_output = os.environ.get('GITHUB_OUTPUT')
    if github_output:
        with open(github_output, 'a') as f:
            print(f"tests={total_tests}", file=f)
            print(f"failures={total_failures}", file=f)
            print(f"errors={total_errors}", file=f)
            print(f"skipped={total_skipped}", file=f)

    tree = ET.ElementTree(root)
    ET.indent(tree, space="  ")
    tree.write(output_file, encoding='utf-8', xml_declaration=True)
    print(f"✓ Merged {len(input_files)} files -> {output_file} ({len(merged_suites)} suites, {total_tests} tests)")

if __name__ == '__main__':
    if len(sys.argv) < 3:
        print(f"::error::Usage: {sys.argv[0]} <output.xml> <input1.xml> ...", file=sys.stderr)
        sys.exit(1)
    merge_reports(sys.argv[1], sys.argv[2:])
