FROM golang:1.10-alpine3.7 AS build

ENV RCLONE_VERSION "v1.45"
ENV RCLONE_BASEPATH "/go/src/github.com/ncw"

WORKDIR ${RCLONE_BASEPATH}
ADD https://github.com/ncw/rclone/releases/download/${RCLONE_VERSION}/rclone-${RCLONE_VERSION}.tar.gz .
RUN tar xvf rclone-${RCLONE_VERSION}.tar.gz && \
    mv rclone-${RCLONE_VERSION} ${RCLONE_BASEPATH}/rclone
COPY patches ${RCLONE_BASEPATH}/rclone/patches
WORKDIR "${RCLONE_BASEPATH}/rclone"
RUN for file in patches/*.diff ; do \
        patch -p1 < "$file" || exit 1 ; \
    done && \
    CGO_ENABLED=0 go build -a -installsuffix cgo && \
    mv rclone /bin/rclone

FROM golang:alpine AS dev
ENV MOUNT_PATH /data
COPY --from=build /bin/rclone /bin
WORKDIR ${MOUNT_PATH}
CMD ["tail -f /dev/null"]

FROM busybox
ENV MOUNT_PATH /data
COPY --from=build /bin/rclone /bin
WORKDIR ${MOUNT_PATH}
CMD ["rclone"]
