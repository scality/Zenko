DOCKER_IMAGE_NAME := zenko-e2e
DOCKER_IMAGE_TAG := latest

DOCKER := docker
PIP_COMPILE := pip-compile

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
