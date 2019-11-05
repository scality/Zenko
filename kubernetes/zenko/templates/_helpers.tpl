{{/* vim: set filetype=mustache: */}}
{{/*
Expand the name of the chart.
*/}}
{{- define "zenko.name" -}}
{{- default .Chart.Name .Values.nameOverride | trunc 63 | trimSuffix "-" -}}
{{- end -}}

{{/*
Create a default fully qualified app name.
We truncate at 63 chars because some Kubernetes name fields are limited to this (by the DNS naming spec).
*/}}
{{- define "zenko.fullname" -}}
{{- $name := default .Chart.Name .Values.nameOverride -}}
{{- printf "%s-%s" .Release.Name $name | trunc 63 | trimSuffix "-" -}}
{{- end -}}

{{/*
Create chart name and version as used by the chart label.
*/}}
{{- define "zenko.chart" -}}
{{- printf "%s-%s" .Chart.Name .Chart.Version | replace "+" "_" | trunc 63 | trimSuffix "-" -}}
{{- end -}}

{{- /*
Print the standard Helm labels.
*/ -}}
{{- define "zenko.labels.standard" -}}
app: {{ template "zenko.name" . }}
chart: {{ template "zenko.chart" . }}
heritage: {{ .Release.Service | quote }}
release: {{ .Release.Name | quote }}
{{- end -}}

{{/*
Create a common name for retry resources
*/}}
{{- define "zenko.retry" -}}
{{- $name := default .Chart.Name .Values.nameOverride -}}
{{- printf "%s-%s-retry" .Release.Name $name | trunc 63 | trimSuffix "-" -}}
{{- end -}}

{{/*
Create a common name for debug resources
*/}}
{{- define "zenko.debug" -}}
{{- $name := default .Chart.Name .Values.nameOverride -}}
{{- printf "%s-%s-debug" .Release.Name $name | trunc 63 | trimSuffix "-" -}}
{{- end -}}

{{/*
Create a common name for reporting resources
*/}}
{{- define "zenko.reporting" -}}
{{- $name := default .Chart.Name .Values.nameOverride -}}
{{- printf "%s-%s-reporting" .Release.Name $name | trunc 63 | trimSuffix "-" -}}
{{- end -}}

{{/*
Disables kafka from deploying it's own zookeeper
*/}}
{{- define ".Values.zookeeper.enabled" -}}
{{- printf "false" -}}
{{- end -}}

{{/*
Create the default url for the backbeat quorum service
*/}}
{{- define "zookeeper.url" -}}
{{- $port := .Values.zookeeper.port | toString -}}
{{- $zookeeperConnect := printf "%s-zenko-quorum:%s" .Release.Name $port -}}
{{- $zookeeperConnectOverride := index .Values "configurationOverrides" "zookeeper.connect" -}}
{{- default $zookeeperConnect $zookeeperConnectOverride -}}
{{- end -}}

{{/*
Create the default mongodb replicaset hosts string
*/}}
{{- define "zenko.mongodb-hosts" -}}
{{- $count := (int (.Values.nodeCount)) -}}
{{- $release := .Release.Name -}}
{{- range $v := until $count }}{{ $release }}-mongodb-replicaset-{{ $v }}.{{ $release }}-mongodb-replicaset:27017{{ if ne $v (sub $count 1) }},{{- end -}}{{- end -}}
{{- end -}}

{{/*
Create a host entry suitable for ingress
*/}}
{{- define "zenko.ingress.host_entry" }}
- host: {{ .domain }}
  http:
    paths:
      - path: /
        backend:
          serviceName: {{ .service }}
          servicePort: http
{{- end }}
