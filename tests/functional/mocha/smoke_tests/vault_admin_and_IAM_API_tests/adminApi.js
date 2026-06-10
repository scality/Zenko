const async = require('async');
const VaultClient = require('../../VaultClient');

const accountName = 'admin-api-test-account';
const accountInfo = {
    email: `${accountName}@test.com`,
    password: 'test',
};

let iamClient = null;

describe('Accounts: ', () => {
    let clientAdmin;
    before(() => { clientAdmin = VaultClient.getAdminClient(); });

    it('should be able create, generate credentials and delete an account', done => {
        async.series([
            next => clientAdmin.createAccount(accountName, accountInfo, next),
            next => clientAdmin.generateAccountAccessKey(accountName, (err, res) => {
                if (err) {
                    return next(err);
                }
                iamClient = VaultClient.getIamClient(res.id, res.value);
                return next(null);
            }),
            next => {
                VaultClient.deleteVaultAccount(clientAdmin, iamClient, accountName)
                    .then(() => next())
                    .catch(next);
            },
        ], done);
    });
});
