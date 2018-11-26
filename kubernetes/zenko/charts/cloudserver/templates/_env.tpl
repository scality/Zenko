{{- define "cloudserver.env" }}
env:
  - name: DATA_HOST
    value: "{{- printf "%s-%s" .Release.Name "s3-data" | trunc 63 | trimSuffix "-" -}}"
  - name: REDIS_HOST
    value: "{{- printf "%s-%s" .Release.Name "redis-ha" | trunc 63 | trimSuffix "-" -}}"
  - name: REDIS_PORT
    value: "6379"
  - name: REDIS_SENTINELS
    value: "{{ template "cloudserver.redis-hosts" . }}"
  - name: REDIS_HA_NAME
    value: "{{ .Values.redis.sentinel.name }}"
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
  - name: AWS_S3_HTTPAGENT_KEEPALIVE
    value: "{{ .Values.externalBackends.aws_s3.keepAlive }}"
  - name: AWS_S3_HTTPAGENT_KEEPALIVE_MS
    value: "{{ .Values.externalBackends.aws_s3.keepAliveMsecs }}"
  - name: AWS_S3_HTTPAGENT_KEEPALIVE_MAX_SOCKETS
    value: "{{ .Values.externalBackends.aws_s3.maxSockets }}"
  - name: AWS_S3_HTTPAGENT_KEEPALIVE_MAX_FREE_SOCKETS
    value: "{{ .Values.externalBackends.aws_s3.maxFreeSockets }}"
  - name: GCP_HTTPAGENT_KEEPALIVE
    value: "{{ .Values.externalBackends.gcp.keepAlive }}"
  - name: GCP_HTTPAGENT_KEEPALIVE_MS
    value: "{{ .Values.externalBackends.gcp.keepAliveMsecs }}"
  - name: GCP_HTTPAGENT_KEEPALIVE_MAX_SOCKETS
    value: "{{ .Values.externalBackends.gcp.maxSockets }}"
  - name: GCP_HTTPAGENT_KEEPALIVE_MAX_FREE_SOCKETS
    value: "{{ .Values.externalBackends.gcp.maxFreeSockets }}"
  {{- if .Values.global.orbit.storageLimit.enabled }}
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
  {{- if .Values.proxy.no_proxy }}
  - name: no_proxy
    value: "{{ .Values.proxy.no_proxy }}"
  - name: NO_PROXY
    value: "{{ .Values.proxy.no_proxy }}"
  {{- end }}
  - name: S3METADATA
    value: "mongodb"
  - name: MONGODB_HOSTS
    value: "{{ template "cloudserver.mongodb-hosts" . }}"
  - name: MONGODB_RS
    value: "{{ default "rs0" .Values.mongodb.replicaSet }}"
  {{- if .Values.global.orbit.enabled }}
  - name: REMOTE_MANAGEMENT_DISABLE
    value: "0"
  - name: MANAGEMENT_ENDPOINT
    value: "{{- .Values.global.orbit.endpoint -}}"
  - name: PUSH_ENDPOINT
    value: "{{- .Values.global.orbit.pushEndpoint -}}"
  {{- else }}
  - name: REMOTE_MANAGEMENT_DISABLE
    value: "1"
  - name: S3AUTH_CONFIG
    value: "/data/authdata.json"
  {{- if .Values.global.locationConstraints }}
  - name: S3_LOCATION_FILE
    value: "/etc/config/locationConfig"
  {{- if .Values.global.replicationEndpoints }}
  - name: S3_REPLICATION_FILE
    value: "/etc/config/replicationInfo"
  {{- end }}
  {{- end }}
  {{- end }}
{{- end }}
