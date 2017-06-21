FROM nginx:stable-alpine

ENV UPSTREAM_SERVER backend
ENV LISTEN_PORT 80

RUN apk add --no-cache curl
ADD nginx.conf.template /etc/nginx/nginx.conf.template
CMD /bin/sh -c "envsubst '\${UPSTREAM_SERVER} \${LISTEN_PORT}'  \
    < /etc/nginx/nginx.conf.template \
    > /etc/nginx/nginx.conf \
    && exec nginx -g 'daemon off;'"
