FROM golang:1.10-alpine3.7

RUN apk add --no-cache git upx \
  && go get github.com/pwaller/goupx \
  && go get -d github.com/mhausenblas/burry.sh \
  && cd /go/src/github.com/mhausenblas/burry.sh \
  && go build -ldflags="-s -w" \
  && goupx burry.sh

FROM alpine:3.7
COPY --from=0 /go/src/github.com/mhausenblas/burry.sh/burry.sh /usr/local/bin/burry

VOLUME ["/workdir"]

WORKDIR /workdir

ENTRYPOINT [ "/usr/local/bin/burry" ]
