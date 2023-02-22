/**
 * This helper will dynamically extract a property from a CLI result
 * @param {object} results - results from the command line
 * @param {string[]} propertyChain - the property chain to extract, like Policy, Arn
 * @return {string} - the expected property, or null if an error occurred when parsing results.
 */
export function extractPropertyFromResults(results: { err: null; stdout: string } | any, ...propertyChain: string[]) : any | null {
    try {
        if (results.stdout) {
            const jsonResults = JSON.parse(results.stdout);
            let res = jsonResults;
            if (jsonResults) {
                while (propertyChain.length > 0) {
                    // @ts-ignore
                    res = jsonResults[propertyChain.shift()];
                }
            }
            return res;
        }
        return null;
    } catch (err) {
        return null;
    }
}