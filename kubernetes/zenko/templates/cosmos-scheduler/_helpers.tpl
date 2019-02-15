{{/* vim: set filetype=mustache: */}}
{{/*
Create default cosmos app name.
*/}}
{{- define "cosmos-scheduler.name" -}}
{{- default "cosmos-scheduler" .Values.cosmos.scheduler.nameOverride | trunc 63 | trimSuffix "-" -}}
{{- end -}}

{{/*
Create a default fully qualified app name.
We truncate at 63 chars because some Kubernetes name fields are limited to this (by the DNS naming spec).
*/}}
{{- define "cosmos-scheduler.fullname" -}}
{{- $name := default "cosmos-scheduler" .Values.cosmos.scheduler.nameOverride -}}
{{- printf "%s-%s" .Release.Name $name | trunc 63 | trimSuffix "-" -}}
{{- end -}}
