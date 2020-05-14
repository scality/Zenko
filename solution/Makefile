.POSIX:

PWD := $(shell pwd)

# Destination Paths
BUILD_ROOT ?= $(PWD)/_build
ISO_ROOT ?= $(BUILD_ROOT)/root

# Solution default configuration
config: $(ISO_ROOT)/config.yaml
.PHONY: config

$(ISO_ROOT)/config.yaml: $(PWD)/config.yaml
	@mkdir -p $(@D)
	cp -f $< $@

.PHONY: clean
clean:
	rm -rf $(BUILD_ROOT)
