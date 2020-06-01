#!/bin/bash
set -e
set -u

PWD=$(pwd)
BUILD_ROOT=${PWD}/_build
ISO_ROOT=${BUILD_ROOT}/root
IMAGES_ROOT=${ISO_ROOT}/images

PRODUCT_NAME=Zenko
PRODUCT_LOWERNAME=zenko
BUILD_TIMESTAMP=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
BUILD_HOST=$(hostname)

VERSION_SHORT=$(git describe --abbrev=0)
VERSION_FULL=${VERSION_SHORT}-dev
GIT_REVISION=$(git describe --long --always --tags --dirty)
ISO=${BUILD_ROOT}/${PRODUCT_LOWERNAME}-${VERSION_FULL}.iso

DOCKER=docker
DOCKER_OPTS=
DOCKER_SOCKET=unix:///var/run/docker.sock
HARDLINK=hardlink
OPERATOR_SDK=operator-sdk
OPERATOR_SDK_OPTS=
SKOPEO=skopeo
SKOPEO_OPTS="--override-os linux --insecure-policy"
OPERATOR_TAG=$(grep /zenko-operator: deps.txt | awk -F ':' '{print $2}')

# grab our dependencies from our deps.txt file as an array
readarray -t DEP_IMAGES < deps.txt

function clean()
{
	rm -rf ${BUILD_ROOT}
}

function mkdirs()
{
	mkdir -p ${ISO_ROOT}
}

function gen_manifest_yaml()
{
	cat > ${ISO_ROOT}/manifest.yaml <<EOF
apiVersion: solutions.metalk8s.scality.com/v1alpha1
kind: Solution
metadata:
  annotations:
    solutions.metalk8s.scality.com/display-name: ${PRODUCT_NAME}
    solutions.metalk8s.scality.com/git: ${GIT_REVISION}
    solutions.metalk8s.scality.com/development-release: true
    solutions.metalk8s.scality.com/build-timestamp: ${BUILD_TIMESTAMP}
    solutions.metalk8s.scality.com/build-host: ${BUILD_HOST}
  name: ${PRODUCT_LOWERNAME}
spec:
  version: ${VERSION_FULL}
  operator:
    image:
      name: zenko-operator
      tag: ${OPERATOR_TAG}
EOF
}

function copy_yamls()
{
	cp -R -f operator/ ${ISO_ROOT}/operator
	sed "s/VERSION_FULL/${VERSION_FULL}/" zenko-version-cr.yaml > ${ISO_ROOT}/operator/zenko-version-cr.yaml
}

# function download_dependency_yamls()
# {
	# OPERATOR_DIR=${ISO_ROOT}/operator
	# CRDS_DIR=${OPERATOR_DIR}/deploy/crds
	# mkdir -p ${CRDS_DIR}

	# CERT_VERSION=$(grep -oP '/cert-manager-controller:\K.+$' deps.txt)
	# wget -O ${CRDS_DIR}/cert_manager_crd.yaml https://github.com/jetstack/cert-manager/releases/download/${CERT_VERSION}/cert-manager.yaml

	# combine all zookeeper files into a bundle.yaml
	# ZOOKEEPER_VERSION=$(grep /zookeeper-operator: deps.txt | awk -F ':' '{print $2}')
	# ZOOKEEPER_CRD_FILE=${CRDS_DIR}/zookeeper_operator_crd.yaml
	# wget -O ${BUILD_ROOT}/zookeeper-operator.tar.gz https://github.com/pravega/zookeeper-operator/archive/v${ZOOKEEPER_VERSION}.tar.gz
	# mkdir ${BUILD_ROOT}/zookeeper-operator
	# tar -C ${BUILD_ROOT}/zookeeper-operator --strip-components=1 -xf ${BUILD_ROOT}/zookeeper-operator.tar.gz
	# cp ${BUILD_ROOT}/zookeeper-operator/deploy/crds/zookeeper_v1beta1_zookeepercluster_crd.yaml ${ZOOKEEPER_CRD_FILE}
	# echo --- >> ${ZOOKEEPER_CRD_FILE}
	# cat ${BUILD_ROOT}/zookeeper-operator/deploy/all_ns/rbac.yaml >> ${ZOOKEEPER_CRD_FILE}
	# echo --- >> ${ZOOKEEPER_CRD_FILE}
	# cat ${BUILD_ROOT}/zookeeper-operator/deploy/all_ns/operator.yaml >> ${ZOOKEEPER_CRD_FILE}
# }


function gen_operator_yaml()
{
	sed "s/REPLACE_IMAGE/zenko-operator:${OPERATOR_TAG}/" operator.yaml > ${ISO_ROOT}/operator/operator.yaml
}

# function gen_operator_config_yaml()
# {
	# CONFIG_PATH=${ISO_ROOT}/operator/operator-config.yaml
	# echo apiVersion: solutions.metalk8s.scality.com/v1alpha1 > ${CONFIG_PATH}
	# echo kind: OperatorConfig >> ${CONFIG_PATH}
	# echo repositories: >> ${CONFIG_PATH}
  	# echo "  ${VERSION_FULL}:" >> ${CONFIG_PATH}
    	# echo "    - endpoint: metalk8s-registry/${PRODUCT_LOWERNAME}-${VERSION_FULL}" >> ${CONFIG_PATH}
      	# echo "      images:" >> ${CONFIG_PATH}
	# for dep in ${DEP_IMAGES[@]}; do
		# SHORT_DEP=${dep##*/}
        	# echo "        - ${SHORT_DEP}" >> ${CONFIG_PATH}
	# done
# }

function copy_image()
{
	IMAGE_NAME=${1##*/}
	FULL_PATH=${IMAGES_ROOT}/${IMAGE_NAME/:/\/}
	mkdir -p ${FULL_PATH}
	${SKOPEO} ${SKOPEO_OPTS} copy \
		--format v2s2 --dest-compress \
		--src-daemon-host ${DOCKER_SOCKET} \
		docker-daemon:${1} \
		dir:${FULL_PATH}
}

function dedupe()
{
	${HARDLINK} -c ${IMAGES_ROOT}
}

function build_registry_config()
{
	docker run \
    	 	--name static-oci-registry \
	 	--mount type=bind,source=${ISO_ROOT}/images,destination=/var/lib/images \
		--mount type=bind,source=${ISO_ROOT},destination=/var/run \
	 	--rm \
    		docker.io/nicolast/static-container-registry:latest \
		python3 /static-container-registry.py --omit-constants /var/lib/images
	CONFIG_FILE=${ISO_ROOT}/static-container-registry.conf
	mv ${CONFIG_FILE} ${ISO_ROOT}/registry-config.inc
}

function build_iso()
{
	mkisofs -output ${ISO} \
		-quiet \
		-rock \
		-joliet \
		-joliet-long \
		-full-iso9660-filenames \
		-volid "${PRODUCT_NAME} ${VERSION_FULL}" \
		--iso-level 3 \
		-gid 0 \
		-uid 0 \
		-input-charset iso8859-1 \
		-output-charset iso8859-1 \
		${ISO_ROOT}
	sha256sum ${ISO} > ${ISO_ROOT}/SHA256SUM
	echo ISO File at ${ISO}
	echo SHA256 for ISO:
	cat ${ISO_ROOT}/SHA256SUM
}

# run everything in order
clean
mkdirs
gen_manifest_yaml
copy_yamls
# download_dependency_yamls
gen_operator_yaml
# gen_operator_config_yaml
for img in "${DEP_IMAGES[@]}"; do
	${DOCKER} ${DOCKER_OPTS} pull ${img}
	copy_image ${img}
done
dedupe
build_registry_config
build_iso
echo DONE
