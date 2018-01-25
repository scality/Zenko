space :=
space +=

DOCKER_REPOSITORY ?=

BASE_DIR_HELM := zenko/charts/
IMAGE_SEP_DIR = /images

define dockerfile_to_image
IMAGE_LONG := $$(subst $(IMAGE_SEP_DIR),,$$(patsubst ${BASE_DIR_HELM}%/Dockerfile,%,$(1)))
IMAGE_SPLIT := $$(subst /, ,$$(IMAGE_LONG))
HELM_CHART := $$(strip $$(word 1,$$(IMAGE_SPLIT)))
IMAGE_DIR := $$(strip $$(word 2,$$(IMAGE_SPLIT)))
ifeq ($$(HELM_CHART),$$(IMAGE_DIR))
  $(1)_IMAGE := $$(HELM_CHART)
else
  $(1)_IMAGE := $$(IMAGE_LONG)
endif
endef

DOCKERFILES := $(shell find ${BASE_DIR_HELM} -name 'Dockerfile')

$(foreach dfile,${DOCKERFILES},$(eval $(call dockerfile_to_image,$(dfile))))
DOCKER_IMAGES ?= $(foreach dfile,${DOCKERFILES},$($(dfile)_IMAGE))

DOCKER_BUILD_TARGETS := $(foreach image,${DOCKER_IMAGES},docker-build/$(image))
DOCKER_PUSH_TARGETS := $(foreach image,${DOCKER_IMAGES},docker-push/$(image))

define target_to_image
IMAGE_SPLIT := $$(subst /, ,$(1))
IMAGE := $$(subst $$(space),/,$$(wordlist 2,3,$$(IMAGE_SPLIT)))
DOCKER_DIR := ${BASE_DIR_HELM}/$$(word 2,$${IMAGE_SPLIT})/$(IMAGE_SEP_DIR)/$$(lastword $${IMAGE_SPLIT})
endef

define image_to_tag
IMAGE_SPLIT := $$(subst /, ,$(1))
HELM_CHART := $$(strip $$(word 1,$$(IMAGE_SPLIT)))
IMAGE_DIR := $$(strip $$(word 2,$$(IMAGE_SPLIT)))
# If helm chart name is included in image name, only keep image name
# else composes helm chart with image name joined by a '-'
ifeq ($$(subst $$(HELM_CHART),,$$(IMAGE_DIR)),$$(IMAGE_DIR))
  IMAGE_TAG := $$(subst /,-,$(1))
else
  IMAGE_TAG := $$(IMAGE_DIR)
endif
ifeq ($(DOCKER_REPOSITORY),)
  TAG := $$(IMAGE_TAG)
else
  TAG := $$(DOCKER_REPOSITORY)/$$(IMAGE_TAG)
endif
endef

all: ${DOCKER_BUILD_TARGETS}

${DOCKER_BUILD_TARGETS}:
	$(eval $(call target_to_image,$@))
	$(eval $(call image_to_tag,$(IMAGE)))
	@echo "=================================================="
	@echo "Building ${IMAGE} (Tagged: ${TAG})"
	@echo "=================================================="
	@docker build ${DOCKER_DIR} -t ${TAG}

docker-build: ${DOCKER_BUILD_TARGETS}

${DOCKER_PUSH_TARGETS}:
	$(eval $(call target_to_image,$@))
	$(eval $(call image_to_tag,$(IMAGE)))
	docker push ${TAG}

docker-push: ${DOCKER_PUSH_TARGETS}
