FROM golang:1.13-alpine3.10 AS build

ENV RCLONE_BASEPATH "/go/src/github.com/scality"

RUN apk add git

WORKDIR "${RCLONE_BASEPATH}"
RUN git clone https://github.com/scality/rclone.git
WORKDIR "${RCLONE_BASEPATH}/rclone"
RUN CGO_ENABLED=0 go build -a -installsuffix cgo && \
    mv rclone /bin/rclone

FROM golang:alpine AS dev
ENV MOUNT_PATH /data
COPY --from=build /bin/rclone /bin
WORKDIR ${MOUNT_PATH}
CMD ["tail -f /dev/null"]

FROM busybox
ENV MOUNT_PATH /data
COPY --from=build /bin/rclone /bin
COPY --from=build /etc/ssl/certs /etc/ssl/certs
WORKDIR ${MOUNT_PATH}
CMD ["rclone"]
