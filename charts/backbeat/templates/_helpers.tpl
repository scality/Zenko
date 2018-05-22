{{/* vim: set filetype=mustache: */}}
{{/*
Expand the name of the chart.
*/}}
{{- define "backbeat.name" -}}
{{- default .Chart.Name .Values.nameOverride | trunc 63 | trimSuffix "-" -}}
{{- end -}}

{{/*
Create a default fully qualified app name.
We truncate at 63 chars because some Kubernetes name fields are limited to this (by the DNS naming spec).
If release name contains chart name it will be used as a full name.
*/}}
{{- define "backbeat.fullname" -}}
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
{{- define "backbeat.chart" -}}
{{- printf "%s-%s" .Chart.Name .Chart.Version | replace "+" "_" | trunc 63 | trimSuffix "-" -}}
{{- end -}}

{{/*
Template all common templated values
*/}}
{{- define "backbeat.common" -}}
name: REMOTE_MANAGEMENT_DISABLE
value: "{{- if .Values.orbit.enabled }}0{{- else }}1{{- end }}"
name: ZOOKEEPER_CONNECTION_STRING
value: "{{- printf "%s-zenko-quorum:2181" .Release.Name | trunc 63 | trimSuffix "-" -}}"
name: KAFKA_HOSTS
value: "{{- printf "%s-zenko-queue:9092" .Release.Name | trunc 63 | trimSuffix "-" -}}"
name: REDIS_HOST
value: "{{- printf "%s-%s" .Release.Name "redis" | trunc 63 | trimSuffix "-" -}}"
{{- end- }}