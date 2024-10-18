#!/bin/sh

set -exu

export ZENKO_NAME=${1:-end2end}

corefile="
.:53 {
    errors
    health {
        lameduck 5s
    }
    ready
    rewrite name exact ci-zenko-aws-crr-target-bucket.aws-mock.zenko.local ingress-nginx-controller.ingress-nginx.svc.cluster.local
    rewrite name exact ci-zenko-aws-fail-target-bucket.aws-mock.zenko.local ingress-nginx-controller.ingress-nginx.svc.cluster.local
    rewrite name exact ci-zenko-aws-target-bucket.aws-mock.zenko.local ingress-nginx-controller.ingress-nginx.svc.cluster.local
    rewrite name exact aws-mock.zenko.local ingress-nginx-controller.ingress-nginx.svc.cluster.local
    rewrite name exact azure-mock.zenko.local ingress-nginx-controller.ingress-nginx.svc.cluster.local
    rewrite name exact blob.azure-mock.zenko.local ingress-nginx-controller.ingress-nginx.svc.cluster.local
    rewrite name exact devstoreaccount1.blob.azure-mock.zenko.local ingress-nginx-controller.ingress-nginx.svc.cluster.local
    rewrite name exact keycloak.zenko.local ingress-nginx-controller.ingress-nginx.svc.cluster.local
    rewrite name exact ui.zenko.local ingress-nginx-controller.ingress-nginx.svc.cluster.local
    rewrite name exact management.zenko.local ingress-nginx-controller.ingress-nginx.svc.cluster.local
    rewrite name exact s3.zenko.local ingress-nginx-controller.ingress-nginx.svc.cluster.local
    rewrite name exact sts.zenko.local ingress-nginx-controller.ingress-nginx.svc.cluster.local
    rewrite name exact iam.zenko.local ingress-nginx-controller.ingress-nginx.svc.cluster.local
    rewrite name exact shell-ui.zenko.local ingress-nginx-controller.ingress-nginx.svc.cluster.local
    rewrite name exact keycloak.dr.zenko.local ingress-nginx-controller.ingress-nginx.svc.cluster.local
    rewrite name exact ui.dr.zenko.local ingress-nginx-controller.ingress-nginx.svc.cluster.local
    rewrite name exact management.dr.zenko.local ingress-nginx-controller.ingress-nginx.svc.cluster.local
    rewrite name exact s3.dr.zenko.local ingress-nginx-controller.ingress-nginx.svc.cluster.local
    rewrite name exact sts.dr.zenko.local ingress-nginx-controller.ingress-nginx.svc.cluster.local
    rewrite name exact iam.dr.zenko.local ingress-nginx-controller.ingress-nginx.svc.cluster.local
    rewrite name exact shell-ui.dr.zenko.local ingress-nginx-controller.ingress-nginx.svc.cluster.local
    rewrite name exact website.mywebsite.com ingress-nginx-controller.ingress-nginx.svc.cluster.local
    kubernetes cluster.local in-addr.arpa ip6.arpa {
        pods insecure
        fallthrough in-addr.arpa ip6.arpa
        ttl 30
    }
    prometheus :9153
    forward . /etc/resolv.conf
    cache 30
    loop
    reload
    loadbalance
}
"

kubectl create configmap coredns -n kube-system --from-literal=Corefile="$corefile" -o yaml --dry-run=client | kubectl apply -f - 
kubectl rollout restart -n kube-system deployment/coredns
kubectl rollout status -n kube-system deployment/coredns
