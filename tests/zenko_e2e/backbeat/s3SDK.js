const S3 = require('aws-sdk').S3;

const scalityS3Client = new S3({
    accessKeyId: process.env.ZENKO_STORAGE_ACCOUNT_ACCESS_KEY,
    secretAccessKey: process.env.ZENKO_STORAGE_ACCOUNT_SECRET_KEY,
    sslEnabled: false,
    endpoint: 'http://zenko.local',
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

const awsS3Client = new S3({
    accessKeyId: process.env.AWS_S3_BACKEND_ACCESS_KEY,
    secretAccessKey: process.env.AWS_S3_BACKEND_SECRET_KEY,
    sslEnabled: true,
    endpoint: 'https://s3.amazonaws.com',
    apiVersions: { s3: '2006-03-01' },
    signatureCache: false,
    signatureVersion: 'v4',
    region: 'us-east-1',
    s3ForcePathStyle: true,
    maxRetries: 0,
    httpOptions: { timeout: 0 },
});

module.exports = { scalityS3Client, awsS3Client };
