FROM alpine

RUN apk add openssh-client

RUN mkdir -p "/root/.ssh"

COPY entrypoint.sh /entrypoint.sh

ENTRYPOINT ["/entrypoint.sh"]
