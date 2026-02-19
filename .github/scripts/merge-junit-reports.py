#!/usr/bin/env python3
"""Merge multiple JUnit XML reports and detect flaky tests across re-runs."""

import argparse
import glob as glob_module
import os
import sys
import xml.etree.ElementTree as ET
from collections import defaultdict


def parse_suites(filepath):
    """Parse a JUnit XML file and return a list of testsuite elements."""
    try:
        tree = ET.parse(filepath)
        root = tree.getroot()
        if root.tag == 'testsuites':
            return list(root)
        elif root.tag == 'testsuite':
            return [root]
        else:
            print(
                f"Warning: unknown root element '{root.tag}' in {filepath}",
                file=sys.stderr,
            )
            return []
    except ET.ParseError as exc:
        print(f"Warning: failed to parse {filepath}: {exc}", file=sys.stderr)
        return []


def expand_inputs(patterns):
    """Expand glob patterns to a sorted list of existing files."""
    files = []
    for pattern in patterns:
        matches = sorted(glob_module.glob(pattern))
        if matches:
            files.extend(matches)
        elif not glob_module.has_magic(pattern):
            if os.path.exists(pattern):
                files.append(pattern)
            else:
                print(f"Warning: file not found: {pattern}", file=sys.stderr)
        else:
            print(f"Warning: no files matched: {pattern}", file=sys.stderr)
    return files


def merge_reports(input_patterns, output_file):
    """Merge multiple JUnit XML files, keeping all test runs from all files."""
    input_files = expand_inputs(input_patterns)

    all_suites = []
    for filepath in input_files:
        suites = parse_suites(filepath)
        all_suites.extend(suites)
        if suites:
            print(f"Parsed: {filepath} ({len(suites)} suite(s))")

    if not all_suites:
        print("No test suites found; creating empty report.", file=sys.stderr)
        root = ET.Element(
            'testsuites', tests='0', failures='0', errors='0', time='0'
        )
    else:
        total_tests = sum(int(s.get('tests', '0')) for s in all_suites)
        total_failures = sum(int(s.get('failures', '0')) for s in all_suites)
        total_errors = sum(int(s.get('errors', '0')) for s in all_suites)
        total_time = sum(float(s.get('time', '0')) for s in all_suites)

        root = ET.Element(
            'testsuites',
            tests=str(total_tests),
            failures=str(total_failures),
            errors=str(total_errors),
            time=f'{total_time:.3f}',
        )
        for suite in all_suites:
            root.append(suite)

    out_dir = os.path.dirname(os.path.abspath(output_file))
    os.makedirs(out_dir, exist_ok=True)

    tree = ET.ElementTree(root)
    ET.indent(tree, space='  ')
    with open(output_file, 'wb') as fh:
        tree.write(fh, encoding='utf-8', xml_declaration=True)

    print(
        f"Merged {len(input_files)} file(s) with {len(all_suites)} "
        f"suite(s) into {output_file}"
    )


def find_flaky_tests(input_patterns):
    """Return a dict of flaky tests: tests that both passed and failed."""
    input_files = expand_inputs(input_patterns)

    # (classname, name) -> {passed: int, failed: int}
    results = defaultdict(lambda: {'passed': 0, 'failed': 0})

    for filepath in input_files:
        for suite in parse_suites(filepath):
            for testcase in suite.iter('testcase'):
                name = testcase.get('name', '')
                classname = testcase.get('classname', '')
                key = (classname, name)

                has_failure = testcase.find('failure') is not None
                has_error = testcase.find('error') is not None
                has_skipped = testcase.find('skipped') is not None

                if has_failure or has_error:
                    results[key]['failed'] += 1
                elif not has_skipped:
                    results[key]['passed'] += 1

    return {
        key: counts
        for key, counts in results.items()
        if counts['passed'] > 0 and counts['failed'] > 0
    }


def report_flaky(input_patterns):
    """Detect and report flaky tests; write a GitHub step summary."""
    flaky = find_flaky_tests(input_patterns)

    summary_file = os.environ.get('GITHUB_STEP_SUMMARY')

    if flaky:
        print(f"\n⚠️  Found {len(flaky)} flaky test(s):")
        lines = [
            f"## ⚠️ Flaky Tests Detected ({len(flaky)})\n\n",
            "These tests had both passing and failing runs across re-runs:\n\n",
            "| Test | Passed runs | Failed runs |\n",
            "|------|-------------|-------------|\n",
        ]
        for (classname, name), counts in sorted(flaky.items()):
            display = f"{classname}::{name}" if classname else name
            lines.append(
                f"| `{display}` | {counts['passed']} | {counts['failed']} |\n"
            )
            print(
                f"  - {display} "
                f"(passed: {counts['passed']}, failed: {counts['failed']})"
            )
        if summary_file:
            with open(summary_file, 'a', encoding='utf-8') as fh:
                fh.writelines(lines)
        else:
            print("".join(lines))
    else:
        print("✅ No flaky tests detected.")
        if summary_file:
            with open(summary_file, 'a', encoding='utf-8') as fh:
                fh.write(
                    "## ✅ No Flaky Tests Detected\n\n"
                    "All tests were consistent across re-runs.\n"
                )

    return len(flaky)


def main():
    parser = argparse.ArgumentParser(
        description='Merge JUnit XML reports and detect flaky tests'
    )
    sub = parser.add_subparsers(dest='command')

    merge_p = sub.add_parser('merge', help='Merge multiple JUnit reports')
    merge_p.add_argument(
        'inputs', nargs='+',
        help='Input JUnit XML files or glob patterns'
    )
    merge_p.add_argument(
        '-o', '--output', required=True, help='Output merged XML file'
    )

    flaky_p = sub.add_parser('flaky', help='Detect and report flaky tests')
    flaky_p.add_argument(
        'inputs', nargs='+',
        help='JUnit XML files or glob patterns to analyse'
    )

    args = parser.parse_args()

    if args.command == 'merge':
        merge_reports(args.inputs, args.output)
    elif args.command == 'flaky':
        report_flaky(args.inputs)
    else:
        parser.print_help()
        sys.exit(1)


if __name__ == '__main__':
    main()
