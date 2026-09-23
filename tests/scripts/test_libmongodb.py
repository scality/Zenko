"""Regression tests for the vendored bitnami ``libmongodb.sh``.

These guard against a class of bug where a helper decides a boolean by
substring-matching mongosh's output. mongosh always prints a connection
banner containing ``directConnection=true`` on stdout, so ``grep -q "true"``
matches unconditionally and the helper can never return false.

That is exactly how ``mongodb_secondary_node_has_voting_rights`` shipped
(bitnami/containers#95156): the voting-rights grant became unreachable and
secondaries stayed at votes:0/priority:0 forever.
"""

import re
import subprocess
from pathlib import Path

import pytest

LIBMONGODB = (
    Path(__file__).resolve().parents[2]
    / "solution-base"
    / "images"
    / "mongodb-sharded"
    / "debian-12"
    / "rootfs"
    / "opt"
    / "bitnami"
    / "scripts"
    / "libmongodb.sh"
)

# Verbatim mongosh 2.9.2 preamble. The ``directConnection=true`` substring is
# the whole point of these tests: a fixture without it would happily pass on
# the broken implementation.
MONGOSH_BANNER = (
    "Current Mongosh Log ID:\t6a7ddf270f5d3c6ed07e2c0c\n"
    "Connecting to:\t\tmongodb://h:27017/admin"
    "?directConnection=true&appName=mongosh+2.9.2\n"
    "Using MongoDB:\t\t8.0.13\n"
    "Using Mongosh:\t\t2.9.2\n"
    "\n"
)


@pytest.fixture(scope="module")
def source() -> str:
    return LIBMONGODB.read_text(encoding="utf-8")


def extract_function(name: str, source: str) -> str:
    """Return the shell source of ``name``.

    ``libmongodb.sh`` sources its dependencies from absolute ``/opt/bitnami``
    paths, so it cannot be sourced outside the image; the function under test
    is lifted out instead.
    """
    match = re.search(rf"^{re.escape(name)}\(\) \{{$", source, re.MULTILINE)
    assert match is not None, f"{name} not found in {LIBMONGODB.name}"

    body = []
    for line in source[match.start():].splitlines(keepends=True):
        body.append(line)
        if line.rstrip("\n") == "}":
            return "".join(body)
    raise AssertionError(f"unterminated function {name}")


def call_with_mongosh_output(function: str, call: str, answer: str) -> int:
    """Run ``call`` with ``mongodb_execute_print_output`` stubbed out.

    The stub replays what mongosh actually writes to stdout: the connection
    banner followed by the evaluated result.
    """
    script = f"""
set -uo pipefail
debug() {{ :; }}
mongodb_execute_print_output() {{
    cat <<'MONGOSH_OUTPUT'
{MONGOSH_BANNER}{answer}
MONGOSH_OUTPUT
}}
MONGODB_INITIAL_PRIMARY_ROOT_USER=root
MONGODB_INITIAL_PRIMARY_ROOT_PASSWORD=password
MONGODB_INITIAL_PRIMARY_HOST=h
MONGODB_INITIAL_PRIMARY_PORT_NUMBER=27017
{function}
{call}
"""
    return subprocess.run(["bash", "-c", script], capture_output=True, text=True).returncode


@pytest.mark.parametrize(
    ("answer", "expected_rc"),
    [("HAS_VOTES_YES", 0), ("HAS_VOTES_NO", 1)],
)
def test_has_voting_rights_reflects_the_query_result(source, answer, expected_rc):
    """A node without votes must be reported as such, banner notwithstanding."""
    rc = call_with_mongosh_output(
        extract_function("mongodb_secondary_node_has_voting_rights", source),
        "mongodb_secondary_node_has_voting_rights node 27017",
        answer,
    )
    assert rc == expected_rc


@pytest.mark.parametrize(
    ("answer", "expected_rc"),
    [("IS_SECONDARY_YES", 0), ("IS_SECONDARY_NO", 1)],
)
def test_is_secondary_node_ready_reflects_the_query_result(source, answer, expected_rc):
    rc = call_with_mongosh_output(
        extract_function("mongodb_is_secondary_node_ready", source),
        "mongodb_is_secondary_node_ready node 27017",
        answer,
    )
    assert rc == expected_rc


def test_no_helper_matches_a_bare_boolean_in_mongosh_output(source):
    """Forbid the idiom that caused the regression.

    A bare ``true``/``false`` match is always satisfied by the connection
    banner. Deciding a boolean therefore requires either a dedicated sentinel
    or a pattern anchored on the mongosh prompt, as
    ``mongodb_is_primary_node_up`` already does.
    """
    offenders = [
        (number, line.strip())
        for number, line in enumerate(source.splitlines(), start=1)
        if re.search(r"""grep\s+-q\w*\s+(["'])(true|false)\1""", line)
    ]
    assert not offenders, (
        "mongosh prints 'directConnection=true' in its connection banner, so "
        "these matches always succeed:\n"
        + "\n".join(f"  {LIBMONGODB.name}:{n}: {t}" for n, t in offenders)
    )
