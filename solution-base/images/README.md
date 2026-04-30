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
2. Run a single sync command:

```bash
make -C solution-base/images vendor-sync
```

This command:
- creates the remote if needed,
- fetches upstream refs once,
- rebuilds all vendor branches at the same upstream point,
- merges upstream updates for all three images.

Notes:
- `mongodb-sharded` is pinned to a specific upstream commit in
  `solution-base/images/Makefile`, because upstream `main` no longer contains
  `bitnami/mongodb-sharded/8.0/debian-12`.
- `mongodb-exporter` and `os-shell` are split from upstream `main`.

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
2. CI passes `MONGODB_VERSION` from `deps.yaml` during `build-mongodb-images`.
3. For local builds, pass `--build-arg MONGODB_VERSION=<version>` explicitly.
4. Also review the base image digest in each Dockerfile `FROM ...@sha256:...`.
   We keep the digest in Dockerfiles so dependency tooling can detect and
   propose updates.

## CI Tagging Policy

- CI builds happen in `.github/workflows/end2end.yaml` (`build-mongodb-images`).
- Published and consumed tags are immutable: `${VERSION}-${TREE_HASH}`.
- Floating tags are not used by ISO build nor by tests.

## License

This directory vendors files from Bitnami container sources under Apache-2.0.
