FROM node:6
MAINTAINER Vianney Rancurel <vr@scality.com>

RUN apt-get update \
    && apt-get install -y jq python git build-essential supervisor --no-install-recommends \
    && mkdir -p /var/log/supervisor

#WORKDIR /opt/backbeat
#RUN git clone https://github.com/scality/backbeat
COPY backbeat /opt/backbeat
WORKDIR /opt/backbeat
RUN npm install

COPY config.json /opt/backbeat/backbeat/conf
COPY supervisord.conf /etc/supervisor/conf.d/supervisord.conf

#no ports exposed

CMD supervisord -c /etc/supervisor/supervisord.conf -n
