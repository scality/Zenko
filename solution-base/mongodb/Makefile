ROOT_DIR:=$(shell dirname $(realpath $(lastword $(MAKEFILE_LIST))))
CHART_DIR:="${ROOT_DIR}/charts"

CHART_REPO:="https://charts.bitnami.com/bitnami"
CHART_MONGO_REPLICASET_VERSION:="7.8.0"
CHART_MONGO_SHARDED_VERSION:="3.10.1"

PATCH_DIR:="${ROOT_DIR}/patches"
PATCH_FILES:="$(shell ls -d ${PATCH_DIR}/*)"

HELM=helm

.PHONY: fetch patch

fetch-mongodb: 
	@${HELM} fetch mongodb \
		--repo ${CHART_REPO} \
		--version ${CHART_MONGO_REPLICASET_VERSION} \
		--untar \
		--untardir ${CHART_DIR}

fetch-mongodb-sharded:
	@${HELM} fetch mongodb-sharded \
		--repo ${CHART_REPO} \
		--version ${CHART_MONGO_SHARDED_VERSION} \
		--untar \
		--untardir ${CHART_DIR}

patch:
	@git apply --check ${PATCH_FILES}
	@git apply ${PATCH_FILES}
