#!/usr/bin/env bash
# Compute version from git branch & tags.
# source version.sh [--release|--preview|--rc]

# When sourced, re-execute as subprocess so abort_error can use exit
if [[ "${BASH_SOURCE[0]}" != "$0" ]]; then
    _output=$("${BASH_SOURCE[0]}" "$@") || return $?
    eval "$_output"
    unset _output

    export VERSION VERSION_HOTFIX VERSION_PRERELEASE VERSION_SUFFIX VERSION_FULL
    return 0
fi

# Immediately abort script with an error message
abort_error() {
    echo "Error: $1" >&2
    exit 1
}

# Highest numeric suffix among tags matching glob via sed pattern, or empty if none
max_tag_number() {
    git tag -l "$1" | sed -n "$2" | sort -n | tail -1
}

# Find the nearest development/hotfix branch by merge-base distance
# Only release branches (numeric X.Y / X.Y.Z) are candidates: the namespaces
# also hold unrelated branches (e.g. development/ZENKO-2986) which carry no version.
resolve_base_branch() {
    git for-each-ref --format='%(refname:short)' \
        'refs/remotes/origin/development/[0-9]*.[0-9]*' \
        'refs/remotes/origin/hotfix/[0-9]*.[0-9]*.[0-9]*' |
    while read -r ref; do
        mb=$(git merge-base HEAD "$ref" 2>/dev/null) || continue
        echo "$(git rev-list --count "$mb..HEAD") ${ref#origin/}"
    done | sort -n | head -1 | cut -d' ' -f2
}

mode=dev
for arg in "$@"; do
    case "$arg" in
    --release|--preview|--rc)
        [[ $mode != dev ]] && abort_error "multiple modes specified"
        mode=${arg#--}
        ;;

    *)
        abort_error "unknown option '$arg'"
        ;;
    esac
done

branch=$(git rev-parse --abbrev-ref HEAD)
if [[ "$branch" == HEAD ]]; then
    branch="${GITHUB_HEAD_REF:-${GITHUB_REF#refs/heads/}}"
fi

VERSION_HOTFIX=""
VERSION_PRERELEASE=""

resolved=""
while true; do
    if [[ "$branch" =~ ^(development|q)/([0-9]+\.[0-9]+)$ ]]; then
        xy=${BASH_REMATCH[2]}
        z=$(max_tag_number "$xy.*" "s/^$xy\.\([0-9]*\)$/\1/p")
        VERSION="$xy.$(( ${z:--1} + 1 ))"
        break

    elif [[ "$branch" =~ ^hotfix/([0-9]+\.[0-9]+\.[0-9]+)$ ]]; then
        VERSION=${BASH_REMATCH[1]}
        n=$(max_tag_number "$VERSION-*" "s/^$VERSION-\([0-9]*\)$/\1/p")
        VERSION_HOTFIX="-$(( ${n:-0} + 1 ))"
        break

    elif [[ $mode != dev ]]; then
        abort_error "--$mode requires a development or hotfix branch"

    elif [[ -n "$resolved" ]]; then
        # Resolve only once, so a base branch we cannot parse aborts instead of looping
        abort_error "base branch '$branch' is not a development or hotfix branch"

    else
        # Feature/PR branch: resolve to nearest development/hotfix, -dev only
        resolved=1
        branch=$(resolve_base_branch)
        if [[ -z "$branch" ]]; then
            abort_error "no base development/hotfix branch found"
        fi
    fi
done

case $mode in
preview|rc)
    n=$(max_tag_number "$VERSION$VERSION_HOTFIX-$mode.*" "s/.*\.\([0-9]*\)$/\1/p")
    VERSION_PRERELEASE="-$mode.$(( ${n:-0} + 1 ))"
    ;;

dev)
    VERSION_PRERELEASE=-dev
    ;;

release)
    # no prerelease suffix
    ;;

*)
    abort_error "invalid mode '$mode'"
    ;;
esac

VERSION_SUFFIX="$VERSION_HOTFIX$VERSION_PRERELEASE"
VERSION_FULL="$VERSION$VERSION_SUFFIX"

echo "VERSION='$VERSION'"
echo "VERSION_HOTFIX='$VERSION_HOTFIX'"
echo "VERSION_PRERELEASE='$VERSION_PRERELEASE'"
echo "VERSION_SUFFIX='$VERSION_SUFFIX'"
echo "VERSION_FULL='$VERSION_FULL'"
