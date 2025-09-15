import { KubernetesClient } from './utils/k8s';
import { logger } from './utils/logger';

export interface DNSOptions {
    namespace: string;
    subdomain: string;
    dryRun?: boolean;
}

export async function setupDNS(options: DNSOptions): Promise<void> {
    const k8s = new KubernetesClient();

    logger.info('Setting up CoreDNS configuration for test domains');

    // Get the current CoreDNS ConfigMap
    let coreDnsConfigMap;
    try {
        coreDnsConfigMap = await k8s.coreApi.readNamespacedConfigMap({
            name: 'coredns',
            namespace: 'kube-system',
        });
    } catch (error: any) {
        if (error.response?.statusCode === 404) {
            logger.warn('CoreDNS ConfigMap not found, attempting to find alternative');
            // Try different possible names/namespaces
            const alternatives = [
                { name: 'coredns-custom', namespace: 'kube-system' },
                { name: 'coredns', namespace: 'kube-dns' }
            ];

            for (const alt of alternatives) {
                try {
                    coreDnsConfigMap = await k8s.coreApi.readNamespacedConfigMap({
                        name: alt.name,
                        namespace: alt.namespace,
                    });
                    break;
                } catch (e) {
                    continue;
                }
            }

            if (!coreDnsConfigMap) {
                logger.warn('Could not find CoreDNS ConfigMap, creating custom DNS setup');
                await createCustomDNSSetup(k8s, options);
                return;
            }
        } else {
            throw error;
        }
    }

    // Parse current Corefile
    const currentCorefile = coreDnsConfigMap.data?.['Corefile'] || '';

    // Generate rewrite rules for test domains
    const rewriteRules = generateRewriteRules(options.subdomain, options.namespace);

    // Check if our rules already exist
    if (currentCorefile.includes(`# Zenko test rewrite rules for ${options.subdomain}`)) {
        logger.debug('DNS rewrite rules already configured');
        return;
    }

    // Add our rewrite rules to the Corefile
    const newCorefile = addRewriteRules(currentCorefile, rewriteRules, options.subdomain);

    // Update the ConfigMap
    const updatedConfigMap = {
        ...coreDnsConfigMap,
        data: {
            ...coreDnsConfigMap.data,
            'Corefile': newCorefile
        }
    };

    await k8s.coreApi.replaceNamespacedConfigMap({
        name: 'coredns',
        namespace: 'kube-system',
        body: updatedConfigMap,
    });

    // Restart CoreDNS deployment to pick up changes
    await restartCoreDNS(k8s);

    logger.info('CoreDNS configuration updated successfully');
}

async function createCustomDNSSetup(k8s: KubernetesClient, options: DNSOptions): Promise<void> {
    logger.info('Creating custom DNS setup for test environment');

    // Create a custom CoreDNS deployment for test domains
    const customCorefile = `
# Zenko test DNS configuration
${options.subdomain}:53 {
    rewrite name regex (.+\\.)?aws-mock\\.${options.subdomain} cloudserver-mock.${options.namespace}.svc.cluster.local
    rewrite name regex (.+\\.)?azure-mock\\.${options.subdomain} azurite-mock.${options.namespace}.svc.cluster.local
    rewrite name regex iam\\.${options.subdomain} zenko-iam.${options.namespace}.svc.cluster.local
    rewrite name regex ui\\.${options.subdomain} zenko-ui.${options.namespace}.svc.cluster.local
    rewrite name regex s3\\.${options.subdomain} zenko-s3.${options.namespace}.svc.cluster.local
    forward . /etc/resolv.conf
    cache 30
    errors
    log
}

.:53 {
    forward . /etc/resolv.conf
    cache 30
    errors
    log
}
`;

    const customDNSConfigMap = {
        apiVersion: 'v1',
        kind: 'ConfigMap',
        metadata: {
            name: 'zenko-test-coredns',
            namespace: options.namespace
        },
        data: {
            'Corefile': customCorefile.trim()
        }
    };

    await k8s.applyManifest(customDNSConfigMap, options.namespace);
    logger.info('Custom DNS ConfigMap created');
}

function generateRewriteRules(subdomain: string, namespace: string): string {
    return `
# Zenko test rewrite rules for ${subdomain}
rewrite name regex (.+\\.)?aws-mock\\.${subdomain} cloudserver-mock.${namespace}.svc.cluster.local
rewrite name regex (.+\\.)?azure-mock\\.${subdomain} azurite-mock.${namespace}.svc.cluster.local
rewrite name regex iam\\.${subdomain} zenko-iam.${namespace}.svc.cluster.local
rewrite name regex ui\\.${subdomain} zenko-ui.${namespace}.svc.cluster.local
rewrite name regex s3\\.${subdomain} zenko-s3.${namespace}.svc.cluster.local
rewrite name regex management\\.${subdomain} zenko-management.${namespace}.svc.cluster.local`;
}

function addRewriteRules(currentCorefile: string, rewriteRules: string, subdomain: string): string {
    // Find the main server block (.:53 or similar)
    const lines = currentCorefile.split('\\n');
    const newLines = [];
    let insideMainBlock = false;
    let foundMainBlock = false;

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];

        // Detect main server block
        if (line.trim().match(/^\\.:53\\s*{/) || line.trim().match(/^\\. {/)) {
            insideMainBlock = true;
            foundMainBlock = true;
            newLines.push(line);
            // Add our rewrite rules right after the opening brace
            newLines.push(rewriteRules);
            continue;
        }

        // Detect end of server block
        if (insideMainBlock && line.trim() === '}') {
            insideMainBlock = false;
        }

        newLines.push(line);
    }

    // If no main block found, add our own
    if (!foundMainBlock) {
        newLines.push('');
        newLines.push(`# Zenko test server block`);
        newLines.push(`.:53 {`);
        newLines.push(rewriteRules);
        newLines.push('    forward . /etc/resolv.conf');
        newLines.push('    cache 30');
        newLines.push('    errors');
        newLines.push('    log');
        newLines.push('}');
    }

    return newLines.join('\\n');
}

async function restartCoreDNS(k8s: KubernetesClient): Promise<void> {
    try {
        // Get CoreDNS deployment
        const deployment = await k8s.appsApi.readNamespacedDeployment({
            name: 'coredns',
            namespace: 'kube-system',
        });

        // Add/update restart annotation to trigger rolling restart
        const annotations = deployment.spec?.template.metadata?.annotations || {};
        annotations['kubectl.kubernetes.io/restartedAt'] = new Date().toISOString();

        deployment.spec!.template.metadata!.annotations = annotations;

        await k8s.appsApi.replaceNamespacedDeployment({
            name: 'coredns',
            namespace: 'kube-system',
            body: deployment,
        });

        logger.debug('CoreDNS deployment restart triggered');

        // Wait a bit for the restart to take effect
        await new Promise(resolve => setTimeout(resolve, 10000));

    } catch (error: any) {
        logger.warn(`Could not restart CoreDNS deployment: ${error.message}`);
        logger.info('DNS changes will take effect when CoreDNS pods are restarted');
    }
}