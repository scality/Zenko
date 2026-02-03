const { S3Client } = require('@aws-sdk/client-s3');
const { IAMClient } = require('@aws-sdk/client-iam');
const { NodeHttpHandler } = require('@aws-sdk/node-http-handler');
const { variables, loadZenkoCredentialsFromK8s } = require('./variables');

const sharedHttpHandler = new NodeHttpHandler({
    requestTimeout: 0,
    connectionTimeout: 0,
});

async function zenkoCredentialsProvider() {
    if (!variables.accessKey) {
        await loadZenkoCredentialsFromK8s();
    }
    return {
        accessKeyId: variables.accessKey,
        secretAccessKey: variables.secretKey,
        sessionToken: variables.sessionToken,
    };
}

const scalityS3Client = new S3Client({
    credentials: zenkoCredentialsProvider,
    tls: false,
    endpoint: process.env.CLOUDSERVER_ENDPOINT,
    // endpoint: "http://end2end-connector-s3api.default.svc.cluster.local:80",
    region: 'us-east-1',
    forcePathStyle: true,
    // disable node sdk retries and timeout to prevent InvalidPart
    // and SocketHangUp errors. If retries are allowed, sdk will send
    // another request after first request has already deleted parts,
    // causing InvalidPart. Meanwhile, if request takes too long to finish,
    // sdk will create SocketHangUp error before response.
    maxAttempts: 1,
    requestHandler: sharedHttpHandler,
});

const scalityIAMClient = new IAMClient({
    credentials: zenkoCredentialsProvider,
    tls: false,
    endpoint: process.env.VAULT_ENDPOINT,
    region: 'us-east-1',
    // disable node sdk retries and timeout to prevent InvalidPart
    // and SocketHangUp errors. If retries are allowed, sdk will send
    // another request after first request has already deleted parts,
    // causing InvalidPart. Meanwhile, if request takes too long to finish,
    // sdk will create SocketHangUp error before response.
    maxAttempts: 1,
    requestHandler: sharedHttpHandler,
});

const verifyCerts = process.env.VERIFY_CERTIFICATES
    ? process.env.VERIFY_CERTIFICATES : true;

const awsS3Client = new S3Client({
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY,
        secretAccessKey: process.env.AWS_SECRET_KEY,
    },
    tls: verifyCerts,
    endpoint: process.env.AWS_ENDPOINT,
    region: 'us-east-1',
    forcePathStyle: true,
    maxAttempts: 1,
    requestHandler: sharedHttpHandler,
});

const ringS3Client = new S3Client({
    credentials: {
        accessKeyId: process.env.RING_S3C_ACCESS_KEY,
        secretAccessKey: process.env.RING_S3C_SECRET_KEY,
    },
    tls: false,
    endpoint: process.env.RING_S3C_ENDPOINT,
    region: 'us-east-1',
    forcePathStyle: true,
    maxAttempts: 1,
    requestHandler: sharedHttpHandler,
});

const altScalityS3Client = new S3Client({
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY,
        secretAccessKey: process.env.AWS_SECRET_KEY,
    },
    tls: false,
    endpoint: process.env.CLOUDSERVER_ENDPOINT,
    region: 'us-east-1',
    forcePathStyle: true,
    maxAttempts: 1,
    requestHandler: sharedHttpHandler,
});

function getS3Client(accessKey, secretKey, sessionToken) {
    const config = {
        tls: false,
        endpoint: process.env.CLOUDSERVER_ENDPOINT,
        region: 'us-east-1',
        forcePathStyle: true,
        credentials: {
            accessKeyId: accessKey,
            secretAccessKey: secretKey,
        },
    };
    if (sessionToken) {
        config.credentials.sessionToken = sessionToken;
    }
    return new S3Client(config);
}

module.exports = {
    scalityS3Client,
    awsS3Client,
    ringS3Client,
    altScalityS3Client,
    scalityIAMClient,
    getS3Client,
};
