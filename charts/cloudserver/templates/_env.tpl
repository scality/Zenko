{{- define "cloudserver.env" }}
env:
  - name: DATA_HOST
    value: "{{- printf "%s-%s" .Release.Name "s3-data" | trunc 63 | trimSuffix "-" -}}"
  - name: REDIS_HOST
    value: "{{- printf "%s-%s" .Release.Name "redis" | trunc 63 | trimSuffix "-" -}}"
  - name: REDIS_PORT
    value: "6379"
  - name: REDIS_HA_HOST
    value: "{{- printf "%s-%s" .Release.Name "redis-ha-master-svc" | trunc 63 | trimSuffix "-" -}}"
  - name: REDIS_HA_PORT
    value: "6379"
  - name: CRR_METRICS_HOST
    value: "{{- printf "%s-%s" .Release.Name "backbeat-api" | trunc 63 | trimSuffix "-" -}}"
  - name: CRR_METRICS_PORT
    value: "8900"
  - name: LOG_LEVEL
    value: {{ .Values.logging.level }}
  - name: ENDPOINT
    value: "{{ .Release.Name }}-cloudserver,{{ .Values.endpoint }}"
  - name: HEALTHCHECKS_ALLOWFROM
    value: "{{ .Values.allowHealthchecksFrom }}"
  {{- if .Values.orbit.storageLimit.enabled }}
  - name: STORAGE_LIMIT_ENABLED
    value: "true"
  {{- end }}
  {{- if .Values.proxy.http }}
  - name: http_proxy
    value: "{{ .Values.proxy.http }}"
  - name: HTTP_PROXY
    value: "{{ .Values.proxy.http }}"
  - name: https_proxy
    value: "{{- if .Values.proxy.https }}{{ .Values.proxy.https }}{{- else }}{{ .Values.proxy.http }}{{- end }}"
  - name: HTTPS_PROXY
    value: "{{- if .Values.proxy.https }}{{ .Values.proxy.https }}{{- else }}{{ .Values.proxy.http }}{{- end }}"
  {{- else if .Values.proxy.https }}
  - name: https_proxy
    value: "{{ .Values.proxy.https }}"
  - name: HTTPS_PROXY
    value: "{{ .Values.proxy.https }}"
  {{- end }}
  {{- if .Values.proxy.caCert }}
  - name: NODE_EXTRA_CA_CERTS
    value: "/ssl/ca.crt"
  {{- end }}
  - name: S3METADATA
    value: "mongodb"
  - name: MONGODB_HOSTS
    value: "{{ template "cloudserver.mongodb-hosts" . }}"
  - name: MONGODB_RS
    value: "{{ default "rs0" .Values.mongodb.replicaSet }}"
  {{- if .Values.orbit.enabled }}
  - name: REMOTE_MANAGEMENT_DISABLE
    value: "0"
  - name: MANAGEMENT_ENDPOINT
    value: "{{- .Values.orbit.endpoint -}}"
  - name: PUSH_ENDPOINT
    value: "{{- .Values.orbit.pushEndpoint -}}"
  {{- else }}
  - name: REMOTE_MANAGEMENT_DISABLE
    value: "1"
  - name: SCALITY_ACCESS_KEY_ID
    valueFrom:
      secretKeyRef:
        name: {{ template "cloudserver.fullname" . }}
        key: keyId
  - name: SCALITY_SECRET_ACCESS_KEY
    valueFrom:
      secretKeyRef:
        name: {{ template "cloudserver.fullname" . }}
        key: secretKey
  {{- end }}
{{- end }}
