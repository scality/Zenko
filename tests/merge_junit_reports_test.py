#!/usr/bin/env python3
"""Unit tests for .github/scripts/merge-junit-reports.py"""

import os
import sys
import tempfile
import textwrap
import unittest
import xml.etree.ElementTree as ET

# The script filename contains hyphens, so we use importlib to load it.
import importlib.util

_SCRIPT_PATH = os.path.join(
    os.path.dirname(__file__), '..', '.github', 'scripts',
    'merge-junit-reports.py',
)
_spec = importlib.util.spec_from_file_location('merge_junit_reports', _SCRIPT_PATH)
mjr = importlib.util.module_from_spec(_spec)
_spec.loader.exec_module(mjr)


def _write_xml(path, content):
    with open(path, 'w', encoding='utf-8') as fh:
        fh.write(textwrap.dedent(content).strip())


SUITE_ONE_PASS = """\
    <?xml version="1.0" encoding="UTF-8"?>
    <testsuites tests="2" failures="0" errors="0" time="5.0">
      <testsuite name="SuiteA" tests="2" failures="0" time="5.0">
        <testcase name="test pass" classname="SuiteA" time="2.0"/>
        <testcase name="test stable" classname="SuiteA" time="3.0"/>
      </testsuite>
    </testsuites>
"""

SUITE_ONE_FAIL = """\
    <?xml version="1.0" encoding="UTF-8"?>
    <testsuites tests="2" failures="1" errors="0" time="5.0">
      <testsuite name="SuiteA" tests="2" failures="1" time="5.0">
        <testcase name="test pass" classname="SuiteA" time="2.0"/>
        <testcase name="test flaky" classname="SuiteA" time="3.0">
          <failure message="boom">details</failure>
        </testcase>
      </testsuite>
    </testsuites>
"""

SUITE_ONE_PASS2 = """\
    <?xml version="1.0" encoding="UTF-8"?>
    <testsuites tests="2" failures="0" errors="0" time="4.0">
      <testsuite name="SuiteA" tests="2" failures="0" time="4.0">
        <testcase name="test pass" classname="SuiteA" time="2.0"/>
        <testcase name="test flaky" classname="SuiteA" time="2.0"/>
      </testsuite>
    </testsuites>
"""

SINGLE_TESTSUITE = """\
    <?xml version="1.0" encoding="UTF-8"?>
    <testsuite name="SuiteB" tests="1" failures="0" time="1.0">
      <testcase name="only test" classname="SuiteB" time="1.0"/>
    </testsuite>
"""


class TestParseSuites(unittest.TestCase):
    def test_testsuites_root(self):
        with tempfile.NamedTemporaryFile(suffix='.xml', mode='w', delete=False) as f:
            f.write(SUITE_ONE_PASS.strip())
            path = f.name
        try:
            suites = mjr.parse_suites(path)
            self.assertEqual(len(suites), 1)
            self.assertEqual(suites[0].tag, 'testsuite')
        finally:
            os.unlink(path)

    def test_single_testsuite_root(self):
        with tempfile.NamedTemporaryFile(suffix='.xml', mode='w', delete=False) as f:
            f.write(SINGLE_TESTSUITE.strip())
            path = f.name
        try:
            suites = mjr.parse_suites(path)
            self.assertEqual(len(suites), 1)
            self.assertEqual(suites[0].get('name'), 'SuiteB')
        finally:
            os.unlink(path)

    def test_invalid_xml_returns_empty(self):
        with tempfile.NamedTemporaryFile(suffix='.xml', mode='w', delete=False) as f:
            f.write('<not valid xml')
            path = f.name
        try:
            suites = mjr.parse_suites(path)
            self.assertEqual(suites, [])
        finally:
            os.unlink(path)


class TestMergeReports(unittest.TestCase):
    def setUp(self):
        self.tmpdir = tempfile.mkdtemp()

    def tearDown(self):
        import shutil
        shutil.rmtree(self.tmpdir, ignore_errors=True)

    def _make(self, name, content):
        path = os.path.join(self.tmpdir, name)
        _write_xml(path, content)
        return path

    def test_merge_two_files(self):
        f1 = self._make('run1.xml', SUITE_ONE_FAIL)
        f2 = self._make('run2.xml', SUITE_ONE_PASS2)
        out = os.path.join(self.tmpdir, 'merged.xml')
        mjr.merge_reports([f1, f2], out)

        root = ET.parse(out).getroot()
        self.assertEqual(root.tag, 'testsuites')
        # Two suites (one from each file)
        suites = list(root)
        self.assertEqual(len(suites), 2)
        # Total tests = 2 + 2
        self.assertEqual(root.get('tests'), '4')
        # Total failures = 1 (only run1 has a failure)
        self.assertEqual(root.get('failures'), '1')

    def test_merge_single_testsuite_root(self):
        f1 = self._make('single.xml', SINGLE_TESTSUITE)
        f2 = self._make('normal.xml', SUITE_ONE_PASS)
        out = os.path.join(self.tmpdir, 'merged.xml')
        mjr.merge_reports([f1, f2], out)

        root = ET.parse(out).getroot()
        self.assertEqual(len(list(root)), 2)

    def test_missing_file_is_skipped(self):
        f1 = self._make('run1.xml', SUITE_ONE_PASS)
        out = os.path.join(self.tmpdir, 'merged.xml')
        # Non-existent file should be warned about but not crash
        mjr.merge_reports([f1, '/tmp/does_not_exist_xyz.xml'], out)
        root = ET.parse(out).getroot()
        self.assertEqual(len(list(root)), 1)

    def test_glob_expansion(self):
        self._make('r1.xml', SUITE_ONE_PASS)
        self._make('r2.xml', SUITE_ONE_PASS2)
        out = os.path.join(self.tmpdir, 'merged.xml')
        mjr.merge_reports([os.path.join(self.tmpdir, 'r*.xml')], out)
        root = ET.parse(out).getroot()
        self.assertEqual(len(list(root)), 2)

    def test_empty_inputs_creates_empty_report(self):
        out = os.path.join(self.tmpdir, 'empty.xml')
        mjr.merge_reports(['/tmp/no_such_file.xml'], out)
        root = ET.parse(out).getroot()
        self.assertEqual(root.get('tests'), '0')


class TestFindFlakyTests(unittest.TestCase):
    def setUp(self):
        self.tmpdir = tempfile.mkdtemp()

    def tearDown(self):
        import shutil
        shutil.rmtree(self.tmpdir, ignore_errors=True)

    def _make(self, name, content):
        path = os.path.join(self.tmpdir, name)
        _write_xml(path, content)
        return path

    def test_detects_flaky_test(self):
        # run1: "test flaky" fails; run2: "test flaky" passes
        f1 = self._make('run1.xml', SUITE_ONE_FAIL)
        f2 = self._make('run2.xml', SUITE_ONE_PASS2)
        flaky = mjr.find_flaky_tests([f1, f2])
        self.assertIn(('SuiteA', 'test flaky'), flaky)
        counts = flaky[('SuiteA', 'test flaky')]
        self.assertEqual(counts['failed'], 1)
        self.assertEqual(counts['passed'], 1)

    def test_stable_pass_is_not_flaky(self):
        f1 = self._make('run1.xml', SUITE_ONE_PASS)
        f2 = self._make('run2.xml', SUITE_ONE_PASS)
        flaky = mjr.find_flaky_tests([f1, f2])
        self.assertEqual(len(flaky), 0)

    def test_always_failing_is_not_flaky(self):
        f1 = self._make('run1.xml', SUITE_ONE_FAIL)
        f2 = self._make('run2.xml', SUITE_ONE_FAIL)
        flaky = mjr.find_flaky_tests([f1, f2])
        # "test flaky" fails in both → not flaky, just broken
        self.assertNotIn(('SuiteA', 'test flaky'), flaky)

    def test_skipped_not_counted_as_passed(self):
        xml = """\
            <?xml version="1.0"?>
            <testsuites tests="1" failures="0" errors="0" time="0">
              <testsuite name="S" tests="1">
                <testcase name="skipped test" classname="S">
                  <skipped/>
                </testcase>
              </testsuite>
            </testsuites>
        """
        f1 = self._make('run1.xml', SUITE_ONE_FAIL)   # test flaky fails
        f2 = self._make('run2.xml', xml)               # skipped; not a pass
        flaky = mjr.find_flaky_tests([f1, f2])
        # "test flaky" only has failures, no passes → not flaky
        self.assertNotIn(('SuiteA', 'test flaky'), flaky)

    def test_error_counts_as_failure(self):
        xml = """\
            <?xml version="1.0"?>
            <testsuites tests="1" failures="0" errors="1" time="0">
              <testsuite name="SuiteA" tests="1" errors="1">
                <testcase name="test flaky" classname="SuiteA">
                  <error message="err">err details</error>
                </testcase>
              </testsuite>
            </testsuites>
        """
        f1 = self._make('run1.xml', xml)           # test flaky errors
        f2 = self._make('run2.xml', SUITE_ONE_PASS2)  # test flaky passes
        flaky = mjr.find_flaky_tests([f1, f2])
        self.assertIn(('SuiteA', 'test flaky'), flaky)


if __name__ == '__main__':
    unittest.main()
