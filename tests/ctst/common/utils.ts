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
                    res = res[propertyChain.shift()];
                }
            }
            return res;
        }
        return null;
    } catch (err) {
        return null;
    }
}

export const s3FunctionExtraParams : { [key: string]: Object } = {
    'restoreObject': { restoreRequest: 'Days=1' },
    'putObjectAcl':  { acl: 'public-read-write' },
    'putBucketTagging': { tagging: 'TagSet=[{Key=tag1,Value=value1},{Key=tag2,Value=value2}]' },
    'putObjectTagging': { tagging: 'TagSet=[{Key=string,Value=string}]' },
    'putBucketVersioning': { versioningConfiguration: 'Status=Enabled' },
    'putObjectLockConfiguration': {
        objectLockConfiguration: 'ObjectLockEnabled=Enabled,Rule=[{DefaultRetention={Mode=GOVERNANCE,Days=1}}]'
    },
    'deleteObjects': {
        delete: `Objects=[{Key=${'x'.repeat(10)}]`
    },
    'putLifecycleConfiguration': {
        lifecycleConfiguration: JSON.stringify(
            {
                Rules: [
                    {
                        Prefix: "",
                        Status: "Enabled",
                        Transitions: [
                            {
                                Days: 365,
                                StorageClass: "e2e-cold"
                            }
                        ],
                        Expiration: {
                            Days: 3650
                        },
                        ID: "ExampleRule"
                    }
                ]
            })
    },
    'putBucketReplication': {
        replicationConfiguration: JSON.stringify(
                {
                    "Role": "arn:aws:iam::123456789012:role/s3-replication-role",
                    "Rules": [
                        {
                            "Status": "Enabled",
                            "Prefix": "",
                            "Destination": {
                                "Bucket": "arn:aws:s3:::examplebucket",
                            }
                        }
                    ]
                })
    }
}