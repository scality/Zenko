FROM docker.io/python:3.6.5-stretch

RUN mkdir -p /usr/src/zenko-e2e
WORKDIR /usr/src/zenko-e2e

ADD requirements.txt .
RUN pip install -r requirements.txt

ADD . .

USER nobody:nogroup

ENTRYPOINT ["./docker-entrypoint.sh"]
