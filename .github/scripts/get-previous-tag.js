
function getPreviousTag(version, allReleases) {
    while (version) {
        // Peel one trailing segment (separator + non-separator chars).
        // Separators are `.` (major.minor.patch) or `-` (hotfix / pre-release
        // modifier).
        const match = version.match(/([-.])[^-.]+$/);
        if (!match) {
            return undefined;
        }
        const separator = match[1];
        const prefix = version.substring(0, match.index);
        version = prefix;

        // Look for a "direct sibling" at this level: a tag shaped exactly
        // `<prefix><separator><segment>` with no further separators. This
        // excludes side-branch tags (hotfix X.Y.Z-N or X.Y.Z.N) from being
        // picked as the predecessor of a main-line release (X.Y.Z).
        const stem = prefix + separator;
        const previous_tags = allReleases.filter(r =>
            r.tag_name.startsWith(stem) &&
            !/[-.]/.test(r.tag_name.substring(stem.length))
        );
        if (previous_tags.length > 0) {
            // Use a custom sort function, to ensure 'natural' sort of numeric parts
            const compare = new Intl.Collator(undefined, { numeric: true }).compare;
            return previous_tags.sort(
                (a, b) => compare(a.tag_name, b.tag_name)
            ).reverse()[0].tag_name;
        }

        // No direct sibling: fall back to the "parent" — the prefix itself as
        // an exact release. e.g. previous of X.Y.Z.1 is X.Y.Z (the base), and
        // previous of X.Y.Z-1-rc.1 (when no earlier rc exists) is X.Y.Z-1.
        // Without this, we'd peel further up and pick a same-level sibling of
        // the parent (like X.Y.(Z+1)), which is on a different branch.
        if (allReleases.some(r => r.tag_name === prefix)) {
            return prefix;
        }
    }
}

module.exports = {
    getPreviousTag
};
