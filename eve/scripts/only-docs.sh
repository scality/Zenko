#!/bin/sh
# This script is used to determine if the diff of a documentation branch
# includes files modified outside of the docs/ folder. If it finds a diff only
# within the docs folder, it will set the DOC_ONLY env var to true (used by
# the E2E tests Makefile).

if git branch | grep \* | cut -d ' ' -f2 | grep -q 'documentation\/*' ; then
    echo "On documentaion branch, checking diff"
    diff="$(git diff --name-only HEAD~1 | grep -v docs/)"
    if [ ! -z "$diff" ]; then
        echo "Found files changed outside of docs directory:"
        echo "$diff"
    else
        echo "Did not find files changed outside of docs directory."
        export DOCS_ONLY=true
    fi
else
    echo "Not documentation branch"
fi
