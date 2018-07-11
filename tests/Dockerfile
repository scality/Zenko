FROM docker.io/python:3.6.5-stretch

ADD ./requirements.txt /tmp/requirements.txt
RUN pip install -r /tmp/requirements.txt && pip install kubernetes

ADD . /usr/src/zenko-e2e
WORKDIR /usr/src/zenko-e2e

# USER nobody:nogroup

ENTRYPOINT ["./docker-entrypoint.sh"]
