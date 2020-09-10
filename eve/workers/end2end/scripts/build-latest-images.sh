#!/bin/sh

set -exu

BUILD_DIR="build"

S3UTILS_IMAGE="registry.scality.com/zenko/s3utils"
S3UTILS_TAG="latest"
S3UTILS_REPO="git@github.com:scality/s3utils.git"
S3UTILS_BRANCH="development/8.1"

UI_IMAGE="registry.scality.com/sf-eng/zenko-ui"
UI_TAG="latest"
UI_REPO="git@github.com:scality/zenko-ui.git"
UI_BRANCH="development/1.0"

E2E_IMAGE="registry.scality.com/zenko/zenko-e2e"
E2E_TAG="latest"

build_dir() {
  mkdir -p  ${BUILD_DIR}
}

build_latest() {
  local repo=$1
  local branch=$2
  local image=$3
  local tag=$4
  local build_dir=$5

  git clone ${repo} -b ${branch} ${build_dir}
  docker build -t ${image}:${tag} ${build_dir}
  kind load docker-image ${image}:${tag}
}

build_dir
build_latest ${S3UTILS_REPO} ${S3UTILS_BRANCH} ${S3UTILS_IMAGE} ${S3UTILS_TAG} ${BUILD_DIR}/s3utils
build_latest ${UI_REPO} ${UI_BRANCH} ${UI_IMAGE} ${UI_TAG} ${BUILD_DIR}/zenko-ui

