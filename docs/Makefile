
# SPHINXOPTS    =
# SPHINXBUILD   = sphinx-build
# SPHINXPROJ    = Zenko
# SOURCEDIR     = .
# BUILDDIR      = _build

ROOTDIR:=$(shell dirname $(realpath $(lastword $(MAKEFILE_LIST))))
# DOCKER=docker
# BUILDERNAME=zenko-docs
BUILDERIMAGE="$(ROOTDIR)"
# BUILDERDOCKERFILE=./Dockerfile
# BUILDERHOME=/usr/src/zenko


DOCKER=docker
BUILDERNAME=zenko-docs
# BUILDERIMAGE=builder
BUILDERHOME=/home/docs

.PHONY: build shell

build:
	@$(DOCKER) build -t $(BUILDERNAME):latest $(BUILDERIMAGE)

shell: build
	@$(DOCKER) run -it --rm -v "$$PWD:$(BUILDERHOME)" $(BUILDERNAME) bash
#	print "BUILDERHOME = $BUILDERHOME"
#	print "BUILDERIMAGE = $BUILDERIMAGE"

# RING-31480 Workaround: some local environments seems unable to build
# the pdf with the desired cover.
# This rule rebuilds the Docker image from scratch to fix the cover issue.
#rebuild:
#	@$(SPHINXBUILD) -M $@ "$(SOURCEDIR)" "$(BUILDDIR)" $(SPHINXOPTS) $(O) -t $@ -t install
#	@$(SPHINXBUILD) -M $@ "$(SOURCEDIR)" "$(BUILDDIR)" $(SPHINXOPTS) $(O) -t $@ -t operation
#	@$(SPHINXBUILD) -M $@ "$(SOURCEDIR)" "$(BUILDDIR)" $(SPHINXOPTS) $(O) -t $@ -t reference
