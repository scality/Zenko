import {
    Utils,
} from 'cli-testing';

/**
 * This helper will dynamically extract a property from a CLI result
 * @param {object} results - results from the command line
 * @param {string[]} propertyChain - the property chain to extract, like Policy, Arn
 * @return {string} - the expected property, or null if an error occurred when parsing results.
 */
export function extractPropertyFromResults<T>(results: Utils.Command, ...propertyChain: string[]) : T | null {
    try {
        if (results.stdout) {
            const jsonResults = JSON.parse(results.stdout) as Record<string, unknown>;
            let res : unknown = jsonResults;
            if (jsonResults) {
                while (propertyChain.length > 0) {
                    res = (res as Record<string, unknown>)[propertyChain.shift()!];
                }
            }
            return res as T;
        }
        return null;
    } catch (err) {
        return null;
    }
}

export const s3FunctionExtraParams : { [key: string]: Record<string, unknown> } = {
    restoreObject: { restoreRequest: 'Days=1' },
    putObjectAcl:  { acl: 'public-read-write' },
    putBucketTagging: { tagging: 'TagSet=[{Key=tag1,Value=value1},{Key=tag2,Value=value2}]' },
    putObjectTagging: { tagging: 'TagSet=[{Key=string,Value=string}]' },
    putBucketVersioning: { versioningConfiguration: 'Status=Enabled' },
    putObjectLockConfiguration: {
        objectLockConfiguration: '{ "ObjectLockEnabled": "Enabled", "Rule": ' +
        '{ "DefaultRetention": ' + 
        '{ "Mode": "COMPLIANCE", "Days": 50 }}}',
    },
    deleteObjects: {
        delete: `Objects=[{Key=${'x'.repeat(10)}}]`,
    },
    putBucketLifecycleConfiguration: {
        lifecycleConfiguration: JSON.stringify(
            {
                Rules: [
                    {
                        Prefix: '',
                        Status: 'Enabled',
                        Transitions: [
                            {
                                Days: 365,
                                StorageClass: 'e2e-cold',
                            },
                        ],
                        Expiration: {
                            Days: 3650,
                        },
                        ID: 'ExampleRule',
                    },
                ],
            }),
    },
    putBucketReplication: {
        replicationConfiguration: JSON.stringify(
            {
                Role: 'arn:aws:iam::123456789012:role/s3-replication-role',
                Rules: [
                    {
                        Status: 'Enabled',
                        Prefix: '',
                        Destination: {
                            Bucket: 'arn:aws:s3:::examplebucket',
                        },
                    },
                ],
            }),
    },
};

export function safeJsonParse(jsonString: string): { ok: boolean, result: object } {
    let result = {};
    try {
        result = JSON.parse(jsonString) as object;
    } catch (err) {
        return { ok: false, result };
    }
    return { ok: true, result };
}
