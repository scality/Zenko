-include .local.make
DOCKER_IMAGE_NAME := docker.io/zenko/zenko-e2e
DOCKER_IMAGE_TAG := edge

DOCKER := docker
TOX := tox
KUBECTL := kubectl
HELM := helm

DOCKER_IMAGE := $(DOCKER_IMAGE_NAME):$(DOCKER_IMAGE_TAG)

DOCKER_ARGS :=
PYTEST_ARGS :=
DOTENV := $(PWD)/.env
HELM_TEST_PODS := {range .items[?(@.metadata.annotations.helm\.sh\/hook)]}{@.metadata.name}{"\n"}{end}
E2E_POD := zenko-e2e
ORBIT_HELM_RELEASE := ciutil

ZENKO_PRESENT := $(shell $(HELM) list -q | grep $(ZENKO_HELM_RELEASE) | wc -l | xargs -i test "0" -eq "{}" && echo "build")
ORBIT_PRESENT := $(shell $(HELM) list -q | grep $(ORBIT_HELM_RELEASE) | wc -l | xargs -i test "0" -eq "{}" && echo "build")

artifacts:
	@mkdir -p $@

requirements.txt: setup.cfg setup.py tox.ini
	@env CUSTOM_COMPILE_COMMAND="$(MAKE) requirements.txt" $(TOX) -e pip-compile

ifeq ($(ORBIT_PRESENT), build)
simulator-run:
	@if [ ! -d ./orbit-simulator ]; then \
	git clone git@github.com:scality/orbit-simulator.git orbit-simulator; \
	fi
	@echo "Starting orbit-simulator..."
	@$(HELM) upgrade $(ORBIT_HELM_RELEASE) \
	--install  orbit-simulator/charts/orbit-simulator \
	--set simulator.shim.cloudserver_release=$(ZENKO_HELM_RELEASE) \
	$(shell source $(DOTENV) && ../eve/workers/ci_env.sh set) --wait
.PHONY: simulator
else
simulator-run:
	@echo "orbit-simulator already running!"
endif

ifeq ($(ZENKO_PRESENT), build)
zenko-run: | simulator-run
	@$(HELM) upgrade --install $(ZENKO_HELM_RELEASE) \
		$(shell source $(DOTENV) && ../eve/workers/ci_env.sh set) \
		-f local-values.yml \
		../charts/zenko/ --wait --timeout 1200
.PHONY: zenko-run
else
zenko-run: | simulator-run
	@echo "zenko is already running!"
endif

container-image:
	@$(DOCKER) build -t $(DOCKER_IMAGE) .
.PHONY: container-image

container-push:
	@$(DOCKER) push $(DOCKER_IMAGE)
.PHONY: container-push

container-run:
	@$(DOCKER) run -t --rm --read-only --mount type=tmpfs,tmpfs-size=64M,destination=/tmp \
		-v $(DOTENV):/usr/src/zenko-e2e/.env:ro \
		$(DOCKER_ARGS) \
		$(DOCKER_IMAGE) $(PYTEST_ARGS)
.PHONY: container-run

kubernetes-run: SHELL := bash
kubernetes-run:
	@source .env && \
	@set -u && \
	$(KUBECTL) --namespace=$${ZENKO_K8S_NAMESPACE} run --attach --rm --restart=Never \
		--image=$(DOCKER_IMAGE_NAME):$(DOCKER_IMAGE_TAG) \
		zenko-e2e \
		--env ZENKO_K8S_NAMESPACE=$${ZENKO_K8S_NAMESPACE} \
		--env ZENKO_HELM_RELEASE=$${ZENKO_HELM_RELEASE} \
		--env AWS_ACCESS_KEY_ID=$${AWS_ACCESS_KEY_ID} \
		--env AWS_SECRET_ACCESS_KEY=$${AWS_SECRET_ACCESS_KEY} \
		--env CLOUDSERVER_FRONT_ENDPOINT=$${CLOUDSERVER_FRONT_ENDPOINT:-} \
		--env PROMETHEUS_ENDPOINT=$${PROMETHEUS_ENDPOINT:-} \
		$(KUBECTL_ARGS) -- $(PYTEST_ARGS)
.PHONY: kubernetes-run

kubernetes-run-nondestructive: PYTEST_ARGS := $(PYTEST_ARGS) -m nondestructive
kubernetes-run-nondestructive: kubernetes-run
.PHONY: kubernetes-run-nondestructive

kubernetes-run-conformance: PYTEST_ARGS := $(PYTEST_ARGS) -m conformance
kubernetes-run-conformance: kubernetes-run
.PHONY: kubernetes-run-conformance

helm-test: | artifacts
	@helm test $(ZENKO_HELM_RELEASE)
.PHONY: helm-test

ifeq ($(E2E_LOCAL), true)
end2end: | artifacts
	$(KUBECTL) run $(E2E_POD) --image=$(DOCKER_IMAGE) --rm \
	--restart=Never --namespace $(ZENKO_K8S_NAMESPACE) --attach=True \
	$(shell source $(DOTENV) && ../eve/workers/ci_env.sh env);
else
end2end: | artifacts
	$(KUBECTL) run $(E2E_POD) --image=$(DOCKER_IMAGE) --rm \
	--restart=Never --namespace $(ZENKO_K8S_NAMESPACE) --attach=True \
	--image-pull-policy=Always \
	$(shell ../eve/workers/ci_env.sh env);
endif
.PHONY: end2end

dump-logs:
	@(kubectl  -n $(ZENKO_K8S_NAMESPACE) get pods -o go-template --template '{{range .items}}{{$$pod := .metadata.name}}{{range .spec.containers}}"kubectl logs {{$$pod}} -c {{.name}} > artifacts/{{.name}}-{{$$pod}}.log"{{"\n"}}{{end}}{{end}}') | xargs -n 1 -r sh -c;  \
	(kubectl -n $(ZENKO_K8S_NAMESPACE) get pods -o jsonpath='$(HELM_TEST_PODS)') | \
	while read -r pod; do \
		kubectl -n $(ZENKO_K8S_NAMESPACE) logs $${pod}; \
	done;
.PHONY: dump-logs

cleanup:
	@rm -rf artifacts/*
	@($(KUBECTL) get pod -o=custom-columns=NAME:.metadata.name --no-headers=true) | \
	grep $(E2E_POD) | xargs -r kubectl delete pod

run-all: | helm-test end2end dump-logs cleanup

local-run: | cleanup zenko-run end2end dump-logs

lint:
	@$(TOX)
.PHONY: lint
