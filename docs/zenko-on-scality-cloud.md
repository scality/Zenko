# Run Zenko CI on Scality Cloud

## prerequisite

Run Scality instance CentOS-7-x86_64-GenericCloud-1905.qcow2

## Dependencies

### docker
https://docs.docker.com/engine/install/centos/

### curl
```
yum install curl -y
```

### helm
```
curl -sSL https://get.helm.sh/helm-v3.5.2-linux-amd64.tar.gz | tar -xvz
mv linux-amd64/helm /usr/bin
```
### kind
https://kubernetes.io/docs/tasks/tools/install-kubectl/
https://kind.sigs.k8s.io/docs/user/quick-start/#installation

### git
```
yum install git -y
```

## Install
```
git clone https://github.com/scality/zenko
cd zenko
```

### Bootstrap kind

```
export OPERATOR_IMAGE=zenko-operator:latest
export KIND_NODE_IMAGE=kindest/node:v1.19.11@sha256:07db187ae84b4b7de440a73886f008cf903fcf5764ba8106a9fd5243d6f32729
export WORKER_COUNT=1
export VOLUME_ROOT="/home/centos/data"
mkdir -p ${VOLUME_ROOT}

cd eve/workers/end2end
bash scripts/bootstrap-kind.sh ${KIND_NODE_IMAGE} ${VOLUME_ROOT} ${WORKER_COUNT}
```

### Login to https://registry.scality.com
```
docker login https://registry.scality.com

bash scripts/create-pull-image-secret.sh
```

### install kind dependencies
```
bash scripts/install-kind-dependencies.sh
```

### patch core dns
```
bash scripts/patch-coredns.sh
```

### {OPTIONAL FOR LOCAL DEV} Setup Shell-UI Service

```
export SHELL_UI_IMAGE=registry.scality.com/playground/nhumbert/shell-ui:fae6645
export SHELL_UI_NAME=shell-ui

bash scripts/deploy-shell-ui.sh
```

### setup keycloak realm
```
export OIDC_REALM=zenko
export OIDC_CLIENT_ID=zenko-ui
export UI_ENDPOINT=http://ui.zenko.local
bash scripts/keycloak-helper.sh setup-realm default
```

### Install zenko-operator
```
git clone https://github.com/scality/zenko-operator
cd zenko-operator

export OPERATOR_IMAGE=zenko-operator:latest

docker build -t ${OPERATOR_IMAGE} -f Dockerfile .
docker save -o operator.tar ${OPERATOR_IMAGE}
kind load image-archive operator.tar

yum install m4 -y
bash deploy/scripts/install-zenko-operator.sh "${OPERATOR_IMAGE}" default
```

### modify and apply custom ressources
```
yum install vim-enhanced -y
vim eve/workers/end2end/scripts/configs/zenko.yaml
vim eve/workers/end2end/scripts/configs/zenkoversion.yaml
kubectl -n default apply -f eve/workers/end2end/scripts/configs/zenko.yaml
kubectl -n default apply -f eve/workers/end2end/scripts/configs/zenkoversion.yaml
```

### add keycloak user

```
export OIDC_REALM=zenko
export OIDC_USERNAME=bartsimpson
export OIDC_PASSWORD=123
export OIDC_FIRST_NAME=Bart
export OIDC_LAST_NAME=Simpson

bash eve/workers/end2end/scripts/keycloak-helper.sh add-user default
```

### local DNS

On your local machine:
```
vim /etc/hosts
10.200.7.136 keycloak.zenko.local management.zenko.local s3.zenko.local sts.zenko.local iam.zenko.local ui.zenko.local
```

### [only for local UI] run shell-ui locally

```
git clone https://github.com/scality/metalk8s
cd metalk8s/shell-ui
docker build -t shell-ui .
docker run -d -p 8082:80 shell-ui
```

### [optional] Play with prometheus

export PROMETHEUS_NAME=zenko-prometheus
export CURL_POD_NAME=zenko-curl

```bash
cat <<EOF | kubectl apply ${NS} -f -
apiVersion: rbac.authorization.k8s.io/v1
kind: Role
metadata:
  creationTimestamp: null
  name: ${PROMETHEUS_NAME}
rules:
- apiGroups:
  - ""
  resources:
  - pods
  - services
  - endpoints
  verbs:
  - '*'
---
kind: RoleBinding
apiVersion: rbac.authorization.k8s.io/v1
metadata:
  name: ${PROMETHEUS_NAME}
subjects:
- kind: ServiceAccount
  name: default
  namespace: default
roleRef:
  kind: Role
  name: ${PROMETHEUS_NAME}
  apiGroup: rbac.authorization.k8s.io
---
apiVersion: monitoring.coreos.com/v1
kind: Prometheus
metadata:
  name: ${PROMETHEUS_NAME} 
  labels:
    prometheus: ${PROMETHEUS_NAME}
spec:
  version: v2.19.0
  serviceMonitorSelector:
    matchLabels:
      app.kubernetes.io/managed-by: zenko-operator
  ruleSelector:
    matchLabels:
      app.kubernetes.io/managed-by: zenko-operator
EOF
```

```bash
kubectl run ${NS} ${CURL_POD_NAME} --image=radial/busyboxplus:curl -- sleep 100000
```
