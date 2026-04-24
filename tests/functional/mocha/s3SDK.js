const { S3Client } = require('@aws-sdk/client-s3');
const { NodeHttpHandler } = require('@smithy/node-http-handler');
const { getConfig, CLOUDSERVER_ENDPOINT } = require('tests_common/configuration');

const sharedHttpHandler = new NodeHttpHandler({
    requestTimeout: 0,
    connectionTimeout: 0,
});

function createS3Client(config) {
    return new S3Client(config);
}

// Defers client lookup until first method call, after the mocha root hook
// has populated the config.
function lazy(factory) {
    let instance = null;
    return new Proxy({}, {
        get(_, prop) {
            if (!instance) instance = factory();
            return instance[prop];
        },
    });
}

const scalityS3Client = lazy(() => getConfig().ZenkoAccount.s3Client);
const scalityIAMClient = lazy(() => getConfig().ZenkoAccount.iamClient);

const verifyCerts = process.env.VERIFY_CERTIFICATES
    ? process.env.VERIFY_CERTIFICATES : true;

const awsS3Client = createS3Client({
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

const ringS3Client = createS3Client({
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

const altScalityS3Client = createS3Client({
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY,
        secretAccessKey: process.env.AWS_SECRET_KEY,
    },
    tls: false,
    endpoint: CLOUDSERVER_ENDPOINT,
    region: 'us-east-1',
    forcePathStyle: true,
    maxAttempts: 1,
    requestHandler: sharedHttpHandler,
});

function getS3Client(accessKey, secretKey, sessionToken) {
    const config = {
        tls: false,
        endpoint: CLOUDSERVER_ENDPOINT,
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
    return createS3Client(config);
}

module.exports = {
    scalityS3Client,
    awsS3Client,
    ringS3Client,
    altScalityS3Client,
    scalityIAMClient,
    getS3Client,
};
