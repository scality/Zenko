#!/bin/sh

source "$PWD/bin/build_conf" $@

cd $BIN_DIR/..

PIPE="$BIN_DIR/build.sock"
if [ ! -p "$PIPE" ]; then
	mkfifo "$PIPE"
fi

case "$1" in
    "--build-docker")
        echo "Building $REPO/$IMAGE..."
        docker build -t $REPO/$IMAGE:build-tag . 2>"$PIPE" 1> "$PIPE" &
        BUILD_PID="$!"
        ;;
    "--tag")
        if [ -z "$2" ]; then
            echo "You must provide a tag!"
            exit 1
        fi
        for tag in $2; do
            docker tag $REPO/$IMAGE:build-tag $REPO/$IMAGE:$tag
        done
        exit 0
        ;;
    "--build-python")
        echo "Removing old releases"
        rm -rf dist/*
        echo "Building PyPi sdist"
        python setup.py sdist 2>"$PIPE" 1>"$PIPE" &
        ;;
    *)
        echo "You must provide either --build or --tag"
        exit 1
        ;;
esac

BUILD_OUTPUT=""
while read -r line; do
	BUILD_OUTPUT="$BUILD_OUTPUT\n$line"
    printf '.'
done < "$PIPE"
wait $BUILD_PID


printf "\n"
if [ "$?" -ne 0 ]; then
    printf "Build Failed!\n%s" "$BUILD_OUTPUT"
else
    printf "Build Successful\n"
fi

rm $PIPE
