#!/usr/bin/env python3
"""
merge-reports.py - JUnit XML merger
Usage: python3 merge-reports.py output.xml input1.xml input2.xml ...
"""

import xml.etree.ElementTree as ET
import sys

def merge_reports(output_file, input_files):
    root = ET.Element('testsuites')
    total_tests = total_failures = total_errors = total_skipped = 0

    for file in input_files:
        try:
            tree = ET.parse(file)
            source_root = tree.getroot()

            # Handle both testsuites and testsuite root elements
            testsuites = source_root.findall('testsuite') if source_root.tag == 'testsuites' else [source_root]

            for suite in testsuites:
                root.append(suite)
                total_tests += int(suite.get('tests', 0))
                total_failures += int(suite.get('failures', 0))
                total_errors += int(suite.get('errors', 0))
                total_skipped += int(suite.get('skipped', 0))

        except ET.ParseError as e:
            print(f"Error parsing {file}: {e}", file=sys.stderr)
            sys.exit(1)

    root.set('tests', str(total_tests))
    root.set('failures', str(total_failures))
    root.set('errors', str(total_errors))
    root.set('skipped', str(total_skipped))

    tree = ET.ElementTree(root)
    ET.indent(tree, space="  ")
    tree.write(output_file, encoding='utf-8', xml_declaration=True)
    print(f"✓ Merged {len(input_files)} files -> {output_file}")

if __name__ == '__main__':
    if len(sys.argv) < 3:
        print(f"Usage: {sys.argv[0]} <output.xml> <input1.xml> ...", file=sys.stderr)
        sys.exit(1)
    merge_reports(sys.argv[1], sys.argv[2:])
