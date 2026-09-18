# CruiseControl Docker Image

Docker file for building [CruiseControl](https://github.com/adobe/cruise-control) from Adobe's fork,
running on an Eclipse Temurin runtime trimmed with `jlink`.

We build it ourselves because the published `adobe/cruise-control` images ship Oracle JDK under the
No-Fee Terms and Conditions, which does not allow redistribution as part of a commercial product.

Adobe's fork is used rather than upstream `linkedin/cruise-control` because it is the only one built
against Kafka 3.9. koperator injects `cruise-control-metrics-reporter.jar` onto the broker classpath,
and the upstream build (Kafka 3.5) calls methods that Kafka 3.9 removed, which makes brokers fail at
startup.

The source is cloned at build time rather than vendored, since the build context is the whole
upstream repository. It is cloned by tag because the version is derived from `git describe`, and the
commit is then asserted to pin it.

The upstream Dockerfile also bundles a web UI, built from an unpinned clone of a personal repository
on a long-EOL `node:10`. Nothing in Zenko uses it, so it is not built -- but the directory it would
live in still has to exist, because `webserver.ui.diskpath` is read unconditionally.

## Bumping

Update `kafka-cruise-control.tag` in `solution/deps.yaml` and `CC_COMMIT` in the Dockerfile to the
commit that tag points at. The build asserts the two agree, so a mismatch fails loudly.
