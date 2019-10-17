# Minimal makefile for Sphinx documentation
#

# You can set these variables from the command line.
SPHINXOPTS    =
SPHINXBUILD   = sphinx-build
SPHINXPROJ    = Zenko
SOURCEDIR     = .
BUILDDIR      = _build

ROOTDIR:=$(shell dirname $(realpath $(lastword $(MAKEFILE_LIST))))
DOCKER=docker
BUILDERNAME=zenko-docs
BUILDERIMAGE="$(ROOTDIR)"
BUILDERDOCKERFILE=./Dockerfile
BUILDERHOME=/usr/src/zenko

# Put it first so that "make" without argument is like "make help".
help:
	@$(SPHINXBUILD) -M help "$(SOURCEDIR)" "$(BUILDDIR)" $(SPHINXOPTS) $(O)

.PHONY: help Makefile

build:
	@$(DOCKER) build -t $(BUILDERNAME):latest -f $(BUILDERDOCKERFILE) $(BUILDERIMAGE)

shell: build
	@$(DOCKER) run -it --rm -v "$(ROOTDIR):$(BUILDERHOME)" --entrypoint=bash $(BUILDERNAME)

.PHONY: build shell help Makefile


# Catch-all target: route all unknown targets to Sphinx using the new
# "make mode" option.  $(O) is meant as a shortcut for $(SPHINXOPTS).
%: Makefile
	@$(SPHINXBUILD) -M $@ "$(SOURCEDIR)" "$(BUILDDIR)" $(SPHINXOPTS) $(O) -t $@ -t install
	@$(SPHINXBUILD) -M $@ "$(SOURCEDIR)" "$(BUILDDIR)" $(SPHINXOPTS) $(O) -t $@ -t operation
	@$(SPHINXBUILD) -M $@ "$(SOURCEDIR)" "$(BUILDDIR)" $(SPHINXOPTS) $(O) -t $@ -t reference
