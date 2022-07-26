const { scalityS3Client } = require('../../../s3SDK');
const LifecycleUtility = require('../../LifecycleUtility');

const cloudServer = new LifecycleUtility(scalityS3Client)

const req = cloudServer.s3.restoreObject({
    Bucket: 'transition-bucket-46a2d2a2-daaf-4527-b8db-7adf1a8fec63',
    Key: '79aeeebb-bbd9-4e79-8b07-b79d1453597c-from-LocalStorage-to-DMF-nover-object',
    RestoreRequest: {
        Days: 1,
        Tier: 'Standard',
    },
});

req.on('success', response => {
    console.log(response);
});

req.on('error', err => {
    console.log(err);
});

req.send();
