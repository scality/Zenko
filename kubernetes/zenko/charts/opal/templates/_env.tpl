{{- define "blobserver.env" }}
- name: DATA_HOST
  value: "{{- printf "%s-%s" .Release.Name "s3-data" | trunc 63 | trimSuffix "-" -}}"
- name: ENDPOINT
  value: "{{ include "blobserver.fullname" . }}"
- name: LOG_LEVEL
  value: "{{ .Values.logging.level }}"
- name: HEALTHCHECKS_ALLOWFROM
  value: "{{ .Values.allowHealthchecksFrom }}"
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
- name: BLOB_METADATA
  value: "mongodb"
- name: BLOB_DATA
  value: "multiple"
- name: BLOB_DATA_CLIENT_HOST
  value: {{ include "opal.s3-data-host" . }}
- name: MONGODB_HOSTS
  value: "{{ include "opal.mongodb-hosts" . }}"
- name: MONGODB_RS
  value: "{{ default "rs0" .Values.mongodb.replicaSet }}"
# force remote management
- name: REMOTE_MANAGEMENT_DISABLE
  value: "{{ ternary "0" "1" .Values.global.orbit.enabled }}"
- name: MANAGEMENT_ENDPOINT
  value: "{{ .Values.global.orbit.endpoint }}"
- name: PUSH_ENDPOINT
  value: "{{- .Values.global.orbit.pushEndpoint -}}"
{{- if .Values.kmip.enabled }}
- name: BLOB_KMS
  value: kmip
- name: BLOB_KMIP_PORT
  value: "{{ .Values.kmip.port }}"
- name: BLOB_KMIP_HOST
  value: "{{ .Values.kmip.host }}"
- name: BLOB_KMIP_COMPOUND_CREATE
  value: "{{ .Values.kmip.compoundCreate }}"
- name: BLOB_BUCKET_ATTRIBUTE_NAME
  value: "{{ .Values.kmip.bucketAttributeName }}"
- name: BLOB_KMIP_PIPELINE_DEPTH
  value: "{{ .Values.kmip.pipelineDepth }}"
- name: BLOB_KEY
  value: /ssl-kmip/kmip-key.pem
- name: BLOB_KMIP_CERT
  value: /ssl-kmip/kmip-cert.pem
- name: BLOB_KMIP_CA
  value: /ssl-kmip/kmip-ca.pem
{{- end }}
{{- end }}

{{- define "jabba.env" }}
- name: JABBA_REST_ENDPOINTS
  value: "{{ include "jabba.fullname" . }},{{ .Values.jabba.endpoint }}"
- name: JABBA_HOSTNAME
  value: "{{ .Values.jabba.endpoint }}"
- name: JABBA_LOG_LEVEL
  value: "{{ .Values.logging.level }}"
- name: JABBA_ALLOW_HEALTHCHECK
  value: "{{ .Values.allowHealthchecksFrom }}"
- name: JABBA_HTTPS
  value: ''
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
- name: JABBA_METADATA_BACKEND
  value: mongodb
- name: JABBA_AUTH_BACKEND
  value: mongodb
- name: JABBA_TOKEN_BACKEND
  value: redis
- name: JABBA_MONGODB_HOSTS
  value: "{{ include "opal.mongodb-hosts" . }}"
- name: JABBA_MONGODB_RS
  value: "{{ default "rs0" .Values.mongodb.replicaSet }}"
- name: JABBA_MONGODB_WRITE_CONCERN
  value: "{{ default "majority" .Values.mongodb.writeConcern }}"
- name: JABBA_MONGODB_READ_PREFERENCE
  value: "{{ default "primary" .Values.mongodb.readPreference }}"
- name: JABBA_EXTERNAL_TLS
  value: "true"
- name: JABBA_REDIS_SENTINELS
  value: "{{ include "opal.redis-hosts" . }}"
- name: JABBA_REDIS_NAME
  value: "{{ default "jabba" .Values.redis.sentinel.name }}"
{{- end }}
