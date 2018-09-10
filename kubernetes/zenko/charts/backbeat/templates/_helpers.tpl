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
Create the default mongodb replicaset hosts string
*/}}
{{- define "backbeat.mongodb-hosts" -}}
{{- $count := (int ( default .Values.global.nodeCount .Values.mongodb.replicas)) -}}
{{- $release := .Release.Name -}}
{{- range $v := until $count }}{{ $release }}-mongodb-replicaset-{{ $v }}.{{ $release }}-mongodb-replicaset:27017{{ if ne $v (sub $count 1) }},{{- end -}}{{- end -}}
{{- end -}}

{{/*
Create default queue hosts string
*/}}
{{- define "backbeat.queue-hosts" -}}
{{- $count := (int (default .Values.global.nodeCount .Values.queue.replicas)) -}}
{{- $release := .Release.Name -}}
{{- range $v := until $count }}{{ $release }}-zenko-queue-{{ $v }}.{{ $release }}-zenko-queue-headless:9092{{ if ne $v (sub $count 1) }},{{- end -}}{{- end -}}
{{- end -}}

{{/*
Create default quorum hosts string
*/}}
{{- define "backbeat.quorum-hosts" -}}
{{- $count := (int (default .Values.global.nodeCount .Values.quorum.replicas)) -}}
{{- $release := .Release.Name -}}
{{- range $v := until $count }}{{ $release }}-zenko-quorum-{{ $v }}.{{ $release }}-zenko-quorum-headless:2181{{ if ne $v (sub $count 1) }},{{- end -}}{{- end -}}
{{- end -}}

{{/*
Create the default redis sentinels hosts string
*/}}
{{- define "backbeat.redis-hosts" -}}
{{- $count := (int (default .Values.global.nodeCount .Values.redis.replicas)) -}}
{{- $release := .Release.Name -}}
{{- range $v := until $count }}{{ $release }}-redis-ha-server-{{ $v }}.{{ $release }}-redis-ha:26379{{ if ne $v (sub $count 1) }},{{- end -}}{{- end -}}
{{- end -}}

{{/*
Create the default replicaCount for backbeat replication data processors
*/}}
{{- define "backbeat.replication.dataProcessor.replicaCount" -}}
{{- $count := mul .Values.replication.dataProcessor.replicaFactor (default .Values.global.nodeCount .Values.replication.dataProcessor.replicaCount) -}}
{{- printf "%d" $count }}
{{- end -}}
