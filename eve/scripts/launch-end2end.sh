#!/bin/sh

# Helper script that check if the content and name of the branch is documentation related only.
# This help us deciding whether we should or not launch the end2end tests.
# Returns true when it's not documentation related and false when it is. 

PATH_TO_SKIP="docs/"

if git rev-parse --abbrev-ref HEAD | grep -q 'documentation/*' ; then
    diff="$(git diff --name-only HEAD~1 | grep -v "${PATH_TO_SKIP}")"
    if [ ! -z "$diff" ]; then
        echo true
    else
        echo false
    fi
else
    echo true
fi
