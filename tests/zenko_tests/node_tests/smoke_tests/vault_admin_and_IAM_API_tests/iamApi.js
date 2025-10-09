const async = require('async');
const {
    CreateUserCommand,
    ListUsersCommand,
    GetUserCommand,
    UpdateUserCommand,
    DeleteUserCommand,
    CreateAccessKeyCommand,
    ListAccessKeysCommand,
    DeleteAccessKeyCommand,
} = require('@aws-sdk/client-iam');
const VaultClient = require('../../VaultClient');

const clientAdmin = VaultClient.getAdminClient();
const accountName = 'iam-api-test-account';
const accountInfo = {
    email: `${accountName}@test.com`,
    password: 'test',
};
const externalAccessKey = 'DZMMJUPWIUK8IWXRP0HQ';
const externalSecretKey = 'iTuJdlidzrLipymvAGrLP66Yxghl4NQxLZR3cLlu';
const userName = 'iam-api-test-user';
const randomPath = '/random/path/';

describe('IAM users: ', () => {
    let iamAccountClient = null;

    beforeEach(done => async.series([
        next => clientAdmin.createAccount(accountName, accountInfo, next),
        next => clientAdmin.generateAccountAccessKey(accountName, next, { externalAccessKey, externalSecretKey }),
    ], err => {
        if (err) {
            return done(err);
        }
        iamAccountClient = VaultClient.getIamClient(externalAccessKey, externalSecretKey);
        return done();
    }));

    afterEach(async () => {
        await VaultClient.deleteVaultAccount(clientAdmin, iamAccountClient, accountName);
    });

    it('should be able to perform CRUD operations on a user', async () => {
        await iamAccountClient.send(new CreateUserCommand({ UserName: userName }));
        await iamAccountClient.send(new ListUsersCommand({}));
        await iamAccountClient.send(new GetUserCommand({ UserName: userName }));
        await iamAccountClient.send(new UpdateUserCommand({ UserName: userName, NewPath: randomPath }));
        await iamAccountClient.send(new DeleteUserCommand({ UserName: userName }));
    });
});

describe('IAM user - Access Keys: ', () => {
    let iamAccountClient = null;
    let keyPair = null;

    beforeEach(done => async.series([
        next => clientAdmin.createAccount(accountName, accountInfo, next),
        next => clientAdmin.generateAccountAccessKey(accountName, next, { externalAccessKey, externalSecretKey }),
    ], err => {
        if (err) {
            return done(err);
        }
        iamAccountClient = VaultClient.getIamClient(externalAccessKey, externalSecretKey);
        return iamAccountClient.send(new CreateUserCommand({ UserName: userName }))
            .then(() => done())
            .catch(done);
    }));

    afterEach(async () => {
        await iamAccountClient.send(new DeleteUserCommand({ UserName: userName }));
        await VaultClient.deleteVaultAccount(clientAdmin, iamAccountClient, accountName);
    });

    it('should be able to create, list and delete user access keys', async () => {
        const res = await iamAccountClient.send(new CreateAccessKeyCommand({ UserName: userName }));
        keyPair = res.AccessKey;
        await iamAccountClient.send(new ListAccessKeysCommand({ UserName: userName }));
        await iamAccountClient.send(new DeleteAccessKeyCommand({
            UserName: userName,
            AccessKeyId: keyPair.AccessKeyId,
        }));
    });
});
