FROM node:6-alpine


ADD ./ /tests/
WORKDIR /tests
RUN chmod +x gcp_shim.sh
RUN npm install
