ROOT_DIR:=$(shell dirname $(realpath $(lastword $(MAKEFILE_LIST))))
CHART_DIR:="${ROOT_DIR}/charts"

CHART_REPO:="https://charts.bitnami.com/bitnami"
CHART_MONGO_REPLICASET_VERSION:="7.8.0"
CHART_MONGO_SHARDED_VERSION:="6.6.7"

PATCH_DIR:="${ROOT_DIR}/patches"
PATCH_FILES := $(shell ls -d ${PATCH_DIR}/* | tr '\n' ' ')

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
	@for patch_file in $(PATCH_FILES); do \
		if [ "$$patch_file" != "${PATCH_DIR}/create-app-creds.patch" ] && [ "$$patch_file" != "${PATCH_DIR}/credentials-from-secret.patch" ]; then \
		echo "Applying patch: $$patch_file"; \
		cd $(PATCH_DIR) && git apply --3way --check "$$patch_file" || exit 1; \
		cd $(PATCH_DIR) && git apply --3way "$$patch_file"; \
		fi; \
	done

