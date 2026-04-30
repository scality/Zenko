BITNAMI_REMOTE := bitnami-containers
BITNAMI_REPO := https://github.com/bitnami/containers.git
BITNAMI_UPSTREAM_MAIN_REF := $(BITNAMI_REMOTE)/main

IMAGES := mongodb-sharded mongodb-exporter os-shell

BITNAMI_mongodb_sharded_PATH := 8.0/debian-12
# Latest commit on upstream main known to still contain
# bitnami/mongodb-sharded/8.0/debian-12.
BITNAMI_mongodb_sharded_REF := 48a109547d39cd8cf8a5d4058d832ecb5844829e

BITNAMI_mongodb_exporter_PATH := 0/debian-12
BITNAMI_mongodb_exporter_REF := $(BITNAMI_UPSTREAM_MAIN_REF)

BITNAMI_os_shell_PATH := 12/debian-12
BITNAMI_os_shell_REF := $(BITNAMI_UPSTREAM_MAIN_REF)

.PHONY: create-remote fetch-remote vendor-sync $(addprefix vendor-sync-,$(IMAGES)) $(addprefix update-vendor-branch-,$(IMAGES))

normalize = $(subst -,_,$1)
bitnami_path = $(BITNAMI_$(call normalize,$1)_PATH)
bitnami_ref = $(BITNAMI_$(call normalize,$1)_REF)
vendor_branch = vendor/$1/$(call bitnami_path,$1)

create-remote:
	@git remote get-url $(BITNAMI_REMOTE) >/dev/null 2>&1 || git remote add $(BITNAMI_REMOTE) $(BITNAMI_REPO)

fetch-remote: create-remote
	# Fetch full history from Bitnami main so subtree split can see full subtree history.
	git fetch $(BITNAMI_REMOTE) main

update-vendor-branch-%: fetch-remote
	-git branch -D $(call vendor_branch,$*)
	git subtree split --prefix=bitnami/$*/$(call bitnami_path,$*) $(call bitnami_ref,$*) -b $(call vendor_branch,$*)

vendor-sync-%: update-vendor-branch-%
	git subtree merge --prefix=solution-base/images/$*/debian-12 $(call vendor_branch,$*) --squash

vendor-sync: $(addprefix vendor-sync-,$(IMAGES))
