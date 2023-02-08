import { Then, When } from '@cucumber/cucumber';
import { strict as assert } from 'assert';
import { errors } from 'arsenal';
import { testAPIs } from '../../world/utils/utils.js';

When('a {string} tries to perform {string}', function (type : string, action : string) {
    testAPIs.find(api => api.API === action)?.checkResponse(this.parameters.AssumedSession,
        this.saved.bucketName, (err : any, res : any) => {
        if (err) {
            assert.ifError(err);
            return (err);
        }
        this.result = res;
        return (res);
    }, 'x'.repeat(10));
});

Then('they should be able to execute the API', function () {
    assert.notStrictEqual(this.result.code, errors.AccessDenied.message);
    assert.strictEqual(this.result.statusCode, 200);
});