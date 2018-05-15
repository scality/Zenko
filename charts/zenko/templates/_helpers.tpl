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
