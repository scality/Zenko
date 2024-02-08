import { When, Then, Given } from '@cucumber/cucumber';
import Zenko, { EntityType } from '../../world/Zenko';
import { ActionPermissionsType, actionPermissions, needObject, needObjectLock, needVersioning } from './utils';
import { createBucketWithConfiguration, putObject, runActionAgainstBucket } from 'steps/utils/utils';
import assert from 'assert';
import { IAM, S3, Utils } from 'cli-testing';
import { extractPropertyFromResults } from 'common/utils';

// TODO: test the object lock APIs with the bypass headers checks:
// - deleteObject
// - multiDeleteObject
// - objectputretention
// need to rerun these APIs with object lock enabled (governance) and check with the bypass header permission
// TODO add support for CNES use case

enum AuthorizationType {
    ALLOW = 'Allow',
    DENY = 'Deny',
    IMPLICIT_DENY = 'ImplicitDeny',
    NO_RESOURCE = 'NoResource'
}

type AuthorizationConfiguration = {
    Identity: AuthorizationType,
    Resource: AuthorizationType,
};

Given('an action {string}', function (this: Zenko, apiName: string) {
    // dynamically know the config based on the action
    // Ensure that the action is valid and supported
    this.saveAuthMode('base_account');
    this.addToSaved('currentAction', actionPermissions.find(actionPermission => actionPermission.action === apiName));
    if (!this.getSaved('currentAction')) {
        throw new Error(`Action ${apiName} is not supported yet`);
    }

    if (needObjectLock.includes(apiName)) {
        this.addToSaved('withObjectLock', 'with');
        this.addToSaved('retentionMode', 'GOVERNANCE');
    }

    if (needObject.includes(apiName)) {
        this.addToSaved('preExistingObject', true);
    }

    if (needVersioning.includes(apiName)) {
        this.addToSaved('withVersioning', 'with');
    }
});

Given('an existing bucket prepared for the action', async function (this: Zenko) {
    await createBucketWithConfiguration(this,
        this.getSaved<string>('bucketName'),
        this.getSaved<string>('withVersioning'),
        this.getSaved<string>('withObjectLock'),
        this.getSaved<string>('retentionMode'));
    if (this.getSaved<boolean>('preExistingObject')) {
        this.addToSaved('objectName', `objectforbptests-${Utils.randomString()}`);
        await putObject(this, this.getSaved<string>('objectName'));
    }
});

Given('an {string} IAM Policy that {string} with {string} effect for the current API', async function (
    this: Zenko,
    doesExists: string,
    doesApply: string,
    isAllow: string,
) {
    // This step needs full access.
    this.saveAuthMode('base_account');
    const authzConfiguration: AuthorizationConfiguration = {
        Identity: this.getSaved<AuthorizationConfiguration>('authzConfiguration')?.Identity
            || AuthorizationType.NO_RESOURCE,
        Resource: this.getSaved<AuthorizationConfiguration>('authzConfiguration')?.Resource
            || AuthorizationType.NO_RESOURCE,
    };
    const action = this.getSaved<ActionPermissionsType>('currentAction');
    let effect = AuthorizationType.DENY;
    // use the current S3 bucket
    let resources;
    const applies = doesApply === 'applies';
    const bucketName = action.useWildCardBucketName ?
        '*' : this.getSaved<string>('bucketName');
    if (doesExists === 'existing') {
        if (applies) {
            if (isAllow === 'ALLOW') {
                authzConfiguration.Identity = AuthorizationType.ALLOW;
                effect = AuthorizationType.ALLOW;
            } else {
                authzConfiguration.Identity = AuthorizationType.DENY;
                effect = AuthorizationType.DENY;
            }
            resources = [
                `arn:aws:s3:::${bucketName}`,
                `arn:aws:s3:::${bucketName}/*`,
            ];
        } else {
            authzConfiguration.Identity = AuthorizationType.IMPLICIT_DENY;
            // Effect is ALLOW on purpose, to ensure we properly handle implicit denies
            effect = AuthorizationType.ALLOW;
            resources = [
                `arn:aws:s3:::${bucketName}badname`,
                `arn:aws:s3:::${bucketName}badname/*`,
            ];
        }
        if (action.excludePermissionOnBucketObjects) {
            resources.pop();
        }
        if (action.excludePermissionsOnBucket) {
            resources.shift();
        }
    } else {
        authzConfiguration.Resource = AuthorizationType.NO_RESOURCE;
        return;
    }
    this.addToSaved('authzConfiguration', authzConfiguration);
    const basePolicy = {
        Version: '2012-10-17',
        Statement: [
            {
                Effect: effect,
                Action: action.permissions,
                Resource: resources,
            },
        ],
    };
    if (isAllow === 'ALLOW+DENY') {
        basePolicy.Statement.push({
            Effect: effect === AuthorizationType.ALLOW ? AuthorizationType.DENY : AuthorizationType.ALLOW,
            Action: action.permissions,
            Resource: resources,
        });
    }
    if (process.env.VERBOSE) {
        process.stdout.write(
            `IAM Policy to be created: ${
                JSON.stringify(basePolicy, null, 2)
            }Expecting authz ${
                JSON.stringify(authzConfiguration)
            }With the current state ${
                JSON.stringify({
                    identityType: this.getSaved<string>('identityType'),
                    identityArn: this.getSaved<string>('identityArn'),
                    identityName: this.getSaved<string>('identityName'),  
                })                
            }\n`);
    }
    // this must be ran as the account
    const createdPolicy = await IAM.createPolicy({
        policyDocument: JSON.stringify(basePolicy),
        policyName: `policyforauthz-${Utils.randomString()}`,
    });
    const policyArn = extractPropertyFromResults(createdPolicy, 'Policy', 'Arn') as string;

    const identityType = this.getSaved<string>('identityType') as EntityType;
    // attach the policy to the current identity: role or user
    if (identityType === EntityType.ASSUME_ROLE_USER || identityType === EntityType.ASSUME_ROLE_USER_CROSS_ACCOUNT) {
        const result = await IAM.attachRolePolicy({
            policyArn,
            roleName: this.getSaved<string>('identityName'),
        });
        assert.ifError(result.stderr || result.err);
    }
    if (identityType === EntityType.IAM_USER) {
        const result = await IAM.attachUserPolicy({
            policyArn,
            userName: this.getSaved<string>('identityName'),
        });
        assert.ifError(result.stderr || result.err);
    }
    if (identityType === EntityType.STORAGE_MANAGER) {
        // TODO: special case because it already has existing permissions
        // must disable all the tests that change the IAM part
    }
    this.setAuthMode('test_identity');
});

Given('an {string} S3 Bucket Policy that {string} with {string} effect for the current API', async function (
    this: Zenko,
    doesExists: string,
    doesApply: string,
    isAllow: string,
) {
    // This step needs full access.
    this.setAuthMode('base_account');
    const authzConfiguration: AuthorizationConfiguration = {
        Identity: this.getSaved<AuthorizationConfiguration>('authzConfiguration')?.Identity
            || AuthorizationType.NO_RESOURCE,
        Resource: this.getSaved<AuthorizationConfiguration>('authzConfiguration')?.Resource
            || AuthorizationType.NO_RESOURCE,
    };
    const action = this.getSaved<ActionPermissionsType>('currentAction');
    let effect = AuthorizationType.DENY;
    // use the current S3 bucket
    let resources;
    const applies = doesApply === 'applies';
    const bucketName = action.useWildCardBucketName ?
        '*' : this.getSaved<string>('bucketName');
    if (doesExists === 'existing') {
        if (applies) {
            if (isAllow === 'ALLOW') {
                authzConfiguration.Resource = AuthorizationType.ALLOW;
                effect = AuthorizationType.ALLOW;
            } else {
                authzConfiguration.Resource = AuthorizationType.DENY;
                effect = AuthorizationType.DENY;
            }
            resources = [
                `arn:aws:s3:::${bucketName}`,
                `arn:aws:s3:::${bucketName}/*`,
            ];
        } else {
            authzConfiguration.Resource = AuthorizationType.IMPLICIT_DENY;
            // Effect is ALLOW on purpose, to ensure we properly handle implicit denies
            effect = AuthorizationType.ALLOW;
            resources = [
                `arn:aws:s3:::${bucketName}`,
                `arn:aws:s3:::${bucketName}/*`,
            ];
        }
        if (action.excludePermissionOnBucketObjects) {
            resources.pop();
        }
        if (action.excludePermissionsOnBucket) {
            resources.shift();
        }
    } else {
        authzConfiguration.Resource = AuthorizationType.NO_RESOURCE;
        return;
    }
    this.addToSaved('authzConfiguration', authzConfiguration);
    const currentIdentityArn = this.getSaved<string>('identityArn');
    let principal = currentIdentityArn;
    const identityType = this.getSaved<string>('identityType') as EntityType;
    if (identityType === EntityType.ASSUME_ROLE_USER || identityType === EntityType.ASSUME_ROLE_USER_CROSS_ACCOUNT) {
        principal = '*';
    }
    if (!applies) {
        principal = `${currentIdentityArn}badname`;
    }
    const basePolicy = {
        Version: '2012-10-17',
        Statement: [
            {
                Effect: effect,
                Action: action.permissions,
                Resource: resources,
                Principal: {
                    AWS: principal,
                },
            },
        ],
    };
    if (process.env.VERBOSE) {
        process.stdout.write(
            `Bucket Policy to be created: ${
                JSON.stringify(basePolicy, null, 2)
            }Expecting authz ${
                JSON.stringify(authzConfiguration)
            }With the current state ${
                JSON.stringify({
                    identityType: this.getSaved<string>('identityType'),
                    identityArn: this.getSaved<string>('identityArn'),
                    identityName: this.getSaved<string>('identityName'),  
                })                
            }\n`);
    }
    const result = await S3.putBucketPolicy({
        bucket: this.getSaved<string>('bucketName'),
        policy: JSON.stringify(basePolicy),
    });
    assert.ifError(result.stderr || result.err);
    this.setAuthMode('test_identity');
});

When('the user tries to perform the current S3 action on the bucket', async function (this: Zenko) {
    await runActionAgainstBucket(this, this.getSaved<ActionPermissionsType>('currentAction').action);
});

Then('the authorization result is correct', function (this: Zenko) {
    this.cleanupEntity();
    const action = this.getSaved<ActionPermissionsType>('currentAction');
    // based on the saved authzConfiguration, check if the result is as expected
    // We only consider Allow or Deny here.
    const authzConfiguration = this.getSaved<AuthorizationConfiguration>('authzConfiguration');
    // allowed in the following case: both allows, one allow + one is implicit
    // others are denied
    const authI = authzConfiguration?.Identity;
    const authR = authzConfiguration?.Resource;
    let isAllowed = (() => {
        switch (authI) {
        case AuthorizationType.ALLOW:
            return authR === AuthorizationType.ALLOW ||
                    authR === AuthorizationType.IMPLICIT_DENY ||
                    authR === AuthorizationType.NO_RESOURCE;
        case AuthorizationType.IMPLICIT_DENY:
            return authR === AuthorizationType.ALLOW;
        case AuthorizationType.NO_RESOURCE:
            return authR === AuthorizationType.ALLOW;
        default:
            return false;
        }
    })();
    // Special cases: for CreateBucket and DeleteBucket, BP
    // does not apply.
    if (action.action === 'CreateBucket') {
        // In this case, we only consider the Identity part.
        isAllowed = authI === AuthorizationType.ALLOW;
    }
    // TODO disable after S3C-8424 is done
    if (action.action === 'CreateMultipartUpload') {
        return;
    }
    if (!isAllowed) {
        // special case: DeleteObjects always returns code 200
        // if the API is allowed but additional checks are denied.
        if (action.action === 'DeleteObjects' && action.subAuthorizationChecks) {
            assert.strictEqual(this.getResult().stdout?.includes('AccessDenied'), true);
        } else {
            assert.strictEqual(this.getResult().err?.includes('AccessDenied'), true);
        }
    } else {
        // if allowed, we either check the current action .expectedResultOnAllowTest error, or that there is no error.
        if (action.expectedResultOnAllowTest) {
            assert.strictEqual(
                this.getResult().err?.includes(action.expectedResultOnAllowTest) ||
                this.getResult().stdout?.includes(action.expectedResultOnAllowTest), true);
        } else {
            assert.strictEqual(this.getResult().err, null);
        }
    }
});
