ROOT_DIR:=$(shell dirname $(realpath $(lastword $(MAKEFILE_LIST))))
CHART_DIR:="${ROOT_DIR}/charts"

CHART_REPO:="https://charts.bitnami.com/bitnami"
CHART_VERSION:="7.8.0"

PATCH_DIR:="${ROOT_DIR}/patches"
PATCH_FILES:="$(shell ls -d ${PATCH_DIR}/*)"

HELM=helm

.PHONY: fetch patch

fetch: 
	@${HELM} fetch mongodb \
		--repo ${CHART_REPO} \
		--version ${CHART_VERSION} \
		--untar \
		--untardir ${CHART_DIR}

patch:
	@git apply --check ${PATCH_FILES}
	@git apply ${PATCH_FILES}
