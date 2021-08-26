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

# deploy shell UI
```
hack/scripts/install-local-shell-ui.sh shell-ui 'shell-ui.zenko.local' 'registry.scality.com/playground/nhumbert/shell-ui:fae6645'
```


#### Create Directory for Persisting Data

Create a directory and change its permissions:

``` sh
    export VOLUME_ROOT="<data_path>"
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
