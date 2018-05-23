DOCKER_IMAGE_NAME := docker.io/zenko/zenko-e2e
DOCKER_IMAGE_TAG := latest

DOCKER := docker
TOX := tox
KUBECTL := kubectl
HELM := helm

DOCKER_IMAGE := $(DOCKER_IMAGE_NAME):$(DOCKER_IMAGE_TAG)

DOCKER_ARGS :=
PYTEST_ARGS :=
DOTENV := $(PWD)/.env
HELM_TEST_PODS := {range .items[?(@.metadata.annotations.helm\.sh\/hook)]}{@.metadata.name}{"\n"}{end}
DUMP_LOGS := {{range .items}}{{$$pod := .metadata.name}}{{range .spec.containers}}kubectl logs {{$$pod}} -c {{.name}} | tee {{.name}}-{{$$pod}}.log{{"\n"}}{{end}}{{end}}

artifacts:
	@mkdir -p $@

requirements.txt: setup.cfg setup.py tox.ini
	@env CUSTOM_COMPILE_COMMAND="$(MAKE) requirements.txt" $(TOX) -e pip-compile

simulator-run:
	@echo "Starting orbit-simulator..."
	@$(HELM) install --name ciutil \
	--set simulator.shim.cloudserver_release=$(ZENKO_HELM_RELEASE) \
	$(shell source $(DOTENV) && ../eve/workers/ci_env.sh ci) \
	orbit-simulator/orbit-simulator --wait
.PHONY: simulator

zenko-run: | simulator-run
	@$(HELM) install --name $(ZENKO_HELM_RELEASE) \
		$(shell source $(DOTENV) && ../eve/workers/ci_env.sh ci) \
		--set prometheus.rbac.create=false \
		--set zenko-queue.rbac.enabled=false \
		--set redis-ha.rbac.create=false \
		-f ../charts/single-node-values.yml \
		../charts/zenko/
.PHONY: zenko-run

dump-logs:
	kubectl get pods -n $(ZENKO_K8S_NAMESPACE) -o go-template --template "$(DUMP_LOGS)" | \
	xargs -n 1 -d '\n' sh -c

container-image:
	@$(DOCKER) build -t $(DOCKER_IMAGE) .
.PHONY: container-image

container-run:
	@$(DOCKER) run -t --rm --read-only --mount type=tmpfs,tmpfs-size=64M,destination=/tmp \
		-v $(DOTENV):/usr/src/zenko-e2e/.env:ro \
		$(DOCKER_ARGS) \
		$(DOCKER_IMAGE) $(PYTEST_ARGS)
.PHONY: container-run

kubernetes-run: SHELL := bash
kubernetes-run:
	@source .env && \
	set -u && \
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
	@helm test $(ZENKO_HELM_RELEASE) || HELM_FAIL=1; \
	(kubectl  -n $(ZENKO_K8S_NAMESPACE) get pods -o go-template --template '{{range .items}}{{$$pod := .metadata.name}}{{range .spec.containers}}"kubectl logs {{$$pod}} -c {{.name}} > artifacts/{{.name}}-{{$$pod}}.log"{{"\n"}}{{end}}{{end}}') | xargs -n 1 -r sh -c;  \
	(kubectl -n $(ZENKO_K8S_NAMESPACE) get pods -o jsonpath='$(HELM_TEST_PODS)') | \
	while read -r pod; do \
		kubectl -n $(ZENKO_K8S_NAMESPACE) logs $${pod}; \
		kubectl -n $(ZENKO_K8S_NAMESPACE) delete pod $${pod}; \
	done; \
	exit $${HELM_FAIL}

dumps-logs:

cleanup:

run-all: | helm-test dump-logs cleanup


	#   echo "$${pod} Logs:"; echo; \
	#   kubectl -n $(ZENKO_K8S_NAMESPACE) logs $${pod} | tee artifacts/$${pod}.log;
lint:
	@$(TOX)
.PHONY: lint
