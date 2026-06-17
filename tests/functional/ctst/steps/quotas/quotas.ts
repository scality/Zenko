import { Given, When, ITestCaseHookParameter } from '@cucumber/cucumber';
import { SignatureV4 } from '@smithy/signature-v4';
import { Sha256 } from '@aws-crypto/sha256-js';
import axios from 'axios';
import Zenko, { EntityType } from '../../world/Zenko';
import { Utils } from 'cli-testing';
import { prepareMetricsScenarios } from '../../common/utils';
import assert from 'assert';

async function scalitySignedRequest(
    world: Zenko,
    service: 's3' | 'iam',
    method: 'GET' | 'PUT' | 'DELETE' | 'POST',
    path: string,
    query?: Record<string, string>,
    body?: Record<string, unknown>,
): Promise<unknown> {
    const creds = world.awsClients.getCredentials();
    const protocol = world.parameters.ssl === false ? 'http' : 'https';
    const subdomain = world.parameters.subdomain || 'zenko.local';
    const port = String(world.parameters.port || '80');
    const hostPart = service === 's3' ? `s3.${subdomain}` : `iam.${subdomain}`;
    const fullHost = `${hostPart}:${port}`;

    const signer = new SignatureV4({
        region: 'us-east-1',
        service,
        sha256: Sha256,
        credentials: {
            accessKeyId: creds.accessKeyId,
            secretAccessKey: creds.secretAccessKey,
            ...(creds.sessionToken ? { sessionToken: creds.sessionToken } : {}),
        },
    });

    const headers: Record<string, string> = {
        'x-amz-date': new Date().toISOString().replace(/[:-]|\.\d{3}/g, ''),
        Host: fullHost,
    };

    const signed = await signer.sign({
        protocol: `${protocol}:`,
        method,
        path,
        query: query ?? {},
        hostname: hostPart,
        headers,
    });
    Object.assign(headers, signed.headers);

    let url = `${protocol}://${fullHost}${path}`;
    if (query && Object.keys(query).length > 0) {
        url += '?' + Object.entries(query).map(([k, v]) => `${k}=${v}`).join('&');
    }

    const result = await axios({ method, url, headers, data: body });
    return result.data;
}

export async function prepareQuotaScenarios(world: Zenko, scenarioConfiguration: ITestCaseHookParameter) {
    /**
     * The objective of this hook is to prepare all the buckets and accounts
     * we use during quota checks, so that we avoid running the job multiple
     * times, which affects the performance of the tests.
     * The steps are: create an account, then create a simple bucket.
     *
     * The hook is called in the hooks.ts file.
     */
    const isBucketNonVersioned = scenarioConfiguration.gherkinDocument.feature?.tags?.find(
        tag => tag.name === 'NonVersioned') === undefined;

    const versioning = isBucketNonVersioned ? '' : 'with';

    await prepareMetricsScenarios(world, scenarioConfiguration, {
        versioning,
        jobNamespace: 'quotas-setup',
    });
}

export async function teardownQuotaScenarios(world: Zenko) {
    // Remove any quota at the end of the scenario, in case
    // the account gets reused, placed after the global After
    // hook to make sure it is executed first.
    await world.setupEntity(EntityType.STORAGE_MANAGER);
    const bucketName = world.getSaved<string>('bucketName');

    try {
        await scalitySignedRequest(world, 's3', 'DELETE', `/${bucketName}/`, { quota: 'true' });
    } catch { /* quota may already be absent */ }

    try {
        await scalitySignedRequest(world, 'iam', 'POST', '/', undefined, { Action: 'DeleteAccountQuota' });
    } catch { /* quota may already be absent */ }
}

Given('a bucket quota set to {int} B', async function (this: Zenko, quota: number) {
    if (quota === 0) {
        return;
    }
    this.useSavedIdentity();
    const bucketName = this.getSaved<string>('bucketName');

    try {
        await scalitySignedRequest(this, 's3', 'PUT', `/${bucketName}/`,
            { quota: 'true' }, { quota: String(quota) });
    } catch (err) {
        throw new Error(`Failed to set bucket quota: ${(err as Error).message}`);
    }

    const resultGet = await scalitySignedRequest(this, 's3', 'GET', `/${bucketName}/`,
        { quota: 'true' }) as { quota: string };
    assert(
        JSON.stringify(resultGet).includes(String(quota)),
        `Bucket quota not applied. Expected ${quota}, got: ${JSON.stringify(resultGet)}`,
    );
});

Given('an account quota set to {int} B', async function (this: Zenko, quota: number) {
    if (quota === 0) {
        return;
    }
    this.useSavedIdentity();

    const result = await scalitySignedRequest(this, 'iam', 'POST', '/', undefined,
        { Action: 'UpdateAccountQuota', quotaMax: String(quota) }) as { quota: string };
    assert(
        JSON.stringify(result).includes(String(quota)),
        `Account quota not applied. Expected ${quota}, got: ${JSON.stringify(result)}`,
    );
});

When('I wait {int} seconds', async (seconds: number) => {
    await Utils.sleep(seconds * 1000);
});
