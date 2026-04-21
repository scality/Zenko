#!/usr/bin/env bash
# Print the closest origin/development/* branch that HEAD descends from via
# --first-parent (e.g. "development/2.14"), or nothing if none is found.
set -eu

dev_refs=$(git for-each-ref --format='%(refname:short)' 'refs/remotes/origin/development/*')
[[ -z "${dev_refs}" ]] && exit 0

# Walk HEAD's first-parent backward, excluding anything reachable from a dev
# branch. The --boundary commit (prefixed '-') is where HEAD first meets a dev
# branch's reachable set — the fork point.
fork=$(git rev-list --first-parent --boundary HEAD --not ${dev_refs} \
  | sed -n 's/^-//p;/^-/q' | head -1)

# Empty output means HEAD is itself reachable from a dev branch (no feature
# commits ahead), so HEAD itself is the fork point.
fork=${fork:-HEAD}

# name-rev's BFS penalises second-parent hops, so for waterfalled commits the
# native origin dev (reached via first-parent) beats downstream ones (reached
# via the merge's second parent).
name=$(git name-rev --refs='refs/remotes/origin/development/*' --name-only "${fork}")
[[ "${name}" == "undefined" ]] && exit 0

name=${name%%[~^]*}
echo "${name##*origin/}"
