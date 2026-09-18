# syntax=docker/dockerfile:1

# Shared Java runtime for our kafka, kafka-connect, cruise-control and zookeeper images.
#
# Having one base rather than repeating these stages per image matters for size: the runtime
# and the patched OS end up in layers all four images share, instead of four copies that only
# look identical. Measured across the three service images, this is the difference between
# saving 21MB and saving 135MB.

ARG JDK_IMAGE=eclipse-temurin:21.0.12_8-jdk-noble
ARG BASE_IMAGE=debian:trixie-20260824-slim

####################################################################################################
# Minimal Java runtime: ~100MB, against ~300MB for the full JDK.
#
# ALL-MODULE-PATH keeps every platform module. Netty, the JMX agent, SASL and TLS reach modules
# through reflection and ServiceLoader, which jdeps cannot see, so trimming the list trades ~25MB
# for failures that only appear at runtime. --release-info keeps the vendor metadata jlink drops.
FROM ${JDK_IMAGE} AS jre_build

RUN jlink --add-modules ALL-MODULE-PATH \
          --strip-debug --no-man-pages --no-header-files --compress=zip-6 \
          --release-info ${JAVA_HOME}/release \
          --output /javaruntime

####################################################################################################
FROM ${BASE_IMAGE}

ENV JAVA_HOME=/opt/java/openjdk \
    LANG=C.UTF-8
ENV PATH=${JAVA_HOME}/bin:${PATH}

COPY --from=jre_build /javaruntime ${JAVA_HOME}

# jlink does not generate a class data sharing archive, and the stock Temurin images ship one.
# Without it the JVM starts roughly 2.5x slower, since every run re-parses the class metadata
# that CDS would otherwise map straight into memory.
RUN ${JAVA_HOME}/bin/java -Xshare:dump

# Debian's base image is only rebuilt periodically, so patch it: we pin it, so nothing else will.
# curl is used by the operators' probes, ca-certificates by anything talking TLS.
RUN apt-get update && apt-get upgrade -y && \
    apt-get install -y --no-install-recommends ca-certificates curl && \
    apt-get clean && rm -rf /var/lib/apt/lists/*
