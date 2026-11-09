import { S3Client } from '@aws-sdk/client-s3';
import { IAMClient } from '@aws-sdk/client-iam';
import { STSClient } from '@aws-sdk/client-sts';
import { BackbeatRoutesClient, BucketQuotaClient } from '@scality/cloudserverclient';

export interface AWSCredentials {
    accessKeyId: string;
    secretAccessKey: string;
    sessionToken?: string;
}

export interface AwsEndpoint {
    subdomain: string;
    https: boolean;
    port: string;
}

/**
 * S3, IAM, STS, backbeat routes and bucket quota clients for one set of credentials, on <service>.<subdomain>.
 */
export class AwsClients {
    readonly s3: S3Client;
    readonly iam: IAMClient;
    readonly sts: STSClient;
    readonly backbeatRoutes: BackbeatRoutesClient;
    readonly bucketQuota: BucketQuotaClient;

    constructor(credentials: AWSCredentials | undefined, { subdomain, https, port }: AwsEndpoint) {
        const endpoint = (service: string) => `${https ? 'https' : 'http'}://${service}.${subdomain}:${port}`;
        // No SDK retries: some tests assert on throttling and transient errors themselves
        const config = { region: 'us-east-1', credentials, maxAttempts: 1 };
        this.s3 = new S3Client({ ...config, endpoint: endpoint('s3'), forcePathStyle: true });
        this.iam = new IAMClient({ ...config, endpoint: endpoint('iam') });
        this.sts = new STSClient({ ...config, endpoint: endpoint('sts') });
        this.backbeatRoutes = new BackbeatRoutesClient({ ...config, endpoint: endpoint('s3') });
        this.bucketQuota = new BucketQuotaClient({ ...config, endpoint: endpoint('s3') });
    }
}
