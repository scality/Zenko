
VIRTUAL_ENV_DIR := tests/.venv
TEST_ID ?= $(shell python -c 'import random; print(hex(random.randint(0,0xfffff))[2:])')
TEST_ID := $(TEST_ID)

ANSIBLE_ARGS ?= $(AA)
ANSIBLE_CALL := $(ANSIBLE) $@ $(ANSIBLE_ARGS)

DOCKER_IMAGE_TEST := zenko-releng

RUN_TEST_DOCKER ?= 1
DOCKER_TEST ?= zenko-releng:0.0.5
CONTAINERIZED_TEST_TARGETS := test \
			      docker-shell

CHART_ZENKO ?= zenko/zenko

define activate_venv
[ -z "$${VIRTUAL_ENV}" ] \
&& echo "Activating venv" \
&& . ./$(VIRTUAL_ENV_DIR)/bin/activate
endef

ifeq ($(RUN_DOCKER),1)

$(CONTAINERIZED_TARGETS):
	@docker run --rm \
	-v $(shell pwd):/workdir \
	-v /var/run/docker.sock:/var/run/docker.sock \
	-v ${HOME}/.gitconfig:/.gitconfig \
	-v $${KUBECONFIG:-$${HOME}/.kube/config}:/.kube/config
	-u $(shell id -u):$(shell id -g) \
	$(foreach gid,$(shell id -G),--group-add $(gid)) \
	-e TEST_ID=$(TEST_ID) \
	-e CHART_ZENKO=$(CHART_ZENKO) \
	$(DOCKER_TEST) \
	make $@ $(MAKEFLAGS)

else

test_namespace:
	$(info TEST_ID=$(TEST_ID))
	$(eval TEST_NAMESPACE := zenko-test-$(TEST_ID))
	kubectl get namespace $(TEST_NAMESPACE); \
	if [ "$$?" -ne "0" ]; then \
	    kubectl create namespace $(TEST_NAMESPACE); \
	fi;
	kubectl label namespace $(TEST_NAMESPACE) app=zenko-ci --overwrite

test: test_namespace | $(VIRTUAL_ENV_DIR)
	$(eval HELM_TEST := helm --namespace $(TEST_NAMESPACE) --values charts/value-dev.yml)
	$(HELM_TEST) upgrade --install zenko-test-$(TEST_ID) $(CHART_ZENKO)
	$(HELM_TEST) upgrade --install s3-dest-$(TEST_ID) $(CHART_ZENKO)
	export CLOUDFRONT_POD=$$(kubectl -n $(TEST_NAMESPACE) get pods -l app=cloudserver-front,release=zenko-test-$(TEST_ID) \
	-o jsonpath='{.items[].metadata.name}'); \
	echo $${CLOUDFRONT_POD}; \
	while [ $$(kubectl -n $(TEST_NAMESPACE) exec -i $${CLOUDFRONT_POD} /bin/sleep 5 >/dev/null 2>&1; echo $$?) -ne 0 ]; do \
	   echo 'wait for cloudserver pod to show up'; \
	   sleep 5; \
	done; \
	$(activate_venv); cd tests; \
	K8S_AUTH_NAMESPACE=$(TEST_NAMESPACE) pytest

docker-shell:
	/bin/sh

endif

virtualenv: $(VIRTUAL_ENV_DIR)
	@echo now you can type following command to activate your virtualenv
	@echo source $(VIRTUAL_ENV_DIR)/bin/activate

$(VIRTUAL_ENV_DIR):
	@selinuxenabled; \
	if [ $$? -eq 0 ]; then \
	    VIRTUALENV_ARGS='--system-site-packages'; \
	    PIP_ARGS='--ignore-installed'; \
	fi; \
	if [ "$${VIRTUAL_ENV}" = "" ]; then \
	    PYTHON_EXE=$$(which python2 || which python); \
	    VIRTUALENV_EXE=$$(which virtualenv); \
	    $${VIRTUALENV_EXE} $${VIRTUALENV_ARGS} $(VIRTUAL_ENV_DIR) -p $${PYTHON_EXE}; \
	else \
	    touch $(VIRTUAL_ENV_DIR); \
	fi; \
	$(activate_venv); \
	pip install $${PIP_ARGS} --upgrade setuptools; \
	pip install $${PIP_ARGS} -r tests/requirements.txt

clean:
	rm -r tests/*.retry

# :vim set noexpandtab shiftwidth=8 softtabstop=0
