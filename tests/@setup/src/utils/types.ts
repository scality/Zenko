export interface ReplicationWorkflow {
    name: string;
    sourceBucket: string;
    sourceLocation: string;
    targetBucket: string;
    targetLocation: string;
    enabled: boolean;
    description?: string;
}

export interface LifecycleRule {
    id: string;
    status: 'Enabled' | 'Disabled';
    filter: {
        prefix?: string;
        tags?: { [key: string]: string };
    };
    transitions?: Array<{
        days: number;
        storageClass: string;
    }>;
    expiration?: {
        days: number;
    };
}

export interface LifecycleWorkflow {
    name: string;
    bucketName: string;
    rules: LifecycleRule[];
}

export interface IngestionWorkflow {
    name: string;
    sourceBucket: string;
    sourceLocation: string;
    targetBucket: string;
    targetLocation: string;
    schedule: string;
    enabled: boolean;
    description?: string;
}

export interface WorkflowsConfig {
    replication: ReplicationWorkflow[];
    lifecycle: LifecycleWorkflow[];
    ingestion: IngestionWorkflow[];
}

export interface WorkflowsOptions {
    namespace: string;
    instanceId: string;
    zenkoName?: string;
    subdomain?: string;
    configFile?: string;
    workflowType?: 'replication' | 'lifecycle' | 'ingestion';
}
