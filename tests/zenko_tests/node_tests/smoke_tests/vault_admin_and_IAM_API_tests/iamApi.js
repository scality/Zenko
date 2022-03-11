const async = require('async');

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

    afterEach(done => clientAdmin.deleteAccount(accountName, done));

    it('should be able to perform CRUD operations on a user', done => async.series([
        next => iamAccountClient.createUser({ UserName: userName }, next),
        next => iamAccountClient.listUsers({}, next),
        next => iamAccountClient.getUser({ UserName: userName }, next),
        next => iamAccountClient.updateUser({ UserName: userName, NewPath: randomPath }, next),
        next => iamAccountClient.deleteUser({ UserName: userName }, next),
    ], done));
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
        return iamAccountClient.createUser({ UserName: userName }, done);
    }));

    afterEach(done => iamAccountClient.deleteUser(
        { UserName: userName },
        () => clientAdmin.deleteAccount(accountName, done),
    ));

    it('should be able to create, list and delete user access keys', done => async.series([
        next => iamAccountClient.createAccessKey({ UserName: userName }, (err, result) => {
            if (err) {
                return next(err);
            }
            keyPair = result.AccessKey;
            return next();
        }),
        next => iamAccountClient.listAccessKeys({ UserName: userName }, next),
        next => iamAccountClient.deleteAccessKey({
            UserName: userName,
            AccessKeyId: keyPair.AccessKeyId,
        }, next),
    ], done));
});
