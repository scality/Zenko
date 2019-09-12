{{/* vim: set filetype=mustache: */}}
{{/*
Expand the name of the chart.
*/}}
{{- define "name" -}}
{{- default .Chart.Name .Values.nameOverride | trunc 63 | trimSuffix "-" -}}
{{- end -}}

{{/*
{/*
Create a default fully qualified app name.
We truncate at 63 chars because some Kubernetes name fields are limited to this (by the DNS naming spec).
If release name contains chart name it will be used as a full name.
*/}}
{{- define "mgob.fullname" -}}
{{- if .Values.fullnameOverride -}}
{{- .Values.fullnameOverride | trunc 63 | trimSuffix "-" -}}
{{- else -}}
{{- $name := default .Chart.Name .Values.nameOverride -}}
{{- if contains $name .Release.Name -}}
{{- .Release.Name | trunc 63 | trimSuffix "-" -}}
{{- else -}}
{{- printf "%s-%s" .Release.Name $name | trunc 63 | trimSuffix "-" -}}
{{- end -}}
{{- end -}}
{{- end -}}

{{/*
Create the default mongodb replicaset hosts string
*/}}
{{- define "mgob.mongodb-hosts" -}}
{{- $count := (atoi (printf "%d" (int64 .Values.mongodb.replicas))) -}}
{{- $release := .Release.Name -}}
{{- range $v := until $count }}{{ $release }}-mongodb-replicaset-{{ $v }}.{{ $release }}-mongodb-replicaset{{ if ne $v (sub $count 1) }},{{- end -}}{{- end -}}
{{- end -}}


{{- define "mgob.configMap-rendered" -}}
{{- $defaults := .Values.configMap.defaults -}}
{{- if not .Values.configMap.defaults.target.host -}}
{{ $_ := set $defaults.target "host" (include "mgob.mongodb-hosts" .) }}
{{- end -}}
{{- range $name, $value := .Values.configMap.plans -}}
{{ $name }}: {{ merge $value $defaults | toYaml | quote }}
{{- end -}}
{{- end -}}

{{- define "mgob.role" -}}
role: {{ template "mgob.fullname" . }}-backup
{{- end -}}

{{- define "mgob.secret.labels" -}}
heritage: {{ .Release.Service | quote }}
release: {{ .Release.Name | quote }}
{{- end -}}
