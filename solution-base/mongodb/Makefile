BITNAMI_REMOTE := bitnami-charts
BITNAMI_REPO   := https://github.com/bitnami/charts.git

CHART         := mongodb-sharded
CHART_VERSION := 9.4.4
CHART_REF     := $(CHART)/$(CHART_VERSION)

# Repo-relative path of the vendored chart (needed by `git subtree`).
REPO_CHART_PREFIX  := solution-base/mongodb/charts/$(CHART)
# Path relative to this Makefile's directory (where `helm` runs).
LOCAL_CHART_PREFIX := charts/$(CHART)

VENDOR_BRANCH := vendor/$(CHART_REF)

HELM := helm

.PHONY: create-remote fetch-remote update-vendor-branch vendor-sync deps

create-remote:
	@git remote get-url $(BITNAMI_REMOTE) >/dev/null 2>&1 || \
		git remote add $(BITNAMI_REMOTE) $(BITNAMI_REPO)

# Fetch full main + the target chart tag so `git subtree split` can synthesize
# the chart's history. `--no-tags` avoids importing bitnami/charts' ~1000 tags
# (one per chart-version bump across every chart) into the Zenko repo.
fetch-remote: create-remote
	git fetch --no-tags $(BITNAMI_REMOTE) main
	git fetch --no-tags $(BITNAMI_REMOTE) refs/tags/$(CHART_REF):refs/tags/$(CHART_REF)

update-vendor-branch: fetch-remote
	-git branch -D $(VENDOR_BRANCH)
	git subtree split --prefix=bitnami/$(CHART) $(CHART_REF) -b $(VENDOR_BRANCH)

# Maintainer-only: bump CHART_VERSION above, then `make vendor-sync` to merge
# upstream into our prefix. Resolves merge conflicts against our local commits
# the same way any git merge does.
vendor-sync: update-vendor-branch
	git subtree merge --prefix=$(REPO_CHART_PREFIX) $(VENDOR_BRANCH) --squash
	@$(MAKE) deps

# Resolve and extract the `bitnami/common` library chart so it appears as a
# subdirectory (required by `solution-base/build.sh`'s `helm template`).
deps:
	@$(HELM) dependency build $(LOCAL_CHART_PREFIX)
	@cd $(LOCAL_CHART_PREFIX)/charts && \
		for tgz in *.tgz; do \
			[ -f "$$tgz" ] || continue; \
			tar xzf "$$tgz" && rm "$$tgz"; \
		done
