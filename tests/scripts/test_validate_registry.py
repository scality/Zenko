import re
import shlex
import shutil
import subprocess
import textwrap
from pathlib import Path

import pytest

BUILD_SH = Path(__file__).resolve().parents[2] / "solution" / "build.sh"

# Mirrors the shape of solution/zenkoversion.yaml: images live in mappings at
# several depths, next to sequences that must not be mistaken for image entries.
ZENKOVERSION = """
    ---
    apiVersion: zenko.io/v1alpha1
    kind: ZenkoVersion
    metadata:
      name: 2.14.0
    spec:
      dashboards:
        backbeat:
          image: backbeat-dashboard
          tag: 8.6.55
      policies:
        vault:
          image: vault-policy
          tag: 8.11.9
      versions:
        cloudserver:
          image: cloudserver
          tag: 8.8.44
        kafka:
          cluster:
            image: kafka
            tag: 3.9.0-8f2a1c3
      featureFlags:
        lifecycleOptimization: true
      capabilities:
        lifecycleRules:
          - Expiration
          - Transition
        locationTypes:
          - location-azure-v1
          - location-aws-s3-v1
"""

ALL_IMAGES = [
    "backbeat-dashboard:8.6.55",
    "vault-policy:8.11.9",
    "cloudserver:8.8.44",
    "kafka:3.9.0-8f2a1c3",
]


@pytest.fixture(scope="module", autouse=True)
def require_yq():
    assert shutil.which("yq"), "yq is required to run the build.sh registry tests"


@pytest.fixture(scope="module")
def validate_registry_source():
    script = BUILD_SH.read_text(encoding="utf-8")
    match = re.search(
        r"^function validate_registry\(\)\n\{\n.*?^\}$",
        script,
        re.MULTILINE | re.DOTALL,
    )
    assert match, f"validate_registry() not found in {BUILD_SH}"
    return match.group(0)


def run_validate_registry(tmp_path, source, zenkoversion=ZENKOVERSION, images=ALL_IMAGES):
    """Run build.sh's validate_registry() against a throwaway ISO root."""
    iso_root = tmp_path / "root"
    images_root = iso_root / "images"
    images_root.mkdir(parents=True)
    (iso_root / "zenkoversion.yaml").write_text(
        textwrap.dedent(zenkoversion).lstrip(), encoding="utf-8"
    )

    for image_ref in images:
        image, _, tag = image_ref.rpartition(":")
        manifest_dir = images_root / image / tag
        manifest_dir.mkdir(parents=True, exist_ok=True)
        (manifest_dir / "manifest.json").write_text("{}", encoding="utf-8")

    harness = f"""
        set -e
        set -u
        ISO_ROOT={shlex.quote(str(iso_root))}
        IMAGES_ROOT={shlex.quote(str(images_root))}

        {source}

        validate_registry
    """
    return subprocess.run(
        ["bash", "-c", textwrap.dedent(harness)],
        capture_output=True,
        text=True,
    )


def test_passes_when_every_image_is_in_the_registry(tmp_path, validate_registry_source):
    result = run_validate_registry(tmp_path, validate_registry_source)

    assert result.returncode == 0, result.stderr
    assert "Registry validation passed" in result.stdout


@pytest.mark.parametrize("missing", ALL_IMAGES)
def test_aborts_when_an_image_is_missing(tmp_path, validate_registry_source, missing):
    result = run_validate_registry(
        tmp_path,
        validate_registry_source,
        images=[image for image in ALL_IMAGES if image != missing],
    )

    assert result.returncode != 0
    assert f"Missing image in ISO registry: {missing}" in result.stdout
    assert "Registry validation passed" not in result.stdout


def test_aborts_when_the_image_list_cannot_be_read(tmp_path, validate_registry_source):
    result = run_validate_registry(
        tmp_path, validate_registry_source, zenkoversion="spec: [unterminated\n"
    )

    assert result.returncode != 0
    assert "Registry validation passed" not in result.stdout


def test_aborts_when_no_image_is_referenced(tmp_path, validate_registry_source):
    result = run_validate_registry(
        tmp_path,
        validate_registry_source,
        zenkoversion="spec:\n  capabilities:\n    locationTypes:\n      - location-azure-v1\n",
        images=[],
    )

    assert result.returncode != 0
    assert "Registry validation passed" not in result.stdout
