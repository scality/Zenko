FROM openjdk:8u131-jdk AS build

ENV KAFKA_MANAGER_VERSION=1.3.3.23

RUN wget "https://github.com/yahoo/kafka-manager/archive/${KAFKA_MANAGER_VERSION}.tar.gz" \
    && tar -xzf ${KAFKA_MANAGER_VERSION}.tar.gz \
    && cd /kafka-manager-${KAFKA_MANAGER_VERSION} \
    && echo 'scalacOptions ++= Seq("-Xmax-classfile-name", "200")' >> build.sbt \
    && ./sbt clean dist \
    && unzip -d ./builded ./target/universal/kafka-manager-${KAFKA_MANAGER_VERSION}.zip \
    && mv -T ./builded/kafka-manager-${KAFKA_MANAGER_VERSION} /opt/kafka-manager

FROM openjdk:8u131-jre-alpine

RUN apk update && apk add bash curl
COPY --from=build /opt/kafka-manager /opt/kafka-manager
WORKDIR /opt/kafka-manager

EXPOSE 9000
ENTRYPOINT ["./bin/kafka-manager","-Dconfig.file=conf/application.conf"]
