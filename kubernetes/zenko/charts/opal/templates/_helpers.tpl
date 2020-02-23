{{/* vim: set filetype=mustache: */}}
{{/*
Expand the name of the chart.
*/}}
{{- define "opal.name" -}}
{{- default .Chart.Name .Values.nameOverride | trunc 63 | trimSuffix "-" -}}
{{- end -}}

{{/*
Create a default fully qualified app name.
We truncate at 63 chars because some Kubernetes name fields are limited to this (by the DNS naming spec).
If release name contains chart name it will be used as a full name.
*/}}
{{- define "opal.fullname" -}}
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
{{- define "opal.chart" -}}
{{- printf "%s-%s" .Chart.Name .Chart.Version | replace "+" "_" | trunc 63 | trimSuffix "-" -}}
{{- end -}}

{{/*
Common labels
*/}}
{{- define "opal.labels" -}}
app.kubernetes.io/name: {{ include "opal.name" . }}
helm.sh/chart: {{ include "opal.chart" . }}
app.kubernetes.io/instance: {{ .Release.Name }}
{{- if .Chart.AppVersion }}
app.kubernetes.io/version: {{ .Chart.AppVersion | quote }}
{{- end }}
app.kubernetes.io/managed-by: {{ .Release.Service }}
{{- end -}}


{{/*
Create the blobserver variant of opal.name
adds -blobserver by default
*/}}
{{- define "blobserver.name" -}}
{{- if .Values.blobserverNameOverride -}}
{{- .Values.blobserverNameOverride | trunc 63 | trimSuffix "-" -}}
{{- else -}}
{{- $chart_fullname := include "opal.name" . -}}
{{- $name := default "blobserver" .Values.blobserverNameOverride -}}
{{- printf "%s-%s" $chart_fullname $name | trunc 63 | trimSuffix "-" -}}
{{- end -}}
{{- end -}}

{{/*
Create the blobserver variant of opal.fullname
adds -blobserver by default
*/}}
{{- define "blobserver.fullname" -}}
{{- if .Values.blobserverFullnameOverride -}}
{{- .Values.blobserverFullnameOverride | trunc 63 | trimSuffix "-" -}}
{{- else -}}
{{- $chart_fullname := include "opal.fullname" . -}}
{{- $name := default "blobserver" .Values.blobserverNameOverride -}}
{{- printf "%s-%s" $chart_fullname $name | trunc 63 | trimSuffix "-" -}}
{{- end -}}
{{- end -}}

{{/*
Create the blobserver variant of opal.name
adds -blobserver by default
*/}}
{{- define "jabba.name" -}}
{{- if .Values.jabbaNameOverride -}}
{{- .Values.jabbaNameOverride | trunc 63 | trimSuffix "-" -}}
{{- else -}}
{{- $chart_fullname := include "opal.name" . -}}
{{- $name := default "jabba" .Values.jabbaNameOverride -}}
{{- printf "%s-%s" $chart_fullname $name | trunc 63 | trimSuffix "-" -}}
{{- end -}}
{{- end -}}

{{/*
Create the blobserver variant of fullname
adds -jabba by default
*/}}
{{- define "jabba.fullname" -}}
{{- if .Values.jabbaFullnameOverride -}}
{{- .Values.jabbaFullnameOverride | trunc 63 | trimSuffix "-" -}}
{{- else -}}
{{- $chart_fullname := include "opal.fullname" . -}}
{{- $name := default "jabba" .Values.jabbaNameOverride -}}
{{- printf "%s-%s" $chart_fullname $name | trunc 63 | trimSuffix "-" -}}
{{- end -}}
{{- end -}}

{{/*
Increases the number of blobserver replicas by the replicaFactor value
*/}}
{{- define "blobserver.replicaFactor" -}}
{{- $factor := mul .Values.blobserver.replicaFactor .Values.blobserver.replicaCount -}}
{{- printf "%d" $factor }}
{{- end -}}

{{/*
Increases the number of jabba replicas by the replicaFactor value
*/}}
{{- define "jabba.replicaFactor" -}}
{{- $factor := mul .Values.jabba.replicaFactor .Values.jabba.replicaCount -}}
{{- printf "%d" $factor }}
{{- end -}}

{{/*
Create the default mongodb replicaset hosts string
*/}}
{{- define "opal.mongodb-hosts" -}}
{{- $count := (atoi (printf "%d" (int64 .Values.mongodb.replicas))) -}}
{{- $release := .Release.Name -}}
{{- range $v := until $count }}{{ $release }}-mongodb-replicaset-{{ $v }}.{{ $release }}-mongodb-replicaset:27017{{ if ne $v (sub $count 1) }},{{- end -}}{{- end -}}
{{- end -}}

{{/*
Create the default redis sentinels hosts string
*/}}
{{- define "opal.redis-hosts" -}}
{{- $count := (int .Values.redis.replicas) -}}
{{- $release := .Release.Name -}}
{{- range $v := until $count }}{{ $release }}-redis-ha-server-{{ $v }}.{{ $release }}-redis-ha:26379{{ if ne $v (sub $count 1) }},{{- end -}}{{- end -}}
{{- end -}}

{{/*
Create the s3-data host
*/}}
{{- define "opal.s3-data-host" -}}
{{- printf "%s-s3-data" .Release.Name }}
{{- end -}}
