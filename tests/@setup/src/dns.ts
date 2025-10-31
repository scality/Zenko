import * as fs from 'fs';
import * as path from 'path';
import { logger } from './utils/logger';
import KubernetesHelper from 'cli-testing/utils/KubernetesHelper';
import { getDeploymentGeneration, initKubernetes, waitForDeploymentRestart } from './utils/k8s';

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
 * @returns Promise that resolves when the CoreDNS deployment is restarted
 */
async function restartCoreDNS(): Promise<void> {
    try {
        logger.debug('Attempting to restart CoreDNS deployment...');

        const baseCoreDNSDeploymentGeneration = await getDeploymentGeneration('kube-system', 'coredns');
        await KubernetesHelper.restartDeployment('coredns', 'kube-system');
        await waitForDeploymentRestart('kube-system', 'coredns', baseCoreDNSDeploymentGeneration, 60000);
        logger.info('CoreDNS deployment is ready.');
    } catch (error: any) {
        const errorBody = error.response ? JSON.stringify(error.response.body) : error.message;
        logger.warn(`Could not restart CoreDNS deployment: ${errorBody}. A manual restart may be needed.`);
    }
}

/**
 * Main function to set up DNS by overwriting the CoreDNS ConfigMap.
 * @param options - DNS options
 * @returns Promise that resolves when the DNS is setup
 */
export async function setupDNS(options: DNSOptions): Promise<void> {
    const configMapName = 'coredns';
    const configMapNamespace = 'kube-system';
    initKubernetes();

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
        if (!KubernetesHelper.clientCore) {
            throw new Error('KubernetesHelper not initialized');
        }
        await KubernetesHelper.clientCore.replaceNamespacedConfigMap({
            name: configMapName,
            namespace: configMapNamespace,
            body: configMapBody,
        });
        logger.info('CoreDNS ConfigMap successfully replaced.');
    } catch (error: any) {
        if (error.code === 404) {
            if (!KubernetesHelper.clientCore) {
                throw new Error('KubernetesHelper not initialized');
            }
            await KubernetesHelper.clientCore.createNamespacedConfigMap({
                namespace: configMapNamespace,
                body: configMapBody,
            });
            logger.info('CoreDNS ConfigMap successfully created.');
        } else {
            logger.error('Failed to apply CoreDNS ConfigMap:', error);
            throw error;
        }
    }

    await restartCoreDNS();
    logger.info('CoreDNS setup completed successfully.');
}
