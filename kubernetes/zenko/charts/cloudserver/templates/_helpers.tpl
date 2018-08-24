{{/* vim: set filetype=mustache: */}}
{{/*
Expand the name of the chart.
*/}}
{{- define "cloudserver.name" -}}
{{- default .Chart.Name .Values.nameOverride | trunc 63 | trimSuffix "-" -}}
{{- end -}}

{{/*
Create a default fully qualified app name.
We truncate at 63 chars because some Kubernetes name fields are limited to this (by the DNS naming spec).
If release name contains chart name it will be used as a full name.
*/}}
{{- define "cloudserver.fullname" -}}
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
Create chart name and version as used by the chart label.
*/}}
{{- define "cloudserver.chart" -}}
{{- printf "%s-%s" .Chart.Name .Chart.Version | replace "+" "_" | trunc 63 | trimSuffix "-" -}}
{{- end -}}

{{/*
Create the default mongodb replicaset hosts string
*/}}
{{- define "cloudserver.mongodb-hosts" -}}
{{- $count := (atoi (printf "%d" (int64 .Values.mongodb.replicas))) -}}
{{- $release := .Release.Name -}}
{{- range $v := until $count }}{{ $release }}-mongodb-replicaset-{{ $v }}.{{ $release }}-mongodb-replicaset:27017{{ if ne $v (sub $count 1) }},{{- end -}}{{- end -}}
{{- end -}}

{{/*
Increases the number of cloudserver replicas by the replicaFactor value
*/}}
{{- define "cloudserver.replicaFactor" -}}
{{- $factor := mul .Values.replicaFactor .Values.replicaCount -}}
{{- printf "%d" $factor }}
{{- end -}}

{{/*
Create the default redis sentinels hosts string
*/}}
{{- define "cloudserver.redis-hosts" -}}
{{- $count := (int .Values.redisha.replicas) -}}
{{- $release := .Release.Name -}}
{{- range $v := until $count }}{{ $release }}-redis-ha-server-{{ $v }}.{{ $release }}-redis-ha:26379{{ if ne $v (sub $count 1) }},{{- end -}}{{- end -}}
{{- end -}}
