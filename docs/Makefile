
ROOTDIR:=$(shell dirname $(realpath $(lastword $(MAKEFILE_LIST))))
BUILDERIMAGE="$(ROOTDIR)"

DOCKER=docker
BUILDERNAME=zenko-docs
BUILDERHOME=/home/zenko

.PHONY: build shell

build:
	@$(DOCKER) build -t $(BUILDERNAME):latest $(BUILDERIMAGE)

shell: build
	@$(DOCKER) run -it --rm -v "$$PWD/..:$(BUILDERHOME)" $(BUILDERNAME) bash

# RING-31480 Workaround: some local environments seems unable to build
# the pdf with the desired cover.
# This rule rebuilds the Docker image from scratch to fix the cover issue.
rebuild:
	@$(DOCKER) build --no-cache -t $(BUILDERNAME):latest $(BUILDERIMAGE)
