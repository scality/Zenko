DOCKER_IMAGE_NAME := zenko-e2e
DOCKER_IMAGE_TAG := latest

DOCKER := docker
PIP_COMPILE := pip-compile

DOCKER_IMAGE := $(DOCKER_IMAGE_NAME):$(DOCKER_IMAGE_TAG)

requirements.txt: setup.cfg setup.py Makefile
	@env CUSTOM_COMPILE_COMMAND="$(MAKE) requirements.txt" $(PIP_COMPILE) --index --emit-trusted-host --annotate --upgrade --generate-hashes

container-image:
	@$(DOCKER) build -t $(DOCKER_IMAGE) .
	@echo "Successfully built $(DOCKER_IMAGE)"
.PHONY: container-image

container-run: guard-AWS_ACCESS_KEY_ID guard-AWS_SECRET_ACCESS_KEY guard-CLOUDSERVER_FRONT_ENDPOINT
	@$(DOCKER) run -t --rm --read-only --mount type=tmpfs,tmpfs-size=64M,destination=/tmp \
		--env AWS_ACCESS_KEY_ID=$(AWS_ACCESS_KEY_ID) \
		--env AWS_SECRET_ACCESS_KEY=$(AWS_SECRET_ACCESS_KEY) \
		--env CLOUDSERVER_FRONT_ENDPOINT=$(CLOUDSERVER_FRONT_ENDPOINT) \
		$(DOCKER_IMAGE) $(PYTEST_ARGS)
.PHONY: container-run

guard-%:
	@if [ "x${${*}}" = "x" ]; then \
		echo "Error: required variable '$*' not set"; \
		exit 1; \
	fi
