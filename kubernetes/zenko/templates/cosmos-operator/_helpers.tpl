{{/* vim: set filetype=mustache: */}}
{{/*
Create default cosmos app name.
*/}}
{{- define "cosmos-operator.name" -}}
{{- default "cosmos-operator" .Values.cosmos.nameOverride | trunc 63 | trimSuffix "-" -}}
{{- end -}}

{{/*
Create a default fully qualified app name.
We truncate at 63 chars because some Kubernetes name fields are limited to this (by the DNS naming spec).
*/}}
{{- define "cosmos-operator.fullname" -}}
{{- $name := default "cosmos-operator" .Values.cosmos.nameOverride -}}
{{- printf "%s-%s" .Release.Name $name | trunc 63 | trimSuffix "-" -}}
{{- end -}}

{{/*
Create storage class name to be used by cosmos components
*/}}
{{- define "cosmos-operator.storageclass" -}}
{{- printf "%s-remote-storage" (include "cosmos-operator.fullname" . ) -}}
{{- end -}}
