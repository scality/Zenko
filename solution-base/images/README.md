# MongoDB Images (Stop-Gap)

This directory builds stop-gap MongoDB container images for Zenko while we
transition to official MongoDB images.

## Images

| Image | Directory | Registry |
|-------|-----------|----------|
| mongodb-sharded | `mongodb-sharded/debian-12/` | `ghcr.io/scality/zenko/mongodb-sharded` |
| mongodb-exporter | `mongodb-exporter/debian-12/` | `ghcr.io/scality/zenko/mongodb-exporter` |
| os-shell | `os-shell/debian-12/` | `ghcr.io/scality/zenko/os-shell` |

## Directory Structure

```
solution-base/images/
├── README.md
├── Makefile
├── mongodb-sharded/
│   └── debian-12/
│       ├── Dockerfile
│       ├── prebuildfs/
│       └── rootfs/
├── mongodb-exporter/
│   └── debian-12/
│       ├── Dockerfile
│       └── prebuildfs/
└── os-shell/
    └── debian-12/
        ├── Dockerfile
        └── prebuildfs/
```

We intentionally keep one active version per image in this repository, so the
layout remains consistent and simple.

## Vendoring Upstream Changes (Git subtree)

Do not copy files with `cp -r`. It keeps deleted files and loses merge history.
Use Git merge semantics through `git subtree`.

1. Ensure `git subtree` is available (may require installing git contrib tools).
2. Bump `BITNAMI_<image>_REF` in `solution-base/images/Makefile` to the upstream
   commit you want, and commit that change.
3. From a clean working tree, run a single sync command:

```bash
make -C solution-base/images vendor-sync
```

This command, per image:
- creates the remote if needed,
- fetches the pinned upstream commit,
- rebuilds the vendor branch and publishes it to `origin` as
  `vendor-baseline/<image>/<upstream-sha>`, so later syncs work from any clone,
- merges upstream updates.

Notes:
- Every image is pinned to an explicit upstream commit; upstream `main` is never
  used. To pick a new one, list the release commits for the image's prefix with
  `gh api "repos/bitnami/containers/commits?path=bitnami/<image>/<path>"` and
  check the prefix still exists at that commit.
- `mongodb-sharded` cannot be bumped: upstream deleted
  `bitnami/mongodb-sharded/8.0/debian-12`, so it stays pinned to the last commit
  that still contains it.
- You need push access to `origin`, and a clean working tree.

After each upstream merge, make explicit local commits for Zenko-specific
tweaks (for example base image pin updates, script adjustments, build changes).
History should look like:

```bash
Merge upstream commit XXXX
Our tweak commit 1
Our tweak commit 2
Merge upstream commit YYYY
```

## Bumping MongoDB Version

`mongodb-sharded/debian-12/Dockerfile` expects `MONGODB_VERSION` to be provided at build time.

To bump MongoDB:
1. Update `solution-base/deps.yaml` `mongodb-sharded.tag`.
2. CI passes `MONGODB_VERSION` from `deps.yaml` during the `build-mongodb` job.
3. For local builds, pass `--build-arg MONGODB_VERSION=<version>` explicitly.
4. Also review the base image digest in each Dockerfile `FROM ...@sha256:...`.
   We keep the digest in Dockerfiles so dependency tooling can detect and
   propose updates.

## CI Tagging Policy

- CI builds happen in `.github/workflows/build-mongodb.yaml`, called by
  `end2end.yaml` and `cache-warmer.yaml`.
- Published and consumed tags are immutable: `${VERSION}-${TREE_HASH}`.
- Floating tags are not used by ISO build nor by tests.

## License

This directory vendors files from Bitnami container sources under Apache-2.0.
