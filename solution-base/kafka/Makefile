ROOT_DIR:=$(shell dirname $(realpath $(lastword $(MAKEFILE_LIST))))
CHART_DIR:="${ROOT_DIR}/charts"

CHART_REPO:="https://kubernetes-charts.banzaicloud.com"
KAFKA_OPERATOR_VERSION:="0.2.18"

PATCH_DIR:="${ROOT_DIR}/patches"
PATCH_FILE:="${PATCH_DIR}/cert-manager.patch"

HELM=helm

.PHONY: fetch patch

fetch: 
	@${HELM} fetch kafka-operator \
		--repo ${CHART_REPO} \
		--version ${KAFKA_OPERATOR_VERSION} \
		--untar \
		--untardir ${CHART_DIR}

patch:
	@git apply --check ${PATCH_FILE}
	@git apply ${PATCH_FILE}
