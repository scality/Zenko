import { KubernetesClient } from './utils/k8s';
import { logger } from './utils/logger';
import { execSync } from 'child_process';
import { mkdtempSync, readFileSync, rmSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';

export interface TLSOptions {
    namespace: string;
    domains?: string[];
}

export async function setupTLSWithOpenSSL(options: TLSOptions): Promise<void> {
    const k8s = new KubernetesClient();
    const domains = options.domains || ['zenko.local'];
    const mainDomain = domains[0] || 'zenko.local';
    
    logger.info('Setting up TLS certificates for HTTPS testing');

    // Create temporary directory
    const tempDir = mkdtempSync(join(tmpdir(), 'zenko-tls-'));

    try {
        // Generate self-signed certificate (simple approach like the original)
        // Use wildcard domain if specified, otherwise use main domain
        const certDomain = mainDomain.startsWith('*.') ? mainDomain : `*.${mainDomain.replace('*.', '')}`;
        const opensslCmd = `openssl req -x509 -nodes -days 365 -newkey rsa:2048 ` +
            `-keyout tls.key -out tls.crt -subj "/CN=${certDomain}"`;
        
        logger.info(`Generating self-signed certificate for ${mainDomain}...`);
        execSync(opensslCmd, { cwd: tempDir, stdio: 'pipe' });
        
        // Read generated files
        const tlsKey = readFileSync(join(tempDir, 'tls.key'), 'utf8');
        const tlsCert = readFileSync(join(tempDir, 'tls.crt'), 'utf8');
        
        // Create TLS secret using kubectl equivalent
        await createTLSSecret(k8s, options.namespace, 'zenko-tls', tlsCert, tlsKey);
        
        logger.info(`Successfully created TLS secret 'zenko-tls' for domain: ${mainDomain}`);
        
    } catch (error) {
        logger.error(`Failed to setup TLS certificates: ${error instanceof Error ? error.message : String(error)}`);
        throw error;
    } finally {
        // Clean up temporary directory
        rmSync(tempDir, { recursive: true, force: true });
    }
}

async function createTLSSecret(k8s: KubernetesClient, namespace: string, secretName: string, cert: string, key: string): Promise<void> {
    try {
        // Check if secret already exists
        try {
            await k8s.coreApi.readNamespacedSecret({ name: secretName, namespace });
            logger.info(`TLS secret ${secretName} already exists, replacing...`);
            await k8s.coreApi.deleteNamespacedSecret({ name: secretName, namespace });
        } catch (error) {
            // Secret doesn't exist, which is fine
        }

        // Create new TLS secret
        await k8s.coreApi.createNamespacedSecret({
            namespace,
            body: {
                apiVersion: 'v1',
                kind: 'Secret',
                metadata: {
                    name: secretName,
                    namespace: namespace,
                },
                type: 'kubernetes.io/tls',
                data: {
                    'tls.crt': Buffer.from(cert).toString('base64'),
                    'tls.key': Buffer.from(key).toString('base64'),
                },
            },
        });

        logger.info(`Created TLS secret: ${secretName}`);
    } catch (error) {
        logger.error(`Failed to create TLS secret: ${error instanceof Error ? error.message : String(error)}`);
        throw error;
    }
}