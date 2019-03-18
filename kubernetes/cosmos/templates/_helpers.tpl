{{/* vim: set filetype=mustache: */}}
{{/*
Expand the name of the chart.
*/}}
{{- define "cosmos.name" -}}
{{- default .Chart.Name .Values.nameOverride | trunc 63 | trimSuffix "-" -}}
{{- end -}}

{{/*
Create a default fully qualified app name.
We truncate at 63 chars because some Kubernetes name fields are limited to this (by the DNS naming spec).
If release name contains chart name it will be used as a full name.
*/}}
{{- define "cosmos.fullname" -}}
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
{{- define "cosmos.chart" -}}
{{- printf "%s-%s" .Chart.Name .Chart.Version | replace "+" "_" | trunc 63 | trimSuffix "-" -}}
{{- end -}}

{{/*
Create a fully qualified pfsd name.
We truncate at 63 chars because some Kubernetes name fields are limited to this (by the DNS naming spec).
*/}}
{{- define "cosmos.pfsd.fullname" -}}
{{- if .Values.fullnameOverride -}}
{{- printf "%s-%s" .Values.fullnameOverride "cosmos-pfsd" | trunc 63 | trimSuffix "-" -}}
{{- else if .Values.pfsd.fullnameOverride -}}
{{- .Values.pfsd.fullnameOverride | trunc 63 | trimSuffix "-" -}}
{{- else -}}
{{- $name := default .Chart.Name .Values.nameOverride -}}
{{- if contains $name .Release.Name -}}
{{- printf "%s-%s" .Release.Name .Values.pfsd.name | trunc 63 | trimSuffix "-" -}}
{{- else -}}
{{- printf "%s-%s-%s" .Release.Name $name .Values.pfsd.name | trunc 63 | trimSuffix "-" -}}
{{- end -}}
{{- end -}}
{{- end -}}

{{/*
Create a fully qualified pfsd name.
We truncate at 63 chars because some Kubernetes name fields are limited to this (by the DNS naming spec).
*/}}
{{- define "cosmos.rclone.fullname" -}}
{{- if .Values.fullnameOverride -}}
{{- printf "%s-%s" .Values.fullnameOverride "cosmos-rclone" | trunc 63 | trimSuffix "-" -}}
{{- else if .Values.rclone.fullnameOverride -}}
{{- .Values.rclone.fullnameOverride | trunc 63 | trimSuffix "-" -}}
{{- else -}}
{{- $name := default .Chart.Name .Values.nameOverride -}}
{{- if contains $name .Release.Name -}}
{{- printf "%s-%s" .Release.Name .Values.rclone.name | trunc 63 | trimSuffix "-" -}}
{{- else -}}
{{- printf "%s-%s-%s" .Release.Name $name .Values.rclone.name | trunc 63 | trimSuffix "-" -}}
{{- end -}}
{{- end -}}
{{- end -}}

{{/*
Create a fully qualified name for the bucket to create.
*/}}
{{- define "cosmos.dst" -}}
{{- $dst := merge (default .Values.rclone.destination .Values.rclone.remote) .Values.rclone.destination -}}
{{- default (include "cosmos.fullname" .) $dst.bucket -}}
{{- end -}}

{{/*
Create a name for the bucket to create.
*/}}
{{- define "cosmos.src" -}}
{{- default "/data" .bucket -}}
{{- end -}}

{{/*
Generate config map from values passed while omitting secrets 
*/}}
{{- define "cosmos.rclone.configmap" -}}
{{- range $key, $value := omit . "accessKey" "secretKey" "existingSecret" -}}
{{ $key }} = {{ $value }}
{{ end }}
{{- end -}}

{{/*
Define the fully qualified name for the rclone's remote secret.
*/}}
{{- define "cosmos.rclone.secret.name" -}}
{{- $dst := merge (default .Values.rclone.destination .Values.rclone.remote) .Values.rclone.destination -}}
{{- if $dst.existingSecret -}}
{{- printf "%s" $dst.existingSecret -}}
{{- else -}}
{{- printf "%s" (include "cosmos.rclone.fullname" .) -}}
{{- end -}}
{{- end -}}

{{/*
Create storage class name
*/}}
{{- define "cosmos.storageclass.name" -}}
{{- default (include "cosmos.fullname" . ) .Values.persistentVolume.storageClass -}}
{{- end -}}

{{/*
The standard labels are frequently used in metadata.
*/ -}}
{{- define "cosmos.labels" -}}
app: {{ template "cosmos.name" . }}
chart: {{ template "cosmos.chart" . }}
heritage: {{ .Release.Service | quote }}
release: {{ .Release.Name | quote }}
{{- end -}}

