import * as fs from 'fs';
import * as path from 'path';
import { KubernetesClient } from './utils/k8s';
import { logger } from './utils/logger';

export interface DNSOptions {
    namespace: string;
    subdomain?: string;
}

/**
 * Reads the template and replaces placeholders to create the final Corefile.
 * @param options - Contains the namespace and subdomain for placeholder replacement.
 * @returns The complete and final Corefile content as a string.
 */
function generateCorefile(options: DNSOptions): string {
    const templatePath = path.join(__dirname, '..', 'configs', 'dns.conf');
    const corefileTemplate = fs.readFileSync(templatePath, 'utf8');
    
    const subdomain = options.subdomain || 'zenko.local';
    const finalCorefile = corefileTemplate
        .replace(/{{subdomain}}/g, subdomain);

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

    logger.info('Generating CoreDNS configuration from template...');
    const newCorefile = generateCorefile(options);

    const configMapBody = {
        apiVersion: 'v1',
        kind: 'ConfigMap',
        metadata: { name: configMapName, namespace: configMapNamespace },
        data: { 'Corefile': newCorefile },
    };

    logger.info(`Applying CoreDNS ConfigMap to ${configMapNamespace}/${configMapName}...`);
    try {
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
