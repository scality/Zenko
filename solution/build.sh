#!/bin/bash
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
DOCKER_SOCKET=${DOCKER_SOCKET:-unix:///var/run/docker.sock}
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

function copy_yamls()
{
	sed "s/ZENKO_OPERATOR_TAG/${OPERATOR_TAG}/" config.yaml > ${ISO_ROOT}/config.yaml
	cp -R -f operator/ ${ISO_ROOT}/operator
	sed "s/VERSION_FULL/${VERSION_FULL}/" zenko-version-cr.yaml > ${ISO_ROOT}/operator/zenko-version-cr.yaml
}

function download_dependency_yamls()
{
	OPERATOR_DIR=${ISO_ROOT}/operator
	CRDS_DIR=${OPERATOR_DIR}/crds

	wget --directory=${CRDS_DIR} https://github.com/jetstack/cert-manager/releases/download/v0.11.0/cert-manager.yaml || exit 1

	# combine all zookeeper files into a bundle.yaml
	ZOOKEEPER_VERSION=$(grep /zookeeper-operator: deps.txt | awk -F ':' '{print $2}')
	wget -O ${BUILD_ROOT}/zookeeper-operator.tar.gz https://github.com/pravega/zookeeper-operator/archive/v${ZOOKEEPER_VERSION}.tar.gz || exit 1
	mkdir ${BUILD_ROOT}/zookeeper-operator
	tar -C ${BUILD_ROOT}/zookeeper-operator --strip-components=1 -xf ${BUILD_ROOT}/zookeeper-operator.tar.gz
	find ${BUILD_ROOT}/zookeeper-operator/deploy/ -type f -exec cat {} + >> ${CRDS_DIR}/zookeeper-operator-bundle.yaml

	# combine all kafka files into a bundle.yaml
	KAFKA_VERSION=$(grep /kafka-operator: deps.txt | awk -F ':' '{print $2}')
	wget -O ${BUILD_ROOT}/kafka-operator.tar.gz https://github.com/banzaicloud/kafka-operator/archive/${KAFKA_VERSION}.tar.gz || exit 1
	mkdir ${BUILD_ROOT}/kafka-operator
	tar -C ${BUILD_ROOT}/kafka-operator --strip-components=1 -xf ${BUILD_ROOT}/kafka-operator.tar.gz
	find ${BUILD_ROOT}/kafka-operator/config/base -type f -exec cat {} + >> ${CRDS_DIR}/kafka-operator-bundle.yaml
}

function gen_product_txt()
{
	cat > ${ISO_ROOT}/product.txt <<EOF
NAME=${PRODUCT_NAME}
VERSION=${VERSION_FULL}
SHORT_VERSION=${VERSION_SHORT}
GIT=${GIT_REVISION}
DEVELOPMENT_RELEASE=1
BUILD_TIMESTAMP=${BUILD_TIMESTAMP}
BUILD_HOST=${BUILD_HOST}
EOF
}

function gen_operator_yaml()
{
	# we need to escape / with \/ in our sed command
	sed "s/REPLACE_IMAGE/zenko-operator:${OPERATOR_TAG}/" operator.yaml > ${ISO_ROOT}/operator/operator.yaml
}

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
	[ ! -f ${FULL_PATH}/manifest.json ] && echo Failed to copy image ${IMAGE_NAME} && exit 1
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
	[ ! -f ${CONFIG_FILE} ] && echo Failed to generate nginx config ${CONFIG_FILE} && exit 1
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
	[ ! -f ${ISO} ] && echo Failed to build ISO at ${ISO} && exit 1
	sha256sum ${ISO} > ${ISO_ROOT}/SHA256SUM
	[ ! -f ${ISO_ROOT}/SHA256SUM ] && echo Failed to generate SHA256 && exit 1
	echo ISO File at ${ISO}
	echo SHA256 for ISO:
	cat ${ISO_ROOT}/SHA256SUM
}

# run everything in order
clean
mkdirs
copy_yamls
download_dependency_yamls
gen_product_txt
gen_operator_yaml
for img in ${DEP_IMAGES[@]}; do
	${DOCKER} ${DOCKER_OPTS} pull ${img}
	copy_image ${img}
done
dedupe
build_registry_config
build_iso
echo DONE
