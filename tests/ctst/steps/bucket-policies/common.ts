import { When, Then, Given } from '@cucumber/cucumber';
import Zenko from '../../world/Zenko';
import { ActionPermissionsType, actionPermissions } from './utils';
import { createBucketWithConfiguration, putObject, runActionAgainstBucket } from 'steps/utils/utils';
import assert from 'assert';

enum AuthorizationType {
    ALLOW = 'Allow',
    DENY = 'Deny',
    IMPLICIT_DENY = 'ImplicitDeny',
    NO_RESOURCE = 'NoResource'
};

type AuthorizationConfiguration = {
    Identity: AuthorizationType,
    Resource: AuthorizationType,
};

Given('an action', async function (
    this: Zenko,
    action: string,
    withObjectLock: string,
    withVersioning: string,
    retentionMode: string,
    preExistingObject: string) {
    // Ensure that the action is valid and supported
    this.addToSaved('currentAction', actionPermissions.find((actionPermission) => actionPermission.action === action));
    if (!this.getSaved('currentAction')) {
        throw new Error(`Action ${action} is not supported yet`);
    }
    this.addToSaved('withVersioning', withVersioning);
    this.addToSaved('withObjectLock', withObjectLock);
    this.addToSaved('retentionMode', retentionMode);
    this.addToSaved('preExistingObject', !!preExistingObject);
});

Given('an existing bucket with saved configuration', async function (this: Zenko) {
    await createBucketWithConfiguration(this, this.getSaved<string>('bucketName'),
        this.getSaved<string>('withVersioning'), this.getSaved<string>('withObjectLock'), this.getSaved<string>('retentionMode'));
    if (this.getSaved<boolean>('preExistingObject')) {
        await putObject(this);
    }
});

Given('an {string} S3 Bucket Policy that {string} with {string} effect for the current API', async function (
    this: Zenko,
    doesExists: string,
    doesApply: string,
    isAllow: string) {
        const authzConfiguration: AuthorizationConfiguration = {
            Identity: this.getSaved<AuthorizationConfiguration>('authzConfiguration')?.Identity || AuthorizationType.NO_RESOURCE,
            Resource: this.getSaved<AuthorizationConfiguration>('authzConfiguration')?.Resource || AuthorizationType.NO_RESOURCE,
        };
        if (doesExists === 'existing') {
            if (doesApply === 'applies') {
                if (isAllow === 'allows') {
                    authzConfiguration.Resource = AuthorizationType.ALLOW;
                } else {
                    authzConfiguration.Resource = AuthorizationType.DENY;
                }
            } else {
                authzConfiguration.Resource = AuthorizationType.IMPLICIT_DENY;
            }
        } else {
            authzConfiguration.Resource = AuthorizationType.NO_RESOURCE;
        }
        this.addToSaved('authzConfiguration', authzConfiguration);
});

Given('an {string} IAM Policy that {string} with {string} effect for the current API', async function (
    this: Zenko,
    doesExists: string,
    doesApply: string,
    isAllow: string) {
        const authzConfiguration: AuthorizationConfiguration = {
            Identity: this.getSaved<AuthorizationConfiguration>('authzConfiguration')?.Identity || AuthorizationType.NO_RESOURCE,
            Resource: this.getSaved<AuthorizationConfiguration>('authzConfiguration')?.Resource || AuthorizationType.NO_RESOURCE,
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
    const isAllowed = (authzConfiguration?.Identity === AuthorizationType.ALLOW || authzConfiguration?.Identity === AuthorizationType.IMPLICIT_DENY)
        && (authzConfiguration?.Resource === AuthorizationType.ALLOW || authzConfiguration?.Resource === AuthorizationType.IMPLICIT_DENY);
    if (!isAllowed) {
        assert.strictEqual(this.getResult().err!.includes('AccessDenied'), true);
    } else {
        // if allowed, we either check the current action .expectedResultOnAllowTest error, or that there is no error.
        if (action.expectedResultOnAllowTest) {
            assert.strictEqual(this.getResult().err!.includes(action.expectedResultOnAllowTest), true);
        } else {
            assert.strictEqual(this.getResult().err, null);
        }
    }
});