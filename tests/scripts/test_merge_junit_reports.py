import importlib.util
import textwrap
import xml.etree.ElementTree as ET
from pathlib import Path

import pytest


@pytest.fixture(scope="module")
def merge_module():
    module_path = (
        Path(__file__).resolve().parents[2]
        / ".github"
        / "scripts"
        / "merge-junit-reports.py"
    )
    spec = importlib.util.spec_from_file_location("merge_junit_reports", module_path)
    module = importlib.util.module_from_spec(spec)
    assert spec is not None and spec.loader is not None
    spec.loader.exec_module(module)
    return module


def _write_xml(path: Path, content: str) -> None:
    path.write_text(textwrap.dedent(content).strip() + "\n", encoding="utf-8")


def test_merge_preserves_duplicate_testcases_for_flaky_detection(tmp_path, merge_module):
    run1 = tmp_path / "run1.xml"
    run2 = tmp_path / "run2.xml"
    merged = tmp_path / "merged.xml"

    _write_xml(
        run1,
        """
        <?xml version="1.0" encoding="UTF-8"?>
        <testsuites>
          <testsuite name="ExampleSuite" package="pkg" tests="2" failures="1" errors="0" skipped="0">
            <testcase name="test_ok" classname="pkg.ExampleSuite" file="suite.py" time="0.1" />
            <testcase name="test_flaky" classname="pkg.ExampleSuite" file="suite.py" time="0.2">
              <failure message="boom">failed on first attempt</failure>
            </testcase>
          </testsuite>
        </testsuites>
        """,
    )

    _write_xml(
        run2,
        """
        <?xml version="1.0" encoding="UTF-8"?>
        <testsuites>
          <testsuite name="ExampleSuite" package="pkg" tests="2" failures="0" errors="0" skipped="0">
            <testcase name="test_ok" classname="pkg.ExampleSuite" file="suite.py" time="0.1" />
            <testcase name="test_flaky" classname="pkg.ExampleSuite" file="suite.py" time="0.2" />
          </testsuite>
        </testsuites>
        """,
    )

    merge_module.merge_reports(str(merged), [str(run1), str(run2)])

    root = ET.parse(merged).getroot()
    assert root.tag == "testsuites"
    assert root.get("tests") == "4"
    assert root.get("failures") == "1"
    assert root.get("errors") == "0"
    assert root.get("skipped") == "0"

    suites = root.findall("testsuite")
    assert len(suites) == 1

    suite = suites[0]
    assert suite.get("name") == "ExampleSuite"
    assert suite.get("package") == "pkg"
    assert suite.get("tests") == "4"
    assert suite.get("failures") == "1"
    assert suite.get("errors") == "0"
    assert suite.get("skipped") == "0"

    testcases = suite.findall("testcase")
    assert len(testcases) == 4

    flaky_cases = [
        tc
        for tc in testcases
        if tc.get("name") == "test_flaky"
        and tc.get("classname") == "pkg.ExampleSuite"
        and tc.get("file") == "suite.py"
    ]
    assert len(flaky_cases) == 2
    assert sum(1 for tc in flaky_cases if tc.find("failure") is not None) == 1


def test_hook_failures_are_reattributed_to_owning_test(tmp_path, merge_module):
    """Hook-failure entries are renamed to their owning test so a retried pass matches them."""
    failed_attempt = tmp_path / "attempt1.xml"
    passed_attempt = tmp_path / "attempt2.xml"
    merged = tmp_path / "merged.xml"

    # Attempt 1: both the beforeEach and afterEach for the test threw.
    _write_xml(
        failed_attempt,
        """
        <?xml version="1.0" encoding="UTF-8"?>
        <testsuites>
          <testsuite name="IAM user - Access Keys: " tests="2" failures="2" errors="0" skipped="0">
            <testcase name='IAM user - Access Keys:  "before each" hook for "should create access keys"' classname='"before each" hook for "should create access keys"' time="0.03">
              <failure message="EntityAlreadyExists">boom</failure>
            </testcase>
            <testcase name='IAM user - Access Keys:  "after each" hook for "should create access keys"' classname='"after each" hook for "should create access keys"' time="0.01">
              <failure message="Cannot read properties of null">boom</failure>
            </testcase>
          </testsuite>
        </testsuites>
        """,
    )

    # Attempt 2 (retry): clean pass, no hook entries.
    _write_xml(
        passed_attempt,
        """
        <?xml version="1.0" encoding="UTF-8"?>
        <testsuites>
          <testsuite name="IAM user - Access Keys: " tests="1" failures="0" errors="0" skipped="0">
            <testcase name="IAM user - Access Keys:  should create access keys" classname="should create access keys" time="0.02" />
          </testsuite>
        </testsuites>
        """,
    )

    merge_module.merge_reports(str(merged), [str(failed_attempt), str(passed_attempt)])

    suite = ET.parse(merged).getroot().find("testsuite")
    testcases = suite.findall("testcase")

    assert all("hook for" not in tc.get("name") for tc in testcases)
    assert all("hook for" not in tc.get("classname") for tc in testcases)

    owned = [
        tc
        for tc in testcases
        if tc.get("name") == "IAM user - Access Keys:  should create access keys"
        and tc.get("classname") == "should create access keys"
    ]
    assert len(owned) == 3
    assert sum(1 for tc in owned if tc.find("failure") is not None) == 2


def test_suite_level_hook_failure_reattributed_to_its_test(tmp_path, merge_module):
    """A beforeAll/afterAll failure is named after the suite's first/last test, so it is rewritten too."""
    failed_attempt = tmp_path / "attempt1.xml"
    passed_attempt = tmp_path / "attempt2.xml"
    merged = tmp_path / "merged.xml"

    # Attempt 1: beforeAll threw, so the suite's tests never ran.
    _write_xml(
        failed_attempt,
        """
        <?xml version="1.0" encoding="UTF-8"?>
        <testsuites>
          <testsuite name="S: " tests="1" failures="1" errors="0" skipped="0">
            <testcase name='S:  "before all" hook for "first test"' classname='"before all" hook for "first test"' time="0.01">
              <failure message="setup failed">boom</failure>
            </testcase>
          </testsuite>
        </testsuites>
        """,
    )

    # Attempt 2 (retry): the suite runs, first test passes.
    _write_xml(
        passed_attempt,
        """
        <?xml version="1.0" encoding="UTF-8"?>
        <testsuites>
          <testsuite name="S: " tests="1" failures="0" errors="0" skipped="0">
            <testcase name="S:  first test" classname="first test" time="0.02" />
          </testsuite>
        </testsuites>
        """,
    )

    merge_module.merge_reports(str(merged), [str(failed_attempt), str(passed_attempt)])

    testcases = ET.parse(merged).getroot().find("testsuite").findall("testcase")
    assert all("hook for" not in tc.get("name") for tc in testcases)

    owned = [tc for tc in testcases if tc.get("name") == "S:  first test"]
    assert len(owned) == 2
    assert sum(1 for tc in owned if tc.find("failure") is not None) == 1


def test_bare_hook_without_owning_test_is_left_untouched(tmp_path, merge_module):
    """A hook with no 'for "<test>"' suffix has no test to attach to and is unchanged."""
    src = tmp_path / "src.xml"
    merged = tmp_path / "merged.xml"

    _write_xml(
        src,
        """
        <?xml version="1.0" encoding="UTF-8"?>
        <testsuites>
          <testsuite name="S" tests="1" failures="1" errors="0" skipped="0">
            <testcase name='S "before all" hook' classname='"before all" hook' time="0.01">
              <failure message="setup failed">boom</failure>
            </testcase>
          </testsuite>
        </testsuites>
        """,
    )

    merge_module.merge_reports(str(merged), [str(src)])

    tc = ET.parse(merged).getroot().find("testsuite").find("testcase")
    assert tc.get("name") == 'S "before all" hook'
    assert tc.get("classname") == '"before all" hook'


def test_merge_keeps_distinct_suites_and_recomputes_totals(tmp_path, merge_module):
    first = tmp_path / "first.xml"
    second = tmp_path / "second.xml"
    merged = tmp_path / "merged.xml"

    _write_xml(
        first,
        """
        <?xml version="1.0" encoding="UTF-8"?>
        <testsuites>
          <testsuite name="SuiteA" package="pkg" tests="1" failures="0" errors="0" skipped="0">
            <testcase name="a" classname="pkg.SuiteA" time="1.0" />
          </testsuite>
          <testsuite name="SuiteB" package="pkg" tests="1" failures="0" errors="1" skipped="0">
            <testcase name="b" classname="pkg.SuiteB" time="2.0">
              <error message="err">error</error>
            </testcase>
          </testsuite>
        </testsuites>
        """,
    )

    _write_xml(
        second,
        """
        <?xml version="1.0" encoding="UTF-8"?>
        <testsuites>
          <testsuite name="SuiteA" package="pkg" tests="1" failures="0" errors="0" skipped="1">
            <testcase name="a" classname="pkg.SuiteA" time="1.5">
              <skipped />
            </testcase>
          </testsuite>
          <testsuite name="SuiteC" package="pkg" tests="1" failures="1" errors="0" skipped="0">
            <testcase name="c" classname="pkg.SuiteC" time="0.5">
              <failure message="fail">failure</failure>
            </testcase>
          </testsuite>
        </testsuites>
        """,
    )

    merge_module.merge_reports(str(merged), [str(first), str(second)])

    root = ET.parse(merged).getroot()
    assert root.get("tests") == "4"
    assert root.get("failures") == "1"
    assert root.get("errors") == "1"
    assert root.get("skipped") == "1"

    suites_by_name = {suite.get("name"): suite for suite in root.findall("testsuite")}
    assert set(suites_by_name.keys()) == {"SuiteA", "SuiteB", "SuiteC"}

    suite_a = suites_by_name["SuiteA"]
    assert suite_a.get("tests") == "2"
    assert suite_a.get("failures") == "0"
    assert suite_a.get("errors") == "0"
    assert suite_a.get("skipped") == "1"
    assert len(suite_a.findall("testcase")) == 2


def test_single_testsuite_root(tmp_path, merge_module):
    """A file whose root element is <testsuite> (not <testsuites>) is accepted."""
    src = tmp_path / "bare.xml"
    out = tmp_path / "merged.xml"

    _write_xml(
        src,
        """
        <?xml version="1.0" encoding="UTF-8"?>
        <testsuite name="Bare" package="pkg" tests="1" failures="0" errors="0" skipped="0">
          <testcase name="t" classname="pkg.Bare" time="0.5" />
        </testsuite>
        """,
    )

    merge_module.merge_reports(str(out), [str(src)])

    root = ET.parse(out).getroot()
    assert root.tag == "testsuites"
    assert root.get("tests") == "1"
    suites = root.findall("testsuite")
    assert len(suites) == 1
    assert suites[0].get("name") == "Bare"


def test_missing_file_logs_warning_and_continues(tmp_path, capsys, merge_module):
    """A non-existent input file emits a warning but does not abort the merge."""
    real = tmp_path / "real.xml"
    out = tmp_path / "merged.xml"

    _write_xml(
        real,
        """
        <?xml version="1.0" encoding="UTF-8"?>
        <testsuites>
          <testsuite name="S" package="p" tests="1" failures="0" errors="0" skipped="0">
            <testcase name="t" classname="p.S" time="0.1" />
          </testsuite>
        </testsuites>
        """,
    )

    missing = str(tmp_path / "does_not_exist.xml")
    merge_module.merge_reports(str(out), [str(real), missing])

    root = ET.parse(out).getroot()
    assert root.get("tests") == "1"
    assert f"::warning::File not found: {missing}" in capsys.readouterr().err


def test_get_suite_key(merge_module):
    """get_suite_key returns 'package::name'."""
    suite = ET.Element("testsuite")
    suite.set("name", "MyTests")
    suite.set("package", "com.example")

    assert merge_module.get_suite_key(suite) == "com.example::MyTests"


def test_get_suite_key_missing_attrs(merge_module):
    """get_suite_key handles missing name/package gracefully."""
    suite = ET.Element("testsuite")
    assert merge_module.get_suite_key(suite) == "::"


def test_time_accumulated_when_merging(tmp_path, merge_module):
    """Time values are summed across merged suites."""
    run1 = tmp_path / "r1.xml"
    run2 = tmp_path / "r2.xml"
    out = tmp_path / "merged.xml"

    _write_xml(
        run1,
        """
        <?xml version="1.0" encoding="UTF-8"?>
        <testsuites>
          <testsuite name="T" package="p" tests="1" failures="0" errors="0" skipped="0">
            <testcase name="t" classname="p.T" time="1.5" />
          </testsuite>
        </testsuites>
        """,
    )
    _write_xml(
        run2,
        """
        <?xml version="1.0" encoding="UTF-8"?>
        <testsuites>
          <testsuite name="T" package="p" tests="1" failures="0" errors="0" skipped="0">
            <testcase name="t" classname="p.T" time="2.5" />
          </testsuite>
        </testsuites>
        """,
    )

    merge_module.merge_reports(str(out), [str(run1), str(run2)])

    root = ET.parse(out).getroot()
    suite = root.find("testsuite")
    assert float(suite.get("time")) == 4.0


def test_github_output_written(tmp_path, monkeypatch, merge_module):
    """merge_reports writes totals to GITHUB_OUTPUT when the env var is set."""
    src = tmp_path / "src.xml"
    out = tmp_path / "merged.xml"
    gh_out = tmp_path / "gh_output.txt"

    _write_xml(
        src,
        """
        <?xml version="1.0" encoding="UTF-8"?>
        <testsuites>
          <testsuite name="S" package="p" tests="2" failures="1" errors="0" skipped="0">
            <testcase name="ok" classname="p.S" time="0.1" />
            <testcase name="fail" classname="p.S" time="0.2">
              <failure message="oops">oops</failure>
            </testcase>
          </testsuite>
        </testsuites>
        """,
    )

    monkeypatch.setenv("GITHUB_OUTPUT", str(gh_out))
    merge_module.merge_reports(str(out), [str(src)])

    content = gh_out.read_text()
    assert "tests=2" in content
    assert "failures=1" in content
    assert "errors=0" in content
    assert "skipped=0" in content
