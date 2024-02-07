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
        this.addToSaved('withObjectLock', true);
    }

    if (needObject.includes(apiName)) {
        this.addToSaved('preExistingObject', true);
    }

    if (needVersioning.includes(apiName)) {
        this.addToSaved('withVersioning', true);
    }
});

Given('an existing bucket prepared for the action', async function (this: Zenko) {
    await createBucketWithConfiguration(this,
        this.getSaved<string>('bucketName'),
        this.getSaved<string>('withVersioning'),
        this.getSaved<string>('withObjectLock'),
        this.getSaved<string>('retentionMode'));
    if (this.getSaved<boolean>('preExistingObject')) {
        await putObject(this);
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
    if (doesExists === 'existing') {
        if (doesApply === 'applies') {
            if (isAllow === 'ALLOW') {
                authzConfiguration.Identity = AuthorizationType.ALLOW;
                effect = AuthorizationType.ALLOW;
            } else {
                authzConfiguration.Identity = AuthorizationType.DENY;
                effect = AuthorizationType.DENY;
            }
            resources = [
                `arn:aws:s3:::${this.getSaved<string>('bucketName')}`,
                `arn:aws:s3:::${this.getSaved<string>('bucketName')}/*`,
            ];
        } else {
            authzConfiguration.Identity = AuthorizationType.IMPLICIT_DENY;
            // Effect is ALLOW on purpose, to ensure we properly handle implicit denies
            effect = AuthorizationType.ALLOW;
            resources = [
                `arn:aws:s3:::${this.getSaved<string>('bucketName')}badname`,
                `arn:aws:s3:::${this.getSaved<string>('bucketName')}badname/*`,
            ];
        }
        if (action.excludePermissionOnBucketObjects) {
            resources.pop();
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
        await IAM.attachRolePolicy({
            policyArn,
            roleArn: this.getSaved<string>('identityName'),
        });
    }
    if (identityType === EntityType.IAM_USER) {
        await IAM.attachUserPolicy({
            policyArn,
            userName: this.getSaved<string>('identityName'),
        });
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
    if (doesExists === 'existing') {
        if (doesApply === 'applies') {
            if (isAllow === 'ALLOW') {
                authzConfiguration.Resource = AuthorizationType.ALLOW;
                effect = AuthorizationType.ALLOW;
            } else {
                authzConfiguration.Resource = AuthorizationType.DENY;
                effect = AuthorizationType.DENY;
            }
            resources = [
                `arn:aws:s3:::${this.getSaved<string>('bucketName')}`,
                `arn:aws:s3:::${this.getSaved<string>('bucketName')}/*`,
            ];
        } else {
            authzConfiguration.Resource = AuthorizationType.IMPLICIT_DENY;
            // Effect is ALLOW on purpose, to ensure we properly handle implicit denies
            effect = AuthorizationType.ALLOW;
            resources = [
                `arn:aws:s3:::${this.getSaved<string>('bucketName')}badname`,
                `arn:aws:s3:::${this.getSaved<string>('bucketName')}badname/*`,
            ];
        }
    } else {
        authzConfiguration.Resource = AuthorizationType.NO_RESOURCE;
        return;
    }
    this.addToSaved('authzConfiguration', authzConfiguration);
    const currentIdentityArn = this.getSaved<string>('identityArn');
    const basePolicy = {
        Version: '2012-10-17',
        Statement: [
            {
                Effect: effect,
                Action: action.permissions,
                Resource: resources,
                Principal: {
                    AWS: currentIdentityArn,
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
    await S3.putBucketPolicy({
        bucket: this.getSaved<string>('bucketName'),
        policy: JSON.stringify(basePolicy),
    });
    this.setAuthMode('test_identity');
});

When('the user tries to perform the current S3 action on the bucket', async function (this: Zenko) {
    this.addToSaved('objectName', `objectforbptests-${Utils.randomString()}`);
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
    const isAllowed = (
        // case: both allow
        (authI === AuthorizationType.ALLOW && authR === AuthorizationType.ALLOW) ||
        // case: one allow, one implicit deny
        ((authI === AuthorizationType.ALLOW && authR === AuthorizationType.IMPLICIT_DENY) ||
            (authI === AuthorizationType.IMPLICIT_DENY && authR === AuthorizationType.ALLOW)) ||
        // case: one allow, one no resource
        ((authI === AuthorizationType.ALLOW && authR === AuthorizationType.NO_RESOURCE) ||
            (authI === AuthorizationType.NO_RESOURCE && authR === AuthorizationType.ALLOW))         
    );
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
