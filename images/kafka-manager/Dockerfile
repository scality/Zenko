FROM hseeberger/scala-sbt

ENV KM_VERSION=1.3.3.18

WORKDIR /tmp

RUN wget https://github.com/yahoo/kafka-manager/archive/${KM_VERSION}.tar.gz && \
    tar xvf ${KM_VERSION}.tar.gz && \
    cd kafka-manager-${KM_VERSION} && \
    sbt clean dist

WORKDIR /opt

RUN unzip -d . /tmp/kafka-manager-${KM_VERSION}/target/universal/kafka-manager-${KM_VERSION}.zip && \
    rm -fr /tmp/${KM_VERSION}.tar.gz /tmp/kafka-manager-${KM_VERSION}

WORKDIR /opt/kafka-manager-${KM_VERSION}

EXPOSE 9000
ENTRYPOINT ["./bin/kafka-manager","-Dconfig.file=conf/application.conf"]
