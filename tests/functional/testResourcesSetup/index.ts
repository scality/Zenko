import { STSClient } from '@aws-sdk/client-sts';
import { CoreV1Api } from '@kubernetes/client-node';
import { loadConfig, loadEnv, Env } from './config';
import { PensieveClient } from './setup/clients/pensieveClient';
import { createK8sClient } from './setup/clients/k8s';
import { createAccounts } from './setup/accounts';
import { createEndpoints } from './setup/endpoints';
import { createLocations } from './setup/locations';
import { createAwsBuckets } from './setup/buckets/aws';
import { createRingBuckets } from './setup/buckets/ring';
import { createAzureContainers, createAzureQueues } from './setup/buckets/azure';

async function createClients(
    env: Env,
): Promise<{ pensieveClient: PensieveClient; stsClient: STSClient; k8sClient: CoreV1Api }> {
    const pensieveClient = new PensieveClient(env.MANAGEMENT_ENDPOINT, env.TOKEN);
    await pensieveClient.init();

    // AssumeRoleWithWebIdentity authenticates via the web identity token, not AWS credentials
    const stsClient = new STSClient({
        endpoint: env.STS_ENDPOINT,
        region: 'us-east-1',
        credentials: { accessKeyId: 'placeholder', secretAccessKey: 'placeholder' },
    });

    const k8sClient = createK8sClient(env.KUBECONFIG);

    return { pensieveClient, stsClient, k8sClient };
}

async function main(): Promise<void> {
    const env = loadEnv();
    const config = loadConfig(env.CONFIG_FILE);

    if (!env.VERIFY_CERTIFICATES) {
        process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
    }

    console.log('[setup] Starting functional test resource initialization');
    console.log('[setup] Config file:', env.CONFIG_FILE);
    console.log('[setup] Management endpoint:', env.MANAGEMENT_ENDPOINT);
    console.log('[setup] Namespace:', env.NAMESPACE);
    console.log('[setup] UUID:', env.UUID);
    console.log('[setup] Enable Ring tests:', env.ENABLE_RING_TESTS);
    console.log('[setup] Deploy CRR locations:', env.DEPLOY_CRR_LOCATIONS);

    const { pensieveClient, stsClient, k8sClient } = await createClients(env);

    await createAwsBuckets(env);
    await createRingBuckets(env);
    await createAzureContainers(env);
    await createAzureQueues(env);

    const accountsCreds = await createAccounts(pensieveClient, stsClient, k8sClient, env, config.accounts);
    await createEndpoints(pensieveClient, env, config.endpoints);
    await createLocations(pensieveClient, env, config.locations, accountsCreds);

    console.log('\n[setup] Functional test resources initialized successfully');
}

main().catch(err => {
    console.error('\n[setup] error:', err);
    process.exit(1);
});
