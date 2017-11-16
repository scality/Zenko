FROM node:6
MAINTAINER Vianney Rancurel <vr@scality.com>

WORKDIR /usr/src/app

COPY package.json /usr/src/app
COPY index.js /usr/src/app

RUN apt-get update \
    && apt-get install -y build-essential --no-install-recommends \
    && mkdir -p /var/log/supervisor \
    && npm install --production \
    && apt-get autoremove --purge -y build-essential \
    && rm -rf /var/lib/apt/lists/* \
    && npm cache clear \
    && rm -rf ~/.node-gyp \
    && rm -rf /tmp/npm-*

EXPOSE 9990

CMD [ "/usr/local/bin/node", "/usr/src/app/index.js" ]
