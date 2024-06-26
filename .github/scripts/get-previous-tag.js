
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
            return previous_tags.sort().reverse()[0].tag_name;
        }
    }
}

module.exports = {
    getPreviousTag
};
