import { KubernetesClient } from './utils/k8s';
import { logger } from './utils/logger';

export interface MocksOptions {
    namespace: string;
    subdomain: string;
    instanceId?: string;
    awsOnly?: boolean;
    azureOnly?: boolean;
    dryRun?: boolean;
}

export async function setupMocks(options: MocksOptions): Promise<void> {
    const k8s = new KubernetesClient();
    await k8s.ensureNamespace(options.namespace);

    if (!options.azureOnly) {
        await setupAwsMocks(k8s, options);
    }

    if (!options.awsOnly) {
        await setupAzureMocks(k8s, options);
    }
}

async function setupAwsMocks(k8s: KubernetesClient, options: MocksOptions): Promise<void> {
    logger.info('Setting up AWS S3 mock (CloudServer)');

    // CloudServer deployment for S3 API mocking
    const cloudServerDeployment = {
        apiVersion: 'apps/v1',
        kind: 'Deployment',
        metadata: {
            name: 'cloudserver-mock',
            namespace: options.namespace,
            labels: {
                app: 'cloudserver-mock',
                component: 'aws-mock'
            }
        },
        spec: {
            replicas: 1,
            selector: {
                matchLabels: {
                    app: 'cloudserver-mock'
                }
            },
            template: {
                metadata: {
                    labels: {
                        app: 'cloudserver-mock'
                    }
                },
                spec: {
                    containers: [{
                        name: 'cloudserver',
                        image: 'ghcr.io/scality/cloudserver:latest',
                        ports: [{ containerPort: 8000 }],
                        env: [
                            { name: 'SCALITY_ACCESS_KEY_ID', value: 'accessKey1' },
                            { name: 'SCALITY_SECRET_ACCESS_KEY', value: 'verySecretKey1' },
                            { name: 'S3BACKEND', value: 'mem' },
                            { name: 'LOG_LEVEL', value: 'info' },
                            { name: 'REMOTE_MANAGEMENT_DISABLE', value: '1' }
                        ],
                        readinessProbe: {
                            httpGet: {
                                path: '/',
                                port: 8000
                            },
                            initialDelaySeconds: 10,
                            periodSeconds: 5
                        }
                    }]
                }
            }
        }
    };

    // CloudServer service
    const cloudServerService = {
        apiVersion: 'v1',
        kind: 'Service',
        metadata: {
            name: 'cloudserver-mock',
            namespace: options.namespace,
            labels: {
                app: 'cloudserver-mock'
            }
        },
        spec: {
            selector: {
                app: 'cloudserver-mock'
            },
            ports: [{
                port: 8000,
                targetPort: 8000,
                name: 's3'
            }]
        }
    };

    // AWS credentials secret for testing
    const awsCredsSecret = {
        apiVersion: 'v1',
        kind: 'Secret',
        metadata: {
            name: 'aws-mock-credentials',
            namespace: options.namespace
        },
        type: 'Opaque',
        stringData: {
            'aws-access-key-id': 'accessKey1',
            'aws-secret-access-key': 'verySecretKey1',
            'aws-region': 'us-east-1',
            'aws-endpoint': `http://cloudserver-mock.${options.namespace}.svc.cluster.local:8000`
        }
    };

    await k8s.applyManifest(cloudServerDeployment, options.namespace);
    await k8s.applyManifest(cloudServerService, options.namespace);
    await k8s.applyManifest(awsCredsSecret, options.namespace);

    // Wait for deployment to be ready
    await k8s.waitForDeployment('cloudserver-mock', options.namespace);

    logger.info('AWS S3 mock setup completed');
}

async function setupAzureMocks(k8s: KubernetesClient, options: MocksOptions): Promise<void> {
    logger.info('Setting up Azure Blob/Queue mock (Azurite)');

    // Azurite deployment for Azure Storage API mocking
    const azuriteDeployment = {
        apiVersion: 'apps/v1',
        kind: 'Deployment',
        metadata: {
            name: 'azurite-mock',
            namespace: options.namespace,
            labels: {
                app: 'azurite-mock',
                component: 'azure-mock'
            }
        },
        spec: {
            replicas: 1,
            selector: {
                matchLabels: {
                    app: 'azurite-mock'
                }
            },
            template: {
                metadata: {
                    labels: {
                        app: 'azurite-mock'
                    }
                },
                spec: {
                    containers: [{
                        name: 'azurite',
                        image: 'mcr.microsoft.com/azure-storage/azurite:latest',
                        ports: [
                            { containerPort: 10000, name: 'blob' },
                            { containerPort: 10001, name: 'queue' },
                            { containerPort: 10002, name: 'table' }
                        ],
                        command: [
                            'azurite',
                            '--blobHost', '0.0.0.0',
                            '--queueHost', '0.0.0.0',
                            '--tableHost', '0.0.0.0',
                            '--location', '/workspace',
                            '--debug', '/workspace/debug.log'
                        ],
                        readinessProbe: {
                            httpGet: {
                                path: '/',
                                port: 10000
                            },
                            initialDelaySeconds: 10,
                            periodSeconds: 5
                        }
                    }]
                }
            }
        }
    };

    // Azurite service
    const azuriteService = {
        apiVersion: 'v1',
        kind: 'Service',
        metadata: {
            name: 'azurite-mock',
            namespace: options.namespace,
            labels: {
                app: 'azurite-mock'
            }
        },
        spec: {
            selector: {
                app: 'azurite-mock'
            },
            ports: [
                { port: 10000, targetPort: 10000, name: 'blob' },
                { port: 10001, targetPort: 10001, name: 'queue' },
                { port: 10002, targetPort: 10002, name: 'table' }
            ]
        }
    };

    // Azure credentials secret for testing
    const azureCredsSecret = {
        apiVersion: 'v1',
        kind: 'Secret',
        metadata: {
            name: 'azure-mock-credentials',
            namespace: options.namespace
        },
        type: 'Opaque',
        stringData: {
            'account-name': 'devstoreaccount1',
            'account-key': 'Eby8vdM02xNOcqFlqUwJPLlmEtlCDXJ1OUzFT50uSRZ6IFsuFq2UVErCz4I6tq/K1SZFPTOtr/KBHBeksoGMGw==',
            'blob-endpoint': `http://azurite-mock.${options.namespace}.svc.cluster.local:10000/devstoreaccount1`,
            'queue-endpoint': `http://azurite-mock.${options.namespace}.svc.cluster.local:10001/devstoreaccount1`
        }
    };

    await k8s.applyManifest(azuriteDeployment, options.namespace);
    await k8s.applyManifest(azuriteService, options.namespace);
    await k8s.applyManifest(azureCredsSecret, options.namespace);

    // Wait for deployment to be ready
    await k8s.waitForDeployment('azurite-mock', options.namespace);

    logger.info('Azure Storage mock setup completed');
}