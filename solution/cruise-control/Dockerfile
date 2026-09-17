# syntax=docker/dockerfile:1

# CruiseControl for koperator, built on a GPL-licensed JDK.
#
# We build this rather than consume docker.io/adobe/cruise-control because that image
# ships Oracle JDK under the No-Fee Terms and Conditions, whose redistribution clause
# does not allow bundling it in a commercial product.
#
# Packaging follows adobe/cruise-control's own docker/Dockerfile, which is where the gradle
# invocation and jar layout come from:
# https://github.com/adobe/cruise-control/blob/master/docker/Dockerfile

ARG CC_REPO=https://github.com/adobe/cruise-control.git
ARG CC_VERSION=3.0.3-adbe-20260722
ARG CC_COMMIT=c668b8316df9260dc0865e3c3f2274ebc60c5ce8

# The JDK only: the build drives Gradle through the project's own wrapper.
FROM eclipse-temurin:21.0.12_8-jdk-noble AS build

ARG CC_REPO
ARG CC_VERSION
ARG CC_COMMIT

RUN apt-get update && \
    apt-get install -y --no-install-recommends git ca-certificates && \
    rm -rf /var/lib/apt/lists/*

# gradle-semantic-build-versioning derives the project version from `git describe`, so the
# checkout has to carry the tag; cloning by commit would not. The assertion pins us to a
# known commit even though the clone is by tag.
RUN git clone --depth 1 --branch "${CC_VERSION}" "${CC_REPO}" /cruise-control && \
    test "$(git -C /cruise-control rev-parse HEAD)" = "${CC_COMMIT}"

WORKDIR /cruise-control
# koperator injects cruise-control-metrics-reporter.jar onto the Kafka broker classpath by
# that exact name, and it must be the build compiled against the broker's Kafka version.
RUN ./gradlew --console=plain --no-daemon clean jar copyDependantLibs && \
    mv -v cruise-control/build/libs/cruise-control-*.jar \
          cruise-control/build/libs/cruise-control.jar && \
    mv -v cruise-control/build/dependant-libs/cruise-control-metrics-reporter-*.jar \
          cruise-control/build/dependant-libs/cruise-control-metrics-reporter.jar

####################################################################################################
FROM eclipse-temurin:21.0.12_8-jre-noble

# CruiseControl reads webserver.ui.diskpath unconditionally, so the directory has to exist
# even though no web UI is shipped.
RUN mkdir -p /opt/cruise-control/cruise-control-ui/dist

COPY --from=build /cruise-control/cruise-control/build/libs/cruise-control.jar \
                  /opt/cruise-control/cruise-control/build/libs/cruise-control.jar
COPY --from=build /cruise-control/cruise-control/build/dependant-libs \
                  /opt/cruise-control/cruise-control/build/dependant-libs
COPY --from=build /cruise-control/config /opt/cruise-control/config
COPY --from=build /cruise-control/kafka-cruise-control-start.sh /opt/cruise-control/

# start.sh and log4j.properties, overlaying the config/ copied above -- must stay last.
COPY --from=build /cruise-control/docker/opt/cruise-control /opt/cruise-control/

EXPOSE 8090

CMD [ "/opt/cruise-control/start.sh" ]
