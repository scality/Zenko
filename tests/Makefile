ifndef VERBOSE
V=@
endif
# Some bin aliases
DOCKER := docker
TOX := tox
HELM := helm
KUBECTL := kubectl
GIT := git
AWK := awk

DOCKER_ARGS :=
PYTEST_ARGS :=
DOTENV := $(PWD)/.env


BUILDDIR := build
# These are for dumping logs, but they're really long so store them as variables
E2E_LOG_PODS := {range .items[?(@.metadata.annotations.helm\.sh\/hook)]}{@.metadata.name}{"\n"}{end}
ZENKO_PODS := {{range .items}}{{$$pod := .metadata.name}}{{range .spec.containers}}"kubectl logs {{$$pod}} -c {{.name}} > artifacts/{{.name}}-{{$$pod}}.log"{{"\n"}}{{end}}{{end}}

# Defaults for our test environment
HELM_NAMESPACE := testnamespace
ZENKO_HELM_RELEASE := zenko-test
ORBIT_HELM_RELEASE := ciutil
COSBENCH_HELM_RELEASE := zenko-cosbench

# Defaults for our test images
IMAGE_REGISTRY := docker.io
IMAGE_REPO := zenko
E2E_IMAGE_NAME := zenko-e2e
NODE_E2E_IMAGE_NAME := node-e2e
COSBENCH_RUNNER_IMAGE_NAME := cosbench-runner

E2E_POD := zenko-e2e
NODE_E2E_POD := zenko-node-e2e
COSBENCH_RUNNER_POD := cosbench-runner

# Set a default tag,
# but allow us to set all of them using TAG_OVERRIDE
ifeq ($(TAG_OVERRIDE),)
E2E_IMAGE_TAG := latest
NODE_E2E_IMAGE_TAG := latest
COSBENCH_RUNNER_IMAGE_TAG := latest
else
E2E_IMAGE_TAG := $(TAG_OVERRIDE)
NODE_E2E_IMAGE_TAG := $(TAG_OVERRIDE)
COSBENCH_RUNNER_IMAGE_TAG := $(TAG_OVERRIDE)
endif

E2E_IMAGE := $(IMAGE_REGISTRY)/$(IMAGE_REPO)/$(E2E_IMAGE_NAME):$(E2E_IMAGE_TAG)
NODE_E2E_IMAGE := $(IMAGE_REGISTRY)/$(IMAGE_REPO)/$(NODE_E2E_IMAGE_NAME):$(NODE_E2E_IMAGE_TAG)
COSBENCH_RUNNER_IMAGE := $(IMAGE_REGISTRY)/$(IMAGE_REPO)/$(COSBENCH_RUNNER_IMAGE_NAME):$(COSBENCH_RUNNER_IMAGE_TAG)

CLOUDSERVER_REPO := https://github.com/scality/cloudserver.git
CLOUDSERVER_BRANCH := development/8.0
CLOUDSERVER_IMAGE_NAME := cloudserver
CLOUDSERVER_IMAGE := $(IMAGE_REGISTRY)/$(IMAGE_REPO)/$(CLOUDSERVER_IMAGE_NAME)

BACKBEAT_REPO := https://github.com/scality/backbeat.git
BACKBEAT_BRANCH := development/8.0
BACKBEAT_IMAGE_NAME := backbeat
BACKBEAT_IMAGE := $(IMAGE_REGISTRY)/$(IMAGE_REPO)/$(BACKBEAT_IMAGE_NAME)

artifacts:
	@mkdir -p $@

builddir:
	@mkdir -p build

lint-e2e:
	$(V)$(TOX)

lint-node-e2e:

lint:
	$(V)$(HELM) lint ../charts/*

build-e2e:
	$(V)$(DOCKER) build -t $(E2E_IMAGE) . && \
	$(DOCKER) push $(E2E_IMAGE)
.PHONY: build-e2e

build-node-e2e:
	$(V)cd node_tests && sh gcp_shim.sh
	$(V)$(DOCKER) build -t $(NODE_E2E_IMAGE) node_tests/ && \
	$(DOCKER) push $(NODE_E2E_IMAGE)
.PHONY: build-node-e2e

build-cosbench-runner:
	$(V)$(AWK) -f ../eve/workers/cosbench/tmpl.awk \
		-v ak="$(ZENKO_ACCESS_KEY)" \
		-v sk="$(ZENKO_SECRET_KEY)" \
		-v ep="http://$(ZENKO_HELM_RELEASE)-cloudserver:80" \
		../eve/workers/cosbench/workload.short.xml.tmpl | tee ../eve/workers/cosbench/workload.xml && \
	$(DOCKER) build --no-cache -t $(COSBENCH_RUNNER_IMAGE) ../eve/workers/cosbench/ && \
	$(DOCKER) push $(COSBENCH_RUNNER_IMAGE)
.PHONY: build-cosbench-runner

get-cloudserver-commit:
	$(eval CLOUDSERVER_SHA1 := $(shell git ls-remote git@github.com:scality/s3.git --branch '$(CLOUDSERVER_BRANCH)' | cut -f1))
	$(eval CLOUDSERVER_TAG := $(shell echo $(CLOUDSERVER_SHA1) | cut -c1-7))

get-backbeat-commit:
	$(eval BACKBEAT_SHA1 := $(shell git ls-remote git@github.com:scality/backbeat.git --branch '$(BACKBEAT_BRANCH)' | cut -f1))
	$(eval BACKBEAT_TAG := $(shell echo $(BACKBEAT_SHA1) | cut -c1-7))

get-latest-commit: | get-cloudserver-commit get-backbeat-commit
.PHONY: get-cloudserver-commit get-backbeat-commit get-latest-commit

build-latest-cloudserver: | get-cloudserver-commit builddir
	$(V)$(GIT) clone --branch $(CLOUDSERVER_BRANCH) $(CLOUDSERVER_REPO) build/cloudserver && \
	$(DOCKER) build -t $(CLOUDSERVER_IMAGE):$(CLOUDSERVER_TAG) build/cloudserver && \
	$(DOCKER) push $(CLOUDSERVER_IMAGE):$(CLOUDSERVER_TAG)
.PHONY: build-latest-cloudserver

build-latest-backbeat: | get-backbeat-commit builddir
	$(V)$(GIT) clone --branch $(BACKBEAT_BRANCH) $(BACKBEAT_REPO) build/backbeat && \
	$(DOCKER) build -t $(BACKBEAT_IMAGE):$(BACKBEAT_TAG) build/backbeat && \
	$(DOCKER) push $(BACKBEAT_IMAGE):$(BACKBEAT_TAG)
.PHONY: build-latest-backbeat

build: | build-e2e build-node-e2e
build-latest: | build-latest-backbeat build-latest-cloudserver
.PHONY: build build-latest

install-tiller:
ifndef NO_INSTALL
	$(V)$(HELM) init --wait
endif
.PHONY: install-tiller

install-helm-repos:
ifndef NO_INSTALL
	$(V)$(HELM) repo add incubator http://storage.googleapis.com/kubernetes-charts-incubator && \
	$(HELM) repo add scality https://scality.github.io/Zenko
endif
.PHONY: install-helm-repos

install-orbit-simulator: | builddir
ifndef NO_SIM
	$(V)$(GIT) clone git@github.com:scality/orbit-simulator.git build/orbit-simulator && \
	$(HELM) upgrade ciutil \
        --install build/orbit-simulator/charts/orbit-simulator \
        --set simulator.shim.cloudserver_release=$(ZENKO_HELM_RELEASE) \
        --wait $(shell ../eve/workers/ci_env.sh set)
endif
.PHONY: install-orbit-simulator

install-cosbench:
	$(V)$(GIT) clone git@github.com:scality/zenko-cosbench.git build/zenko-cosbench && \
	$(HELM) upgrade $(COSBENCH_HELM_RELEASE) \
		--namespace $(HELM_NAMESPACE) \
		--install build/zenko-cosbench/charts/zenko-cosbench \
		--wait
.PHONY: install-cosbench

install-zenko:
ifndef NO_INSTALL
	$(HELM) upgrade $(ZENKO_HELM_RELEASE) \
		--namespace $(HELM_NAMESPACE) \
		--install ../charts \
		-f ../eve/ci-values.yml
endif
.PHONY: install-zenko

install-latest-zenko:
ifndef NO_INSTALL
	$(HELM) upgrade $(ZENKO_HELM_RELEASE) \
		--namespace $(HELM_NAMESPACE) \
		--install ../charts \
		-f ../eve/ci-values.yml \
        --set cloudserver.image.repository=$(IMAGE_REGISTRY)/zenko/cloudserver \
        --set-string cloudserver.image.tag='$(CLOUDSERVER_TAG)' \
        --set backbeat.image.repository=$(IMAGE_REGISTRY)/zenko/backbeat \
        --set-string backbeat.image.tag='$(BACKBEAT_TAG)' \
        --set s3-data.image.repository=$(IMAGE_REGISTRY)/zenko/cloudserver \
        --set-string s3-data.image.tag='$(CLOUDSERVER_TAG)'
endif
.PHONY: install-latest-zenko

# Target to install common components need for all tests
install-common: | install-tiller install-helm-repos install-orbit-simulator
.PHONY: install-common

wait-for-zenko: | build-e2e
	$(V)$(KUBECTL) run zenko-waiter \
		--image $(E2E_IMAGE) \
		--rm \
		--attach=True \
		--restart=Never \
		--namespace=$(HELM_NAMESPACE) \
		$(shell ../eve/workers/ci_env.sh env) \
		--command -- python create_buckets.py || (echo "Zenko has failed to stabilize" ; kubectl get pods -L redis-role ; exit 1) >&2
.PHONY: wait-for-zenko

dump-logs: | artifacts
	$(V)(kubectl  -n $(HELM_NAMESPACE) get pods -o go-template --template '$(ZENKO_PODS)') | xargs -n 1 -r sh -c;  \
	(kubectl -n $(HELM_NAMESPACE) get pods -o jsonpath='$(E2E_LOG_PODS)') | \
	while read -r pod; do \
		kubectl -n $(HELM_NAMESPACE) logs $${pod}; \
	done;
.PHONY: dump-logs

test-e2e: | build-e2e
	$(V)$(KUBECTL) run $(E2E_POD) \
		--rm \
		--restart=Never \
		--attach=True \
		--image=$(E2E_IMAGE)  \
		--namespace $(HELM_NAMESPACE) \
		$(shell ../eve/workers/ci_env.sh env) || (echo "Tests have failed" ; kubectl get pods -L redis-role ; exit 1) >&2
.PHONY: test-e2e

test-node: | build-node-e2e
	$(V)$(KUBECTL) run $(NODE_E2E_POD)-crr --image=$(NODE_E2E_IMAGE) \
		--rm --restart=Never --namespace $(HELM_NAMESPACE) --attach=True \
		$(shell ../eve/workers/ci_env.sh env) \
		--env CLOUDSERVER_ENDPOINT="http://$(ZENKO_HELM_RELEASE)-cloudserver:80" \
		-- ./npm_chain.sh test_crr test_api test_crr_pause_resume test_location_quota
.PHONY: test-node

test: | install-common install-zenko test-e2e test-node
test-latest: | install-common get-latest-commit install-latest-zenko test-e2e test-node
.PHONY: test test-latest
test-local:
	make NO_SIM=true NO_INSTALL=true -e test
test-latest-local:
	make NO_SIM=true NO_INSTALL=true -e test-latest

trigger-cosbench:
	$(eval COSBENCH_POD := $(shell kubectl get pods | awk '/cosbench-controller/{print $$1}'))
	$(eval COSBENCH_IP := $(shell kubectl describe pod $(COSBENCH_POD) | awk '/IP:\s*[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}/{print $$2}'))
	$(V)$(KUBECTL) run $(COSBENCH_RUNNER_POD) \
		--image $(COSBENCH_RUNNER_IMAGE) \
		--rm \
		--attach=True \
		--restart=Never \
		--namespace=$(HELM_NAMESPACE) \
		--env COSBENCH_IP=$(COSBENCH_IP) \
		-- trigger_run.sh

get-cosbench-results: | artifacts
	$(V)$(KUBECTL) cp $(HELM_NAMESPACE)/$(COSBENCH_POD):archive/ ./artifacts && \
	cp ./artifacts/w*-workload*.csv ../eve/workers/cosbench/workload.csv

upload-cosbench-results: | get-cosbench-results
	$(V)$(DOCKER) build --no-cache -t $(COSBENCH_RUNNER_IMAGE) ../eve/workers/cosbench/ && \
	$(DOCKER) push $(COSBENCH_RUNNER_IMAGE) && \
	$(KUBECTL) run $(COSBENCH_RUNNER_POD) \
		--image $(COSBENCH_RUNNER_IMAGE) \
		--rm \
		--attach=True \
		--restart=Never \
		--namespace=$(HELM_NAMESPACE) \
		-- python insert_data.py

test-cosbench: | install-common get-latest-commit install-latest-zenko install-cosbench build-cosbench-runner wait-for-zenko trigger-cosbench upload-cosbench-results
.PHONY: test-cosbench
