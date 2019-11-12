COSMOS_OPERATOR_IMAGE_NAME := "zenko/cosmos-operator"
COSMOS_OPERATOR_IMAGE_TAG := "0.5.5"
COSMOS_OPERATOR_IMAGE := ${COSMOS_OPERATOR_IMAGE_NAME}:${COSMOS_OPERATOR_IMAGE_TAG}
COSMOS_CHART := "../../kubernetes/cosmos"

build:
	@rm -rf ./cosmos
	@cp -r ${COSMOS_CHART} .
	docker build -t ${COSMOS_OPERATOR_IMAGE} .
.PHONY: build

push: build
	docker push ${COSMOS_OPERATOR_IMAGE}
.PHONY: push
