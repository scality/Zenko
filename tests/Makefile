DOCKER_IMAGE_NAME := docker.io/zenko/zenko-e2e
DOCKER_IMAGE_TAG := test-e2e

DOCKER := docker
PIP_COMPILE := pip-compile
TOX := tox
KUBECTL := kubectl

DOCKER_IMAGE := $(DOCKER_IMAGE_NAME):$(DOCKER_IMAGE_TAG)

DOCKER_ARGS :=
PYTEST_ARGS :=
DOTENV := $(PWD)/.env

requirements.txt: setup.cfg setup.py Makefile
	@env CUSTOM_COMPILE_COMMAND="$(MAKE) requirements.txt" $(PIP_COMPILE) --index --emit-trusted-host --annotate --upgrade --generate-hashes

container-image:
	@$(DOCKER) build -t $(DOCKER_IMAGE) .
.PHONY: container-image

container-run:
	@$(DOCKER) run -t --rm --read-only --mount type=tmpfs,tmpfs-size=64M,destination=/tmp \
		-v $(DOTENV):/usr/src/zenko-e2e/.env:ro \
		$(DOCKER_ARGS) \
		$(DOCKER_IMAGE) $(PYTEST_ARGS)
.PHONY: container-run

kubernetes-run: SHELL := bash
kubernetes-run:
	@source .env && \
	set -u && \
	$(KUBECTL) --namespace=$${ZENKO_K8S_NAMESPACE} run --attach --rm --restart=Never \
		--image=$(DOCKER_IMAGE_NAME):$(DOCKER_IMAGE_TAG) \
		zenko-e2e \
		--env ZENKO_HELM_RELEASE=$${ZENKO_HELM_RELEASE} \
		--env AWS_ACCESS_KEY_ID=$${AWS_ACCESS_KEY_ID} \
		--env AWS_SECRET_ACCESS_KEY=$${AWS_SECRET_ACCESS_KEY} \
		--env CLOUDSERVER_FRONT_ENDPOINT=$${CLOUDSERVER_FRONT_ENDPOINT} \
		--env PROMETHEUS_ENDPOINT=$${PROMETHEUS_ENDPOINT} \
		$(KUBECTL_ARGS) -- $(PYTEST_ARGS)
.PHONY: kubernetes-run

kubernetes-run-nondestructive: PYTEST_ARGS := $(PYTEST_ARGS) -m nondestructive
kubernetes-run-nondestructive: kubernetes-run
.PHONY: kubernetes-run-nondestructive

kubernetes-run-conformance: PYTEST_ARGS := $(PYTEST_ARGS) -m conformance
kubernetes-run-conformance: kubernetes-run
.PHONY: kubernetes-run-conformance

lint:
	@$(TOX)
.PHONY: lint
