kubectl create secret generic s3-creds --from-file=s3-credentials=secrets.txt.vr
kubectl create -f kub-stack.yml
