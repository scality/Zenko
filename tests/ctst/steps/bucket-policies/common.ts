import { When, Then, Given } from '@cucumber/cucumber';
import Zenko, { EntityType } from '../../world/Zenko';
import { ActionPermissionsType, actionPermissions, needObject, needObjectLock, needVersioning } from './utils';
import { createBucketWithConfiguration, putObject, runActionAgainstBucket } from 'steps/utils/utils';
import assert from 'assert';
import { IAM } from 'cli-testing';
import { extractPropertyFromResults } from 'common/utils';

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

Given('an {string} S3 Bucket Policy that {string} with {string} effect for the current API', async function (
    this: Zenko,
    doesExists: string,
    doesApply: string,
    isAllow: string,
) {
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
            if (isAllow === 'allows') {
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
    // TODO actually create the policy atteched to the current identity
    const currentIdentityArn = this.getSaved<string>('identityArn');
    // craft an IAM policy to follow the current configuration, and attach it to the current
    // identity, if needed
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
        process.stdout.write(`Policy to be created: ${JSON.stringify(basePolicy, null, 2)}. Expecting authz ${authzConfiguration}.\n`);
    }
    // this must be ran as the account
    const createdPolicy = await IAM.createPolicy({
        policyDocument: JSON.stringify(basePolicy),
        policyName: 'testPolicy',
    });
    const policyArn = extractPropertyFromResults(createdPolicy, 'Policy', 'Arn') as string;

    const identityType = this.getSaved<string>('identityType') as EntityType;
    // attach the policy to the current identity: role or user
    if (identityType === EntityType.ASSUME_ROLE_USER || identityType === EntityType.ASSUME_ROLE_USER_CROSS_ACCOUNT) {
        await IAM.attachRolePolicy({
            policyArn,
            roleName: this.getSaved<string>('identityName'),
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
});

Given('an {string} IAM Policy that {string} with {string} effect for the current API', function (
    this: Zenko,
    doesExists: string,
    doesApply: string,
    isAllow: string,
) {
    const authzConfiguration: AuthorizationConfiguration = {
        Identity: this.getSaved<AuthorizationConfiguration>('authzConfiguration')?.Identity
            || AuthorizationType.NO_RESOURCE,
        Resource: this.getSaved<AuthorizationConfiguration>('authzConfiguration')?.Resource
            || AuthorizationType.NO_RESOURCE,
    };
    if (doesExists === 'existing') {
        if (doesApply === 'applies') {
            if (isAllow === 'allows') {
                authzConfiguration.Identity = AuthorizationType.ALLOW;
            } else {
                authzConfiguration.Identity = AuthorizationType.DENY;
            }
        } else {
            authzConfiguration.Identity = AuthorizationType.IMPLICIT_DENY;
        }
    } else {
        authzConfiguration.Identity = AuthorizationType.NO_RESOURCE;
    }
    this.addToSaved('authzConfiguration', authzConfiguration);
    // TODO actually create the policy atteched to the current identity
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
    const isAllowed = (authzConfiguration?.Identity === AuthorizationType.ALLOW
        || authzConfiguration?.Identity === AuthorizationType.IMPLICIT_DENY)
        && (authzConfiguration?.Resource === AuthorizationType.ALLOW
            || authzConfiguration?.Resource === AuthorizationType.IMPLICIT_DENY);
    if (!isAllowed) {
        assert.strictEqual(this.getResult().err?.includes('AccessDenied'), true);
    } else {
        // if allowed, we either check the current action .expectedResultOnAllowTest error, or that there is no error.
        if (action.expectedResultOnAllowTest) {
            assert.strictEqual(this.getResult().err?.includes(action.expectedResultOnAllowTest), true);
        } else {
            assert.strictEqual(this.getResult().err, null);
        }
    }
});