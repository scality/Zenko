import * as fs from 'fs';
import * as path from 'path';
import { KubernetesClient } from './utils/k8s';
import { logger } from './utils/logger';

export interface DNSOptions {
    namespace: string;
    subdomain?: string;
}

// Define interfaces for our JSON configuration files for type safety
interface Location {
    details: {
        endpoint: string;
        bucketName?: string;
    };
}
interface Endpoint {
    hostname: string;
}

/**
 * Generates rewrite rules from the provided JSON config files.
 * @returns A string containing all the dynamic rewrite rules.
 */
function generateDynamicRules(): string {
    const configDir = path.join(__dirname, '..', 'config');
    const locations: { locations: Location[] } = JSON.parse(fs.readFileSync(path.join(configDir, 'locations.json'), 'utf8'));
    const endpoints: { endpoints: Endpoint[] } = JSON.parse(fs.readFileSync(path.join(configDir, 'endpoints.json'), 'utf8'));

    const rules: string[] = [];
    const destination = 'ingress-nginx-controller.ingress-nginx.svc.cluster.local';

    // This mapping helps create bucket-specific hostnames based on the endpoint.
    const mockServiceMap: { [key: string]: string } = {
        'cloudserver-mock': 'aws-mock.zenko.local',
        'azurite-mock': 'azure-mock.zenko.local',
    };

    // 1. Generate rules from locations.json for bucket-specific hostnames
    for (const loc of locations.locations) {
        if (!loc.details.bucketName) continue;

        for (const serviceKey in mockServiceMap) {
            if (loc.details.endpoint.includes(serviceKey)) {
                const publicDomain = mockServiceMap[serviceKey];
                const source = `${loc.details.bucketName}.${publicDomain}`;
                rules.push(`    rewrite name exact ${source} ${destination}`);
                break; // Move to the next location once a match is found
            }
        }
    }

    // 2. Generate rules from endpoints.json
    for (const ep of endpoints.endpoints) {
        rules.push(`    rewrite name exact ${ep.hostname} ${destination}`);
    }

    if (rules.length > 0) {
        return `# Dynamically generated rules\n` + rules.join('\n');
    }
    return '# No dynamic rules generated';
}

/**
 * Reads the template and injects dynamic rules to create the final Corefile.
 * @param options - Contains the namespace for placeholder replacement.
 * @returns The complete and final Corefile content as a string.
 */
function generateCorefile(options: DNSOptions): string {
    const templatePath = path.join(__dirname, '..', 'config', 'dns.conf');
    const corefileTemplate = fs.readFileSync(templatePath, 'utf8');
    
    const dynamicRules = generateDynamicRules();

    // Replace placeholders in the template
    const finalCorefile = corefileTemplate
        .replace('{{dynamic_rules}}', dynamicRules)
        .replace(/{namespace}/g, options.namespace); // Replace any namespace placeholders if they exist

    return finalCorefile;
}

/**
 * Restarts the CoreDNS deployment to apply configuration changes.
 */
async function restartCoreDNS(k8s: KubernetesClient): Promise<void> {
    try {
        logger.debug('Attempting to restart CoreDNS deployment...');
        const patch = [
            {
                op: 'add',
                path: '/spec/template/metadata/annotations/kubectl.kubernetes.io~1restartedAt',
                value: new Date().toISOString(),
            },
        ];

        await k8s.appsApi.patchNamespacedDeployment({
            name: 'coredns',
            namespace: 'kube-system',
            body: patch,
        });

        logger.info('CoreDNS deployment restart triggered.');
        await k8s.waitForDeployment('coredns', 'kube-system', 60000); 
        logger.info('CoreDNS deployment is ready.');
    } catch (error: any) {
        const errorBody = error.response ? JSON.stringify(error.response.body) : error.message;
        logger.warn(`Could not restart CoreDNS deployment: ${errorBody}. A manual restart may be needed.`);
    }
}

/**
 * Main function to set up DNS by overwriting the CoreDNS ConfigMap.
 */
export async function setupDNS(options: DNSOptions): Promise<void> {
    const k8s = new KubernetesClient();
    const configMapName = 'coredns';
    const configMapNamespace = 'kube-system';

    logger.info('Generating CoreDNS configuration...');
    const newCorefile = generateCorefile(options);

    const configMapBody = {
        apiVersion: 'v1',
        kind: 'ConfigMap',
        metadata: { name: configMapName, namespace: configMapNamespace },
        data: { 'Corefile': newCorefile },
    };

    logger.info(`Applying CoreDNS ConfigMap to ${configMapNamespace}/${configMapName}...`);
    try {
        // This is the "create or replace" logic, equivalent to `kubectl apply`
        await k8s.coreApi.replaceNamespacedConfigMap({
            name: configMapName,
            namespace: configMapNamespace,
            body: configMapBody,
        });
        logger.info('CoreDNS ConfigMap successfully replaced.');
    } catch (error: any) {
        if (error.response?.statusCode === 404) {
            await k8s.coreApi.createNamespacedConfigMap({
                namespace: configMapNamespace,
                body: configMapBody,
            });
            logger.info('CoreDNS ConfigMap successfully created.');
        } else {
            logger.error('Failed to apply CoreDNS ConfigMap:', error);
            throw error;
        }
    }

    await restartCoreDNS(k8s);
    logger.info('CoreDNS setup completed successfully.');
}
