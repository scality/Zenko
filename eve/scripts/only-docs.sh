#!/bin/sh

if git branch | grep \* | cut -d ' ' -f2 | grep -q '^documentation*' ; then
    echo "On documentaion branch, checking diff"
    diff="$(git diff --name-only HEAD~1 | grep -v docs/)"
    if [ ! -z "$diff" ]; then
        echo "Found files changed outside of docs directory:"
        echo "$diff"
    else
        echo "Did not find files changed outside of docs directory."
        export DOCS_ONLY=true
        echo "Running e2e suite"
    fi
else
    echo "Not documentation branch running test suite"
fi
