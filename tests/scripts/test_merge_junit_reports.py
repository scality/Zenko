import importlib.util
import textwrap
import xml.etree.ElementTree as ET
from pathlib import Path


def _load_merge_module():
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


def test_merge_preserves_duplicate_testcases_for_flaky_detection(tmp_path):
    merge_module = _load_merge_module()

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


def test_merge_keeps_distinct_suites_and_recomputes_totals(tmp_path):
    merge_module = _load_merge_module()

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


def test_single_testsuite_root(tmp_path):
    """A file whose root element is <testsuite> (not <testsuites>) is accepted."""
    merge_module = _load_merge_module()

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


def test_missing_file_is_silently_skipped(tmp_path):
    """A non-existent input file emits a warning but does not abort the merge."""
    merge_module = _load_merge_module()

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


def test_get_suite_key():
    """get_suite_key returns 'package::name'."""
    merge_module = _load_merge_module()

    suite = ET.Element("testsuite")
    suite.set("name", "MyTests")
    suite.set("package", "com.example")

    assert merge_module.get_suite_key(suite) == "com.example::MyTests"


def test_get_suite_key_missing_attrs():
    """get_suite_key handles missing name/package gracefully."""
    merge_module = _load_merge_module()

    suite = ET.Element("testsuite")
    assert merge_module.get_suite_key(suite) == "::"


def test_time_accumulated_when_merging(tmp_path):
    """Time values are summed across merged suites."""
    merge_module = _load_merge_module()

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


def test_github_output_written(tmp_path, monkeypatch):
    """merge_reports writes totals to GITHUB_OUTPUT when the env var is set."""
    merge_module = _load_merge_module()

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
