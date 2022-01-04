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

### tilt
```
curl -fsSL https://raw.githubusercontent.com/tilt-dev/tilt/master/scripts/install.sh | bash
```

### Login to https://registry.scality.com
```
docker login https://registry.scality.com
```

## Install
```
git clone https://github.com/scality/zenko-operator
cd zenko-operator
```


#### Create Directory for Persisting Data

Create a directory and change its permissions:

``` sh
    export VOLUME_ROOT="/home/centos/data"
    mkdir -p ${VOLUME_ROOT}
    chmod 777 -R ${VOLUME_ROOT}
```

#### Deploy Environment

To install the `Zenko-Operator` and deploy a `Zenko` instance, run:
``` sh
    hack/scripts/bootstrap-kind-dev.sh dev ${VOLUME_ROOT}

    # to use different k8s version
    hack/scripts/bootstrap-kind-dev.sh dev ${VOLUME_ROOT} kindest/node:vX.Y.Z

    # add worker nodes
    WORKER_NODE_COUNT="2" hack/scripts/bootstrap-kind-dev.sh dev ${VOLUME_ROOT} kindest/node:vX.Y.Z
```

# deploy shell UI
```
hack/scripts/install-local-shell-ui.sh shell-ui 'shell-ui.zenko.local' 'registry.scality.com/playground/nhumbert/shell-ui:fae6645'
```

### Management API should allow both IP subnet
```
vim doc/examples/zenko-1.2-dev.yaml

- 172.16.0.0/12
- 10.0.0.0/8

kubectl apply -f doc/examples/zenko-1.2-dev.yaml
```

### Update Zenko components versions

```
vim doc/examples/zenkoversion-1.2-dev.yaml
kubectl apply -f doc/examples/zenkoversion-1.2-dev.yaml
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


### Expose prometheus locally

```bash
cat <<EOF | kubectl apply ${NS} -f -
apiVersion: v1
kind: Service
metadata:
  name: ${PROMETHEUS_NAME}
spec:
  ports:
  - port: 80
    targetPort: 9090
    protocol: TCP
  selector:
    prometheus: ${PROMETHEUS_NAME} 
EOF
```

```bash
cat <<EOF | kubectl apply ${NS} -f -
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: ${PROMETHEUS_NAME}
  annotations:
    nginx.ingress.kubernetes.io/backend-protocol: HTTP
    nginx.ingress.kubernetes.io/enable-cors: "true"
    kubernetes.io/ingress.class: nginx
spec:
  rules:
  - host: prometheus.zenko.local
    http:
      paths:
      - backend:
          service:
            name: ${PROMETHEUS_NAME}
            port:
              number: 80
        path: /
        pathType: Prefix
EOF
```

### Debug

```bash
kubectl run ${CURL_POD_NAME} --image=radial/busyboxplus:curl -- sleep 100000

kubectl get pod prometheus-zenko-prometheus-0 -o jsonpath='{..ip}'

kubectl exec ${CURL_POD_NAME} -- curl -s --max-time 1 --connect-timeout 1 10.244.0.129:9090/api/v1/targets?state=active
```
