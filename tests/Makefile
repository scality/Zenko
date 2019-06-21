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

# Defaults for our test environment
HELM_NAMESPACE := testnamespace
ZENKO_HELM_RELEASE := zenko-test
ORBIT_HELM_RELEASE := ciutil
COSBENCH_HELM_RELEASE := zenko-cosbench

# This is for dumping logs, command is long so storing as a variable
ZENKO_PODS := {{range .items}}{{$$pod := .metadata.name}}{{range .spec.containers}}"kubectl logs -n $(HELM_NAMESPACE) {{$$pod}} -c {{.name}} --previous=true >> artifacts/{{.name}}-{{$$pod}}.log;kubectl logs -n $(HELM_NAMESPACE) {{$$pod}} -c {{.name}} >> artifacts/{{.name}}-{{$$pod}}.log ; exit 0"{{"\n"}}{{end}}{{end}}

# Defaults for our test images
IMAGE_REGISTRY := docker.io
IMAGE_REPO := zenko
E2E_IMAGE_NAME := zenko-e2e
COSBENCH_RUNNER_IMAGE_NAME := cosbench-runner

E2E_POD := zenko-e2e
COSBENCH_RUNNER_POD := cosbench-runner

# Set a default tag,
# but allow us to set all of them using TAG_OVERRIDE
ifeq ($(TAG_OVERRIDE),)
E2E_IMAGE_TAG := latest
COSBENCH_RUNNER_IMAGE_TAG := latest
else
E2E_IMAGE_TAG := $(TAG_OVERRIDE)
COSBENCH_RUNNER_IMAGE_TAG := $(TAG_OVERRIDE)
endif

E2E_IMAGE := $(IMAGE_REGISTRY)/$(IMAGE_REPO)/$(E2E_IMAGE_NAME):$(E2E_IMAGE_TAG)
COSBENCH_RUNNER_IMAGE := $(IMAGE_REGISTRY)/$(IMAGE_REPO)/$(COSBENCH_RUNNER_IMAGE_NAME):$(COSBENCH_RUNNER_IMAGE_TAG)

CLOUDSERVER_REPO := https://github.com/scality/cloudserver.git
CLOUDSERVER_BRANCH := development/8.0
CLOUDSERVER_IMAGE_NAME := cloudserver
CLOUDSERVER_IMAGE := $(IMAGE_REGISTRY)/$(IMAGE_REPO)/$(CLOUDSERVER_IMAGE_NAME)

BACKBEAT_REPO := https://github.com/scality/backbeat.git
BACKBEAT_BRANCH := development/8.0
BACKBEAT_IMAGE_NAME := backbeat
BACKBEAT_IMAGE := $(IMAGE_REGISTRY)/$(IMAGE_REPO)/$(BACKBEAT_IMAGE_NAME)

NODE_TEST_TAGS := not:flaky

artifacts:
	@mkdir -p $@

builddir:
	@mkdir -p build

lint:
	$(V)$(HELM) lint ../kubernetes/zenko/charts/* && $(HELM) lint ../kubernetes/zenko/
.PHONY: lint

build-tests:
	$(V)cd zenko_tests/node_tests && sh gcp_shim.sh
	$(V)$(DOCKER) build -t $(E2E_IMAGE) zenko_tests/ && \
	$(DOCKER) push $(E2E_IMAGE)
.PHONY: build-test

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

build-latest: | build-latest-backbeat build-latest-cloudserver
.PHONY: build build-latest

install-tiller:
ifndef NO_INSTALL
	$(V)$(HELM) init --tiller-namespace $(HELM_NAMESPACE) --wait
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
		--namespace $(HELM_NAMESPACE) \
        --tiller-namespace $(HELM_NAMESPACE) \
        --install build/orbit-simulator/charts/orbit-simulator \
        --set simulator.shim.cloudserver_release=$(ZENKO_HELM_RELEASE) \
        --wait $(shell ../eve/workers/ci_env.sh set)
endif
.PHONY: install-orbit-simulator

install-mocks:
	$(V)$(KUBECTL) create \
		-f ../eve/workers/mocks/azure-mock.yaml \
		-f ../eve/workers/mocks/aws-mock.yaml \
		--namespace $(HELM_NAMESPACE) && \
	$(KUBECTL) create \
		configmap aws-mock \
		--from-file=../eve/workers/mocks/aws/mock-metadata.tar.gz \
		--namespace $(HELM_NAMESPACE)

.PHONY: install-mocks

install-cosbench:
	$(V)$(GIT) clone git@github.com:scality/zenko-cosbench.git build/zenko-cosbench && \
	$(HELM) upgrade $(COSBENCH_HELM_RELEASE) \
		--namespace $(HELM_NAMESPACE) \
		--install build/zenko-cosbench/charts/zenko-cosbench \
		--set controller.logLevel=TRACE \
		--set driver.logLevel=TRACE \
		--wait
.PHONY: install-cosbench

install-zenko: | install-tiller
ifndef NO_INSTALL
	$(HELM) upgrade $(ZENKO_HELM_RELEASE) \
		--namespace $(HELM_NAMESPACE) \
		--install ../kubernetes/zenko \
		-f ../eve/ci-values.yaml
endif
.PHONY: install-zenko

install-latest-zenko: | build-latest
ifndef NO_INSTALL
	$(HELM) upgrade $(ZENKO_HELM_RELEASE) \
		--namespace $(HELM_NAMESPACE) \
                --tiller-namespace $(HELM_NAMESPACE) \
		--install ../kubernetes/zenko \
		-f ../eve/ci-values.yaml \
        --set backbeat.image.repository=$(BACKBEAT_IMAGE) \
        --set-string backbeat.image.tag='$(BACKBEAT_TAG)' \
        --set cloudserver.image.repository=$(CLOUDSERVER_IMAGE) \
        --set-string cloudserver.image.tag='$(CLOUDSERVER_TAG)' \
        --set s3-data.image.repository=$(CLOUDSERVER_IMAGE) \
        --set-string s3-data.image.tag='$(CLOUDSERVER_TAG)'
endif
.PHONY: install-latest-zenko

# Target to install common components need for all tests
install-common: | install-tiller install-helm-repos install-orbit-simulator
.PHONY: install-common

wait-for-zenko: | build-tests
	$(V)$(KUBECTL) run zenko-waiter \
		--image $(E2E_IMAGE) \
		--rm \
		--attach=True \
		--restart=Never \
		--namespace=$(HELM_NAMESPACE) \
		--limits='cpu=100m,memory=128Mi' \
		--requests='cpu=100m,memory=128Mi' \
		$(shell ../eve/workers/ci_env.sh env) \
		--command -- python3 create_buckets.py || (echo "Zenko has failed to stabilize" ; kubectl get all ; exit 1) >&2
	$(V)$(KUBECTL) --namespace=$(HELM_NAMESPACE) get pods
.PHONY: wait-for-zenko

dump-logs: | artifacts
	$(V)(kubectl  -n $(HELM_NAMESPACE) get pods -o go-template --template '$(ZENKO_PODS)') | xargs -n 1 -r sh -c;
	tar -czvf ./artifacts/$(HELM_NAMESPACE).tar.gz ./artifacts
.PHONY: dump-logs

run-tests: | build-tests
	$(V)$(KUBECTL) run $(E2E_POD) \
		--restart=Never \
		--image=$(E2E_IMAGE)  \
		--namespace $(HELM_NAMESPACE) \
		--limits='cpu=250m,memory=768Mi' \
		--requests='cpu=250m,memory=768Mi' \
		--env MOCHA_TAGS="$(NODE_TEST_TAGS)" \
		--env CLOUDSERVER_ENDPOINT="http://$(ZENKO_HELM_RELEASE)-cloudserver:80" \
		$(shell ../eve/workers/ci_env.sh env)
	V=$(V) KUBECTL=$(KUBECTL) E2E_POD=$(E2E_POD) NAMESPACE=$(HELM_NAMESPACE) ./follow_logs.sh
.PHONY: run-tests

test-flaky:
	$(eval NODE_TEST_TAGS = is:flaky)
	$(call run-tests)
.PHONY: test-flaky

ifeq ($(DOCS_ONLY),)
test: | install-common install-zenko run-tests
else
test:
endif
test-latest: | install-common install-latest-zenko run-tests test-flaky
.PHONY: test test-latest

test-local:
	make NO_SIM=true NO_INSTALL=true -e test
test-latest-local:
	make NO_SIM=true NO_INSTALL=true -e test-latest
.PHONY: test-local test-latest-local

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
.PHONY: trigger-cosbench

get-cosbench-results: | artifacts
	$(V)$(KUBECTL) cp $(HELM_NAMESPACE)/$(COSBENCH_POD):archive/w1-workload1/w1-workload1.csv ./artifacts/workload.csv && \
	ls -R ./artifacts && \
	cp ./artifacts/workload.csv ../eve/workers/cosbench/workload.csv && \
	ls -R ../eve/workers/cosbench/

upload-cosbench-results: | get-cosbench-results
	$(V)$(DOCKER) build --no-cache -t $(COSBENCH_RUNNER_IMAGE) ../eve/workers/cosbench/ && \
	$(DOCKER) push $(COSBENCH_RUNNER_IMAGE) && \
	$(KUBECTL) run $(COSBENCH_RUNNER_POD) \
		--image $(COSBENCH_RUNNER_IMAGE) \
		--rm \
		--attach=True \
		--restart=Never \
		--namespace=$(HELM_NAMESPACE) \
		--image-pull-policy="Always" \
		--env COSBENCH_NIGHTLY_SERVICE_ACCOUNT='$(shell echo '$(COSBENCH_NIGHTLY_SERVICE_ACCOUNT)' | tr -d '\n')' \
		--env COSBENCH_SPREADSHEET_ID='$(shell echo '$(COSBENCH_SPREADSHEET_ID)' | tr -d '\n')' \
		-- python insert_data.py
.PHONY: upload-cosbench-results

test-cosbench: | install-common get-latest-commit install-latest-zenko install-cosbench build-cosbench-runner wait-for-zenko trigger-cosbench upload-cosbench-results
.PHONY: test-cosbench
