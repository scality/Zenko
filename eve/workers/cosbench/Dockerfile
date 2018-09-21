FROM python:3-alpine

ADD ./trigger_run.sh /usr/local/bin/
ADD ./ /cosbench
WORKDIR /cosbench
RUN apk add --update curl && rm -rf /var/cache/apk/* && \
    chmod +x /usr/local/bin/trigger_run.sh && \
    pip install -r requirements.txt
