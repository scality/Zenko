
const async = require('async');

const VaultClient = require('./VaultClient');

const clientAdmin = VaultClient.getAdminClient();
const accountName = 'admin-api-test-account';
const accountInfo = {
    email: `${accountName}@test.com`,
    password: 'test',
};

describe('Accounts: ', () => {
    it('should be able create, generate credentials and delete an account', done => async.series([
        next => clientAdmin.createAccount(accountName, accountInfo, next),
        next => clientAdmin.generateAccountAccessKey(accountName, next),
        next => clientAdmin.deleteAccount(accountName, next),
    ], done))
});
