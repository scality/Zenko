BITNAMI_REMOTE := bitnami-containers
BITNAMI_REPO := https://github.com/bitnami/containers.git

IMAGES := mongodb-sharded mongodb-exporter os-shell

BITNAMI_mongodb_sharded_PATH := 8.0/debian-12
# Latest commit on upstream main known to still contain
# bitnami/mongodb-sharded/8.0/debian-12.
BITNAMI_mongodb_sharded_REF := 657585595c550d4dc107a4e6cd3a598a9d284eec

BITNAMI_mongodb_exporter_PATH := 0/debian-12
BITNAMI_mongodb_exporter_REF := main

BITNAMI_os_shell_PATH := 12/debian-12
BITNAMI_os_shell_REF := main

.PHONY: create-remote vendor-sync

normalize = $(subst -,_,$1)
bitnami_path = $(BITNAMI_$(call normalize,$1)_PATH)
bitnami_ref = $(BITNAMI_$(call normalize,$1)_REF)
vendor_branch = vendor/$1/$(call bitnami_path,$1)

create-remote:
	@git remote get-url $(BITNAMI_REMOTE) >/dev/null 2>&1 || git remote add $(BITNAMI_REMOTE) $(BITNAMI_REPO)

update-vendor-branch-%: create-remote
	# Shallow-fetch only the pinned ref; full upstream history is unnecessary for a --squash merge.
	git fetch --depth 1 --filter=blob:none $(BITNAMI_REMOTE) $(call bitnami_ref,$*)
	-git branch -D $(call vendor_branch,$*)
	sha=$$(git rev-parse FETCH_HEAD) && \
	wt=$$(mktemp -d) && \
	trap 'git worktree remove --force "$$wt" 2>/dev/null' EXIT && \
	git worktree add --no-checkout --detach "$$wt" "$$sha" && \
	git -C "$$wt" sparse-checkout set --no-cone bitnami/$*/$(call bitnami_path,$*) && \
	git -C "$$wt" checkout && \
	git -C "$$wt" subtree split --prefix=bitnami/$*/$(call bitnami_path,$*) "$$sha" -b $(call vendor_branch,$*)

vendor-sync-%: update-vendor-branch-%
	cd "$$(git rev-parse --show-toplevel)" && \
	git subtree merge --prefix=solution-base/images/$*/debian-12 $(call vendor_branch,$*) --squash

vendor-sync: $(addprefix vendor-sync-,$(IMAGES))
