import { PensieveClient } from './clients/pensieveClient';
import { EndpointConfig, Env } from '../config';

export async function createEndpoints(
    pensieveClient: PensieveClient,
    env: Env,
    endpoints: EndpointConfig[],
): Promise<void> {
    for (const endpoint of endpoints) {
        await pensieveClient.createEndpoint(env.UUID, endpoint.hostname, endpoint.locationName);
        console.log(`Created endpoint: ${endpoint.hostname} -> ${endpoint.locationName}`);
    }
}
