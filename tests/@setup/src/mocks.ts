import { V1Ingress, V1Pod, V1Service } from '@kubernetes/client-node';
import { KubernetesClient } from './utils/k8s';
import { logger } from './utils/logger';
import * as fs from 'fs';
import * as path from 'path';

export interface MocksOptions {
    namespace: string;
    subdomain: string;
    instanceId?: string;
    awsOnly?: boolean;
    azureOnly?: boolean;
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
    logger.info('Setting up AWS S3 mock');

    await createAwsMockConfigMap(k8s, options);

    const awsMockService: V1Service = {
        apiVersion: 'v1',
        kind: 'Service',
        metadata: {
            name: 'aws-mock',
            namespace: options.namespace
        },
        spec: {
            selector: {
                name: 'aws-mock'
            },
            type: 'ClusterIP',
            ports: [{
                name: 'http',
                port: 80,
                targetPort: 'http'
            }]
        }
    };

    // AWS mock pod
    const awsMockPod = {
        apiVersion: 'v1',
        kind: 'Pod',
        metadata: {
            name: 'aws-mock-pod',
            namespace: options.namespace,
            labels: {
                name: 'aws-mock',
                component: 'mock'
            }
        },
        spec: {
            initContainers: [{
                name: 'setup',
                image: 'zenko/cloudserver:latest',
                imagePullPolicy: 'Always',
                command: ['tar', '-xvf', '/static-config/mock-metadata.tar.gz', '-C', '/usr/src/app'],
                volumeMounts: [
                    {
                        name: 'configmap',
                        mountPath: '/static-config'
                    },
                    {
                        name: 'metadata',
                        mountPath: '/usr/src/app/localMetadata'
                    }
                ]
            }],
            containers: [{
                name: 'aws-mock',
                image: 'zenko/cloudserver:latest',
                env: [
                    { name: 'LOG_LEVEL', value: 'trace' },
                    { name: 'REMOTE_MANAGEMENT_DISABLE', value: '1' },
                    { name: 'ENDPOINT', value: 'aws-mock.zenko.local' },
                    { name: 'S3BACKEND', value: 'file' }
                ],
                ports: [{
                    name: 'http',
                    containerPort: 8000
                }],
                volumeMounts: [{
                    name: 'metadata',
                    mountPath: '/usr/src/app/localMetadata'
                }],
                resources: {
                    limits: {
                        cpu: '1',
                        memory: '2Gi'
                    },
                    requests: {
                        cpu: '1',
                        memory: '2Gi'
                    }
                }
            }],
            volumes: [
                {
                    name: 'metadata',
                    emptyDir: {}
                },
                {
                    name: 'configmap',
                    configMap: {
                        name: 'aws-mock'
                    }
                }
            ]
        }
    };

    // AWS mock ingress
    const awsMockIngress: V1Ingress = {
        apiVersion: 'networking.k8s.io/v1',
        kind: 'Ingress',
        metadata: {
            name: 'aws-mock',
            namespace: options.namespace,
            annotations: {
                'nginx.ingress.kubernetes.io/proxy-body-size': '0m',
                'nginx.ingress.kubernetes.io/proxy-buffering': 'off',
                'nginx.ingress.kubernetes.io/proxy-request-buffering': 'off',
                'cert-manager.io/cluster-issuer': 'artesca-root-ca-issuer'
            }
        },
        spec: {
            tls: [{
                secretName: 'aws-mock-tls',
                hosts: [
                    'aws-mock.zenko.local',
                    '*.aws-mock.zenko.local'
                ]
            }],
            rules: [
                {
                    host: 'aws-mock.zenko.local',
                    http: {
                        paths: [{
                            backend: {
                                service: {
                                    name: 'aws-mock',
                                    port: {
                                        name: 'http'
                                    }
                                }
                            },
                            path: '/',
                            pathType: 'Prefix'
                        }]
                    }
                },
                {
                    host: '*.aws-mock.zenko.local',
                    http: {
                        paths: [{
                            backend: {
                                service: {
                                    name: 'aws-mock',
                                    port: {
                                        name: 'http'
                                    }
                                }
                            },
                            path: '/',
                            pathType: 'Prefix'
                        }]
                    }
                }
            ]
        }
    };

    await k8s.applyManifest(awsMockService, options.namespace);
    await k8s.applyManifest(awsMockPod, options.namespace);
    await k8s.applyManifest(awsMockIngress, options.namespace);

    logger.info('AWS S3 mock setup completed');

    // wait for the pod to be ready
    await k8s.waitForPod('aws-mock-pod', options.namespace);
}

async function createAwsMockConfigMap(k8s: KubernetesClient, options: MocksOptions): Promise<void> {
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

        await k8s.applyManifest(awsMockConfigMap, options.namespace);
        logger.info('AWS mock configmap created successfully');
    } catch (error: any) {
        if (error?.statusCode === 409) {
            logger.info('AWS mock configmap already exists');
        } else {
            logger.error('Failed to create AWS mock configmap', { error });
            throw error;
        }
    }
}

async function setupAzureMocks(k8s: KubernetesClient, options: MocksOptions): Promise<void> {
    logger.info('Setting up Azure Blob/Queue mock (Azurite)');

    const azureMockService: V1Service = {
        apiVersion: 'v1',
        kind: 'Service',
        metadata: {
            name: 'azure-mock',
            namespace: options.namespace
        },
        spec: {
            selector: {
                name: 'azure-mock'
            },
            type: 'ClusterIP',
            ports: [
                {
                    name: 'blob',
                    port: 80,
                    targetPort: 'blob'
                },
                {
                    name: 'queue',
                    port: 81,
                    targetPort: 'queue'
                }
            ]
        }
    };

    const azureMockPod: V1Pod = {
        apiVersion: 'v1',
        kind: 'Pod',
        metadata: {
            name: 'azure-mock-pod',
            namespace: options.namespace,
            labels: {
                name: 'azure-mock',
                component: 'mock'
            }
        },
        spec: {
            hostname: 'devstoreaccount1',
            subdomain: 'azure-mock',
            containers: [{
                name: 'azurite',
                image: 'mcr.microsoft.com/azure-storage/azurite:3.35.0',
                command: [
                    'azurite',
                    '-l', '/data',
                    '--blobHost', '0.0.0.0',
                    '--blobPort', '80',
                    '--queueHost', '0.0.0.0',
                    '--queuePort', '81'
                ],
                ports: [
                    {
                        name: 'blob',
                        containerPort: 80
                    },
                    {
                        name: 'queue',
                        containerPort: 81
                    }
                ],
                imagePullPolicy: 'Always',
                resources: {
                    limits: {
                        cpu: '1',
                        memory: '2Gi'
                    },
                    requests: {
                        cpu: '1',
                        memory: '2Gi'
                    }
                }
            }]
        }
    };

    const azureMockIngress: V1Ingress = {
        apiVersion: 'networking.k8s.io/v1',
        kind: 'Ingress',
        metadata: {
            name: 'azure-mock',
            namespace: options.namespace,
            annotations: {
                'cert-manager.io/cluster-issuer': 'artesca-root-ca-issuer'
            }
        },
        spec: {
            tls: [{
                secretName: 'zenko-tls-azure',
                hosts: [
                    'azure-mock.zenko.local',
                    '*.azure-mock.zenko.local',
                    '*.blob.azure-mock.zenko.local',
                    '*.queue.azure-mock.zenko.local'
                ]
            }],
            rules: [
                {
                    host: '*.azure-mock.zenko.local',
                    http: {
                        paths: [{
                            backend: {
                                service: {
                                    name: 'azure-mock',
                                    port: {
                                        name: 'blob'
                                    }
                                }
                            },
                            path: '/',
                            pathType: 'Prefix'
                        }]
                    }
                },
                {
                    host: 'azure-mock.zenko.local',
                    http: {
                        paths: [{
                            backend: {
                                service: {
                                    name: 'azure-mock',
                                    port: {
                                        name: 'blob'
                                    }
                                }
                            },
                            path: '/',
                            pathType: 'Prefix'
                        }]
                    }
                },
                {
                    host: '*.blob.azure-mock.zenko.local',
                    http: {
                        paths: [{
                            backend: {
                                service: {
                                    name: 'azure-mock',
                                    port: {
                                        name: 'blob'
                                    }
                                }
                            },
                            path: '/',
                            pathType: 'Prefix'
                        }]
                    }
                },
                {
                    host: 'blob.azure-mock.zenko.local',
                    http: {
                        paths: [{
                            backend: {
                                service: {
                                    name: 'azure-mock',
                                    port: {
                                        name: 'blob'
                                    }
                                }
                            },
                            path: '/',
                            pathType: 'Prefix'
                        }]
                    }
                },
                {
                    host: 'queue.azure-mock.zenko.local',
                    http: {
                        paths: [{
                            backend: {
                                service: {
                                    name: 'azure-mock',
                                    port: {
                                        name: 'queue'
                                    }
                                }
                            },
                            path: '/',
                            pathType: 'Prefix'
                        }]
                    }
                },
                {
                    host: '*.queue.azure-mock.zenko.local',
                    http: {
                        paths: [{
                            backend: {
                                service: {
                                    name: 'azure-mock',
                                    port: {
                                        name: 'queue'
                                    }
                                }
                            },
                            path: '/',
                            pathType: 'Prefix'
                        }]
                    }
                },
                {
                    host: 'devstoreaccount1.blob.azure-mock.zenko.local',
                    http: {
                        paths: [{
                            backend: {
                                service: {
                                    name: 'azure-mock',
                                    port: {
                                        name: 'blob'
                                    }
                                }
                            },
                            path: '/',
                            pathType: 'Prefix'
                        }]
                    }
                },
                {
                    host: 'devstoreaccount1.queue.azure-mock.zenko.local',
                    http: {
                        paths: [{
                            backend: {
                                service: {
                                    name: 'azure-mock',
                                    port: {
                                        name: 'queue'
                                    }
                                }
                            },
                            path: '/',
                            pathType: 'Prefix'
                        }]
                    }
                }
            ]
        }
    };

    await k8s.applyManifest(azureMockService, options.namespace);
    await k8s.applyManifest(azureMockPod, options.namespace);
    await k8s.applyManifest(azureMockIngress, options.namespace);

    logger.info('Azure Storage mock setup completed');

    await k8s.waitForPod('azure-mock-pod', options.namespace);
}