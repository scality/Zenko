FROM golang:stretch

RUN go get github.com/percona/mongodb_exporter

WORKDIR $GOPATH/src/github.com/percona/mongodb_exporter

RUN make \
    && mv mongodb_exporter /bin \
    && cd $GOPATH \
    && rm -rf ./src/*

WORKDIR $GOPATH

EXPOSE 9216

ENTRYPOINT  [ "/bin/mongodb_exporter" ]
