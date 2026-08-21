BITNAMI_REMOTE := bitnami-containers
BITNAMI_REPO := https://github.com/bitnami/containers.git

IMAGES := mongodb-sharded mongodb-exporter os-shell

# Refs are pinned to shas, never branches: the sha is the upstream release whose
# subdir content is our vendored baseline, and a moving branch would shift the
# recorded `git-subtree-split` baseline out from under us between syncs.
BITNAMI_mongodb_sharded_PATH := 8.0/debian-12
# 8.0.13-debian-12-r1, the last commit on main to still contain this prefix.
BITNAMI_mongodb_sharded_REF := 657585595c550d4dc107a4e6cd3a598a9d284eec

BITNAMI_mongodb_exporter_PATH := 0/debian-12
# 0.49.0-debian-12-r1
BITNAMI_mongodb_exporter_REF := 3af1e651db624f9938f407de85387bc7fe721d49

BITNAMI_os_shell_PATH := 12/debian-12
# 12-debian-12-r61
BITNAMI_os_shell_REF := f6aa42546a035ccefc7a2823674e622cc9ccaaba

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
	sha=$(call bitnami_ref,$*) && \
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
