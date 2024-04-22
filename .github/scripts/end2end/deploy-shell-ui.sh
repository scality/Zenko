#! /bin/sh

set -exu

NS=''

SHELL_UI_IMAGE=${SHELL_UI_IMAGE:-ghcr.io/scality/metalk8s/shell-ui:v127.0.0}

cat <<EOF | kubectl apply ${NS} -f -
apiVersion: apps/v1
kind: Deployment
metadata:
  name: $SHELL_UI_NAME
spec:
  replicas: 1
  selector:
    matchLabels:
      shell-ui: $SHELL_UI_NAME
  template:
    metadata:
      labels:
        shell-ui: $SHELL_UI_NAME
    spec:
      imagePullSecrets:
      - name: zenko-operator-image-pull
      containers:
      - name: shell
        image: $SHELL_UI_IMAGE
        imagePullPolicy: IfNotPresent
        ports:
        - name: http
          containerPort: 80
---
apiVersion: v1
kind: Service
metadata:
  name: $SHELL_UI_NAME
spec:
  ports:
  - port: 80
    targetPort: http
    protocol: TCP
    name: http
  selector:
    shell-ui: $SHELL_UI_NAME
---
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: $SHELL_UI_NAME
  annotations:
    nginx.ingress.kubernetes.io/backend-protocol: HTTP
    nginx.ingress.kubernetes.io/enable-cors: "true"
    kubernetes.io/ingress.class: nginx
spec:
  rules:
  - host: shell-ui.zenko.local
    http:
      paths:
      - backend:
          service:
            name: $SHELL_UI_NAME
            port:
              name: http
        path: /
        pathType: Prefix
EOF
