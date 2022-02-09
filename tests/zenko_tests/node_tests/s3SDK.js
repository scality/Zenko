const { S3 } = require('aws-sdk');
const { IAM } = require('aws-sdk');

const scalityS3Client = new S3({
    accessKeyId: process.env.ZENKO_ACCESS_KEY,
    secretAccessKey: process.env.ZENKO_SECRET_KEY,
    sessionToken: process.env.ZENKO_SESSION_TOKEN,
    sslEnabled: false,
    endpoint: process.env.CLOUDSERVER_ENDPOINT,
    apiVersions: { s3: '2006-03-01' },
    signatureCache: false,
    signatureVersion: 'v4',
    region: 'us-east-1',
    s3ForcePathStyle: true,
    // disable node sdk retries and timeout to prevent InvalidPart
    // and SocketHangUp errors. If retries are allowed, sdk will send
    // another request after first request has already deleted parts,
    // causing InvalidPart. Meanwhile, if request takes too long to finish,
    // sdk will create SocketHangUp error before response.
    maxRetries: 0,
    httpOptions: { timeout: 0 },
});

const scalityIAMClient = new IAM({
    accessKeyId: process.env.ZENKO_ACCESS_KEY,
    secretAccessKey: process.env.ZENKO_SECRET_KEY,
    sessionToken: process.env.ZENKO_SESSION_TOKEN,
    sslEnabled: false,
    endpoint: process.env.VAULT_ENDPOINT,
    apiVersions: { s3: '2006-03-01' },
    signatureCache: false,
    signatureVersion: 'v4',
    region: 'us-east-1',
    // disable node sdk retries and timeout to prevent InvalidPart
    // and SocketHangUp errors. If retries are allowed, sdk will send
    // another request after first request has already deleted parts,
    // causing InvalidPart. Meanwhile, if request takes too long to finish,
    // sdk will create SocketHangUp error before response.
    maxRetries: 0,
    httpOptions: { timeout: 0 },
});

const verifyCerts = process.env.VERIFY_CERTIFICATES
    ? process.env.VERIFY_CERTIFICATES : true;

const awsS3Client = new S3({
    accessKeyId: process.env.AWS_ACCESS_KEY,
    secretAccessKey: process.env.AWS_SECRET_KEY,
    sslEnabled: verifyCerts,
    endpoint: process.env.AWS_ENDPOINT,
    apiVersions: { s3: '2006-03-01' },
    signatureCache: false,
    signatureVersion: 'v4',
    region: 'us-east-1',
    s3ForcePathStyle: true,
    maxRetries: 0,
    httpOptions: { timeout: 0 },
});

const ringS3Client = new S3({
    accessKeyId: process.env.RING_S3C_ACCESS_KEY,
    secretAccessKey: process.env.RING_S3C_SECRET_KEY,
    sslEnabled: false,
    endpoint: process.env.RING_S3C_ENDPOINT,
    apiVersions: { s3: '2006-03-01' },
    signatreCache: false,
    signatureVersion: 'v4',
    region: 'us-east-1',
    s3ForcePathStyle: true,
    maxRetries: 0,
    httpOptions: { timeout: 0 },
});

const altScalityS3Client = new S3({
    accessKeyId: process.env.AWS_ACCESS_KEY,
    secretAccessKey: process.env.AWS_SECRET_KEY,
    sslEnabled: false,
    endpoint: process.env.CLOUDSERVER_ENDPOINT,
    apiVersions: { s3: '2006-03-01' },
    signatureCache: false,
    signatureVersion: 'v4',
    region: 'us-east-1',
    s3ForcePathStyle: true,
    maxRetries: 0,
    httpOptions: { timeout: 0 },
});

function getS3Client(accessKey, secretKey, sessionToken) {
    const config = {
        sslEnabled: false,
        endpoint: process.env.CLOUDSERVER_ENDPOINT,
        apiVersions: { s3: '2006-03-01' },
        signatureCache: false,
        signatureVersion: 'v4',
        region: 'us-east-1',
        s3ForcePathStyle: true,
        accessKeyId: accessKey,
        secretAccessKey: secretKey,
    };
    if (sessionToken) {
        config.sessionToken = sessionToken;
    }
    return new S3(config);
}

module.exports = {
    scalityS3Client,
    awsS3Client,
    ringS3Client,
    altScalityS3Client,
    scalityIAMClient,
    getS3Client,
};
