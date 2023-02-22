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

export const s3FunctionExtraParams : { [key: string]: Object } = {
    'RestoreObject': { restoreRequest: 'Days=1' },
    'PutObjectAcl':  { acl: 'public-read-write' },
    'PutBucketTagging': { tagging: 'TagSet=[{Key=tag1,Value=value1},{Key=tag2,Value=value2}]' },
    'PutObjectTagging': { tagging: 'TagSet=[{Key=string,Value=string}]' },
    'PutObjectLockConfiguration': {
        objectLockConfiguration: 'ObjectLockEnabled=Enabled,Rule=[{DefaultRetention={Mode=GOVERNANCE,Days=1}}]'
    },
    'DeleteObjects': {
        delete: `Objects=[{Key=${'x'.repeat(10)}]`
    },
    'PutLifecycleConfiguration': {
        lifecycleConfiguration: JSON.stringify(
            {
                Rules: [
                    {
                        Filter: {
                            Prefix: "documents/"
                        },
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
    'PutBucketReplication': {
        replicationConfiguration: JSON.stringify(
                {
                    "Role": "arn:aws:iam::123456789012:role/s3-replication-role",
                    "Rules": [
                        {
                            "Status": "Enabled",
                            "Prefix": "",
                            "Destination": {
                                "Bucket": "arn:aws:s3:::exampleBucket",
                            }
                        }
                    ]
                })
    }
}