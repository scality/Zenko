#!/bin/sh
set -e

source "$PWD/bin/build_conf" $@

which bumpversion > /dev/null
if [ "$?" -eq "1" ]; then
	echo "bumpversion is not installed or not currently on the path"
	exit 1
fi

if [ -n "$SHOULD_BUMP" -a -z "$TO_BUMP" ]; then
	echo "You must specify major, minor, patch or dev"
    exit 1
fi

if [ -n "$SHOULD_BUMP" ]; then
    echo "Bumping $TO_BUMP"
    VER=$(bumpversion --list --no-tag --no-commit --allow-dirty "$1" | grep new_version | cut -d '=' -f 2)
    MAJOR=$(echo "$VER" | cut -d '.' -f 1)
    MINOR=$(echo "$VER" | cut -d '.' -f 2)
fi

if [ -n "$BUILD_DOCKER" ]; then
    echo "Building docker images..."
    $BIN_DIR/build.sh --build-docker

    echo "Tagging docker images..."
    if [ -n "$TAG" ]; then
        $BIN_DIR/build.sh --tag "$TAG"
        echo "Pushing docker images"
        docker push $REPO/$IMAGE:$TAG
    elif [ -n "$SHOULD_BUMP" ]; then
        echo "Pushing docker images"
        VERSION_TAGS="$MAJOR.$MINOR $VER latest"
        if [ "$MAJOR" != "0" ]; then
            VERSION_TAGS="$MAJOR $VERSION_TAGS"
        fi
        echo "Using tags $VERSION_TAGS ...."
        $BIN_DIR/build.sh --tag "$VERSION_TAGS"
        for tag in $VERSION_TAGS; do
            docker push $REPO/$IMAGE:$tag
        done
    fi

fi

if [ -n "$BUILD_PYTHON" ]; then
    echo "Building Python Package"
    $BIN_DIR/build.sh --build-python

    echo "Uploading to PyPi"
    twine upload "dist/*"
fi

echo "Successfully released $REPO/$IMAGE:$VER"
