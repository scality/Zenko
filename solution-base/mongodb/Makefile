ROOT_DIR:=$(shell dirname $(realpath $(lastword $(MAKEFILE_LIST))))
CHART_DIR:="${ROOT_DIR}/charts"

CHART_REPO:="https://charts.bitnami.com/bitnami"
CHART_MONGO_SHARDED_VERSION:="7.9.1"

PATCH_DIR:="${ROOT_DIR}/patches"
PATCH_FILES:=$(shell ls -d ${PATCH_DIR}/*)
HELM=helm

.PHONY: fetch patch

fetch-mongodb-sharded:
	@rm -rf ${CHART_DIR}
	@${HELM} fetch mongodb-sharded \
		--repo ${CHART_REPO} \
		--version ${CHART_MONGO_SHARDED_VERSION} \
		--untar \
		--untardir ${CHART_DIR}

patch:
	@git apply --check ${PATCH_FILES}
	@git apply ${PATCH_FILES}
