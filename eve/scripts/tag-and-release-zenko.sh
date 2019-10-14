#! /bin/bash

set -e
set -u

usage() {
    local exitcode=$1

    echo "Usage: $0 -b MODULE_BRANCH -c PREV_TAG -t NEW_TAG [-p] [-r] [-N name] module"
    echo
    echo "Options:"
    echo "-b branch - Modules git-rev to tag (example: z/1.0)"
    echo "-t newtag - Release tag to create"
    echo "-c oldtag - Previous tag for changelog purposes"
    echo "-p        - Push tags and changelog to github (defaults to false)"
    echo "-r        - Retag, forces tag overwrite (defaults to false)"
    echo "-h        - Print this help"
    echo "-N        - Name as it appears in Dockerhub (if different from Github name)"
    echo "module    - Name as it appears on Github"

    exit $exitcode
}


init_build_dir() {
    rm -rf ${BUILD_DIR}
    mkdir ${BUILD_DIR}
    cd ${BUILD_DIR}

}

update_wiki() {
    echo ${COMPONENT}.wiki:master

    git clone -q git@github.com:scality/${COMPONENT}.wiki.git
    cd ${COMPONENT}.wiki
    cp ${CHANGELOG_PATH} .
    git add ${CHANGELOG}
    git commit -m "Add ${CHANGELOG}" || true
    if [ ${PUSH} == 1 ] ; then
        git push ${RETAG} origin master
    fi
    cd ..
}

append_changelog() {
    local module=$1
    git log --pretty=format:'* %s' $OLD_TAG..$NEW_TAG |
        sed -E -e "s,#([[:digit:]]+),[#\1](https://github.com/scality/${module}/pull/\1),g" \
        >> ${CHANGELOG_PATH}
}

tag_module() {
    local module=$1
    local branch=$2

    echo ${module}:${branch}

    git clone -q -b ${branch} git@github.com:scality/${module}.git
    cd ${module}
    git tag -a ${RETAG} ${NEW_TAG} -m "Release ${NEW_TAG}"
    if [ ${PUSH} == 1 ] ; then
        git push ${RETAG} origin ${NEW_TAG}
    fi

    append_changelog ${module}
    cd ..
}

parse_opts() {
RETAG=""
PUSH=0
STABLE_BRANCH=""
OLD_TAG=""
NEW_TAG=""
DOCKERHUB_NS=zenko
DOCKERHUB_NAME=""

    while getopts "c:t:b:hprN:" opt; do
      case ${opt} in
        b)
          STABLE_BRANCH=${OPTARG}
          ;;
        c)
          OLD_TAG=${OPTARG}
          ;;
        t)
          NEW_TAG=${OPTARG}
          ;;
        p)
          PUSH=1
          ;;
        r)
          RETAG='-f'
          ;;
        N)
          DOCKERHUB_NAME=${OPTARG}
          ;;
        h)
          usage 0
          ;;
        \?)
          usage 1
          ;;
      esac
    done

    shift $(($OPTIND - 1))
    COMPONENT="$*"

    test -n "${STABLE_BRANCH}" || usage 1
    #test -n "${OLD_TAG}" || usage 1
    test -n "${NEW_TAG}" || usage 1
    test -n "${COMPONENT}" || usage 1
    if test "${DOCKERHUB_NAME}" = ""
    then
	DOCKERHUB_NAME=${COMPONENT}
    fi

    #use vx.x.x scheme for github tags
    DOCKERHUB_NEW_TAG=${NEW_TAG}

BUILD_DIR=${PWD}/build-${NEW_TAG}
CHANGELOG=Changes-From-${OLD_TAG}-To-${NEW_TAG}.md
CHANGELOG_PATH=${BUILD_DIR}/${CHANGELOG}
}

build_image() {
    cd ${COMPONENT}
    if ! docker build --no-cache -t ${DOCKERHUB_NS}/${DOCKERHUB_NAME}:${DOCKERHUB_NEW_TAG} .; then
	echo "docker build failed"
	exit 1
    fi
    cd ..
}

push_image() {
    if ! docker push ${DOCKERHUB_NS}/${DOCKERHUB_NAME}:${DOCKERHUB_NEW_TAG}; then
	echo "docker push failed"
	exit 1
    fi
}

check_build_deps() {
    if ! which docker >/dev/null 2>&1 ; then
        echo "Missing docker"
        exit 1
    fi
}

parse_opts "$@"
check_build_deps
init_build_dir
tag_module ${COMPONENT} ${STABLE_BRANCH}
if [ "${COMPONENT}" != "zenko" ]; then
    update_wiki
    build_image
    push_image
fi
