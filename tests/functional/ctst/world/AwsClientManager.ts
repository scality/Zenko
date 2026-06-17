import { S3Client } from '@aws-sdk/client-s3';
import { IAMClient } from '@aws-sdk/client-iam';
import { STSClient } from '@aws-sdk/client-sts';

export interface AwsCredentials {
    accessKeyId: string;
    secretAccessKey: string;
    sessionToken?: string;
}

export class AwsClientManager {
    private currentIdentity = '';
    private defaultIdentity = '';
    private readonly s3Clients = new Map<string, S3Client>();
    private readonly iamClients = new Map<string, IAMClient>();
    private readonly stsClients = new Map<string, STSClient>();
    private readonly credentials = new Map<string, AwsCredentials>();

    constructor(
        private readonly s3Endpoint: string,
        private readonly iamEndpoint: string,
        private readonly stsEndpoint: string,
    ) {}

    registerIdentity(name: string, creds: AwsCredentials, isDefault = false): void {
        this.s3Clients.set(name, new S3Client({
            region: 'us-east-1',
            endpoint: this.s3Endpoint,
            credentials: creds,
            forcePathStyle: true,
        }));
        this.iamClients.set(name, new IAMClient({
            region: 'us-east-1',
            endpoint: this.iamEndpoint,
            credentials: creds,
        }));
        this.stsClients.set(name, new STSClient({
            region: 'us-east-1',
            endpoint: this.stsEndpoint,
            credentials: creds,
        }));
        this.credentials.set(name, creds);
        if (isDefault) {
            this.defaultIdentity = name;
            this.currentIdentity = name;
        }
    }

    getCredentials(name?: string): AwsCredentials {
        const key = name ?? this.currentIdentity;
        const creds = this.credentials.get(key);
        if (!creds) throw new Error(`No credentials for identity: "${key}"`);
        return creds;
    }

    hasIdentity(name: string): boolean {
        return this.s3Clients.has(name);
    }

    useIdentity(name: string): void {
        if (!this.s3Clients.has(name)) {
            throw new Error(`Unknown identity: "${name}"`);
        }
        this.currentIdentity = name;
    }

    reset(): void {
        if (!this.defaultIdentity) throw new Error('No default identity set — call registerIdentity(..., true) first');
        this.currentIdentity = this.defaultIdentity;
    }

    get s3(): S3Client {
        const client = this.s3Clients.get(this.currentIdentity);
        if (!client) throw new Error('No identity selected — call useIdentity() first');
        return client;
    }

    get iam(): IAMClient {
        const client = this.iamClients.get(this.currentIdentity);
        if (!client) throw new Error('No identity selected — call useIdentity() first');
        return client;
    }

    get sts(): STSClient {
        const client = this.stsClients.get(this.currentIdentity);
        if (!client) throw new Error('No identity selected — call useIdentity() first');
        return client;
    }
}
