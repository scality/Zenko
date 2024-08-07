
function getPreviousTag(version, allReleases) {
    while (version) {
        // Strip trailing number from release to build the "prefix" for the previous version
        prefix = version.replace(/\.\d+(-\w+)?$/, "");
        if (prefix === version) {
            return undefined;
        }

        version = prefix;

        // Find the latest release with the same prefix
        previous_tags = allReleases.filter(r => r.tag_name.startsWith(version));
        if (previous_tags.length > 0) {
            // Use a custom sort function, to ensure 'natural' sort of numeric parts
            const compare = new Intl.Collator(undefined, { numeric: true }).compare;
            return previous_tags.sort(
                (a, b) => compare(a.tag_name, b.tag_name)
            ).reverse()[0].tag_name;
        }
    }
}

module.exports = {
    getPreviousTag
};
