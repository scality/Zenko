# Shared Java Base Image

Base image for our Java services: kafka, kafka-connect, cruise-control and zookeeper. It is built
and pushed, but never deployed on its own.

It carries an [Eclipse Temurin](https://adoptium.net) runtime trimmed with `jlink`, on a pinned
Debian base whose packages are upgraded at build time.

## Why a shared image rather than repeating the stages

The same stages inlined in each Dockerfile produce layers that only *look* identical: the `jlink`
output does dedupe, but each `apt` layer is built separately and does not. Across the three service
images that is the difference between saving 21MB and saving 135MB.

Pinning our own base also means nobody else patches it -- Temurin's images are rebuilt
continuously, ours are not -- hence the `apt-get upgrade`. Without it the images scanned three
critical and ten high CVEs worse than the Temurin-based ones they replace.

## Bumping

Update `java.tag` in `solution/deps.yaml` and `JDK_IMAGE` in the Dockerfile together; the tag
is the Temurin version so that the two stay legible side by side. `BASE_IMAGE` (Debian) is pinned to
a dated tag and wants refreshing periodically.

Every image that builds `FROM` this one folds `solution/java` into its own build tree hash, so
bumping this image republishes all of them under new tags.
