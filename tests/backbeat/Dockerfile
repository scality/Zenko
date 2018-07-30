FROM node:6-alpine


ADD ./ /tests/
WORKDIR /tests
# Install git for pulling Scality JS linting guidelines
RUN apk add --update git
RUN chmod +x gcp_shim.sh
RUN npm install
