import KubernetesHelper from 'cli-testing/utils/KubernetesHelper';
import { logger } from './utils/logger';
import * as fs from 'fs';
import * as path from 'path';
import { parseAllDocuments } from 'yaml';

export interface MocksOptions {
    namespace: string;
    subdomain: string;
    instanceId?: string;
    awsOnly?: boolean;
    azureOnly?: boolean;
}

/**
 * Setup all mocks by dynamically loading YAML files from mocks directory
 * @param options - Mocks options
 * @returns Promise that resolves when all mocks are setup
 */
export async function setupMocks(options: MocksOptions): Promise<void> {
    await KubernetesHelper.ensureNamespace(options.namespace);

    const mocksDir = path.join(__dirname, '../mocks');
    const yamlFiles = fs.readdirSync(mocksDir)
        .filter(file => file.endsWith('.yaml') || file.endsWith('.yml'))
        .sort();

    logger.info(`Found ${yamlFiles.length} mock manifest(s) to apply`);

    const substitutions = {
        NAMESPACE: options.namespace,
        SUBDOMAIN: options.subdomain,
        INSTANCE_ID: options.instanceId || '',
    };

    // Apply filters based on options
    const filteredFiles = yamlFiles.filter(file => {
        if (options.awsOnly && !file.includes('aws')) {
            return false;
        }
        if (options.azureOnly && !file.includes('azure')) {
            return false;
        }
        return true;
    });

    logger.info(`Applying ${filteredFiles.length} mock manifest(s)`, { files: filteredFiles });

    // Process special setup requirements
    await handlePreSetup(filteredFiles, options);

    // Apply all manifests
    for (const file of filteredFiles) {
        const yamlPath = path.join(mocksDir, file);
        logger.info(`Processing mock: ${file}`);
        await applyYamlManifests(yamlPath, substitutions);
    }

    // Wait for pods to be ready
    await handlePostSetup(filteredFiles, options);

    logger.info('All mocks setup completed successfully');
}

/**
 * Auto-detect and replace template variables in text
 * Supports ${VAR} and $VAR syntax, as well as env vars
 * @param content - Text content with potential template variables
 * @param substitutions - Key-value pairs for template substitution
 * @returns Content with variables replaced
 */
function replaceTemplateVariables(content: string, substitutions: Record<string, string>): string {
    let result = content;

    // Replace ${VAR} syntax
    Object.entries(substitutions).forEach(([key, value]) => {
        result = result.replace(new RegExp(`\\$\\{${key}\\}`, 'g'), value);
    });

    // Also support $VAR syntax (without braces)
    Object.entries(substitutions).forEach(([key, value]) => {
        result = result.replace(new RegExp(`\\$${key}\\b`, 'g'), value);
    });

    return result;
}

/**
 * Load and apply a multi-document YAML manifest with template substitution
 * @param yamlPath - Path to the YAML file (can contain multiple documents separated by ---)
 * @param substitutions - Key-value pairs for template substitution
 * @returns Promise that resolves when all manifests are applied
 */
async function applyYamlManifests(yamlPath: string, substitutions: Record<string, string>): Promise<void> {
    const yamlContent = fs.readFileSync(yamlPath, 'utf8');

    // Replace template variables
    const processedContent = replaceTemplateVariables(yamlContent, substitutions);

    // Parse all documents (supports multi-document YAML)
    const documents = parseAllDocuments(processedContent);

    logger.debug(`Loading ${documents.length} manifests from ${path.basename(yamlPath)}`);

    for (const doc of documents) {
        const manifest = doc.toJSON() as any;

        if (!manifest || !manifest.kind) {
            logger.warn('Skipping empty or invalid document');
            continue;
        }

        const kind = manifest.kind;
        const namespace = manifest.metadata?.namespace;
        const name = manifest.metadata?.name;

        logger.debug(`Applying ${kind}/${name}`, { namespace });

        switch (kind) {
            case 'Service':
                await KubernetesHelper.applyService(manifest, namespace);
                break;
            case 'Pod':
                await KubernetesHelper.applyPod(manifest, namespace);
                break;
            case 'Ingress':
                await KubernetesHelper.applyIngress(manifest, namespace);
                break;
            case 'ConfigMap':
                await KubernetesHelper.applyConfigMap(manifest, namespace);
                break;
            default:
                throw new Error(`Unsupported manifest kind: ${kind}`);
        }
    }
}

/**
 * Handle pre-setup requirements for specific mocks
 * @param files - List of YAML files being applied
 * @param options - Mocks options
 */
async function handlePreSetup(files: string[], options: MocksOptions): Promise<void> {
    // AWS mock requires a ConfigMap with metadata
    if (files.some(f => f.includes('aws'))) {
        logger.debug('AWS mock detected, creating ConfigMap');
        await createAwsMockConfigMap(options);
    }

    // Add other pre-setup requirements here as needed
}

/**
 * Create AWS mock configmap
 * @param options - Mocks options
 * @returns Promise that resolves when the AWS mock configmap is created
 */
async function createAwsMockConfigMap(options: MocksOptions): Promise<void> {
    try {
        const tarPath = '/setup/mock-metadata.tar.gz';

        if (!fs.existsSync(tarPath)) {
            throw new Error(`AWS mock metadata file not found. Searched paths: ${tarPath}`);
        }

        const tarGzContent = fs.readFileSync(tarPath);
        const configMapData = {
            'mock-metadata.tar.gz': tarGzContent.toString('base64'),
        };
        logger.info('Using mock-metadata.tar.gz file', { tarPath });

        const awsMockConfigMap = {
            apiVersion: 'v1',
            kind: 'ConfigMap',
            metadata: {
                name: 'aws-mock',
                namespace: options.namespace,
            },
            binaryData: configMapData,
        };

        await KubernetesHelper.applyConfigMap(awsMockConfigMap, options.namespace);
        logger.info('AWS mock configmap created successfully');
    } catch (error: any) {
        if (error?.code === 409) {
            logger.info('AWS mock configmap already exists');
        } else {
            logger.error('Failed to create AWS mock configmap', { error });
            throw error;
        }
    }
}

/**
 * Wait for service endpoints to have at least one address
 */
async function waitForServiceEndpoints(
    serviceName: string,
    namespace: string,
    timeoutMs: number = 60000
): Promise<void> {
    const core = KubernetesHelper.getClientCore();
    if (!core) {
        throw new Error('KubernetesHelper not initialized');
    }

    const startTime = Date.now();
    const pollInterval = 2000;

    logger.info(`Waiting for service ${serviceName} endpoints to be ready...`);

    while (Date.now() - startTime < timeoutMs) {
        try {
            const endpoints = await core.readNamespacedEndpoints({ name: serviceName, namespace });
            const addresses = endpoints.subsets?.flatMap(s => s.addresses || []) || [];
            
            if (addresses.length > 0) {
                logger.info(`Service ${serviceName} endpoints ready`, { addresses: addresses.length });
                return;
            }
        } catch (error: any) {
            logger.debug(`Service ${serviceName} endpoints not found yet`);
        }

        await new Promise(resolve => setTimeout(resolve, pollInterval));
    }

    throw new Error(`Timeout waiting for service ${serviceName} endpoints in namespace ${namespace}`);
}

/**
 * Handle post-setup tasks like waiting for pods and services to be ready
 * Dynamically discovers resources from the YAML files
 * @param files - List of YAML files that were applied
 * @param options - Mocks options
 */
async function handlePostSetup(files: string[], options: MocksOptions): Promise<void> {
    const podNames = new Set<string>();
    const serviceNames = new Set<string>();
    const mocksDir = path.join(__dirname, '../mocks');
    
    // Scan YAML files to find Pod and Service resources
    for (const file of files) {
        const yamlPath = path.join(mocksDir, file);
        const yamlContent = fs.readFileSync(yamlPath, 'utf8');
        const documents = parseAllDocuments(yamlContent);
        
        for (const doc of documents) {
            const manifest = doc.toJSON() as any;
            if (manifest?.kind === 'Pod' && manifest?.metadata?.name) {
                podNames.add(manifest.metadata.name);
            }
            if (manifest?.kind === 'Service' && manifest?.metadata?.name) {
                serviceNames.add(manifest.metadata.name);
            }
        }
    }
    
    // Wait for all pods to be ready
    if (podNames.size > 0) {
        const podList = Array.from(podNames);
        logger.info(`Waiting for ${podList.length} pod(s) to be ready`, { pods: podList });
        await Promise.all(
            podList.map(podName => 
                KubernetesHelper.waitForPod(podName, options.namespace)
            )
        );
    }

    // Wait for all service endpoints to be ready
    if (serviceNames.size > 0) {
        const serviceList = Array.from(serviceNames);
        logger.info(`Waiting for ${serviceList.length} service(s) endpoints to be ready`, { services: serviceList });
        await Promise.all(
            serviceList.map(serviceName => 
                waitForServiceEndpoints(serviceName, options.namespace)
            )
        );
    }
}
