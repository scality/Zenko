.POSIX:

PWD := $(shell pwd)

# Destination Paths
BUILD_ROOT ?= $(PWD)/_build
ISO_ROOT ?= $(BUILD_ROOT)/root

# Metadata
PRODUCT_NAME := Zenko
PRODUCT_LOWERNAME := zenko
BUILD_TIMESTAMP := $(shell date -u +"%Y-%m-%dT%H:%M:%SZ")
BUILD_HOST := $(shell hostname)

ifneq '$(RELEASE)' '1'
DEVELOPMENT_RELEASE = 1
SUFFIX ?= -dev
else
DEVELOPMENT_RELEASE = 0
endif

# Use git tag as our version
VERSION_SHORT := $(shell git describe --abbrev=0)
VERSION_FULL := $(VERSION_SHORT)$(SUFFIX)
GIT_REVISION := $(shell git describe --long --always --tags --dirty)

# Solution default configuration
.PHONY: config
config: $(ISO_ROOT)/config.yaml
$(ISO_ROOT)/config.yaml: $(PWD)/config.yaml
	@mkdir -p $(@D)
	cp -f $< $@

.PHONY: product
product: $(ISO_ROOT)/product.txt
$(ISO_ROOT)/product.txt:
	@mkdir -p $(@D)
	echo NAME=${PRODUCT_NAME} > $@
	echo VERSION=${VERSION_FULL} >> $@
	echo SHORT_VERSION=${VERSION_SHORT} >> $@
	echo GIT=${GIT_REVISION} >> $@
	echo DEVELOPMENT_RELEASE=${DEVELOPMENT_RELEASE} >> $@
	echo BUILD_TIMESTAMP=${BUILD_TIMESTAMP} >> $@
	echo BUILD_HOST=${BUILD_HOST} >> $@

.PHONY: clean
clean:
	rm -rf $(BUILD_ROOT)
