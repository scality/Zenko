 
import { When, Then, Given } from '@cucumber/cucumber';
import Zenko, { EntityType } from '../../world/Zenko';
import {
    ActionPermissionsType,
    actionPermissions,
    needObject,
    needObjectLock,
    needVersioning,
    preCreatedPolicies,
    writeOperationsOnABucket,
} from './utils';
import {
    AuthorizationConfiguration,
    AuthorizationType,
    createBucketWithConfiguration,
    getAuthorizationConfiguration,
    putObject,
    runActionAgainstBucket,
} from 'steps/utils/utils';
import assert from 'assert';
import { IAM, Identity, S3, Utils } from 'cli-testing';
import { extractPropertyFromResults } from 'common/utils';

Given('an action {string}', function (this: Zenko, apiName: string) {
    // dynamically know the config based on the action
    // Ensure that the action is valid and supported
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

Given('a permission to perform the {string} action', function (this: Zenko, action: string) {
    const currentAction = this.getSaved<ActionPermissionsType>('currentAction');
    const permissionsForAction = actionPermissions.find(actionPermission => actionPermission.action === action);
    if (!permissionsForAction) {
        throw new Error(`Action ${action} is not supported yet`);
    }
    currentAction.permissions = currentAction.permissions.concat(permissionsForAction.permissions);
    this.addToSaved('currentAction', {
        ...currentAction,
    });
});

Given('an {string} IAM Policy that {string} with {string} effect for the current API', async function (
    this: Zenko,
    doesExist: string,
    doesApply: string,
    isAllow: string,
) {
    const identityType = this.getSaved<string>('identityType') as EntityType;
    if (identityType === EntityType.ACCOUNT) {
        return;
    }
    // This step needs full access.
    Identity.resetIdentity();
    const authzConfiguration = getAuthorizationConfiguration(this);
    const action = this.getSaved<ActionPermissionsType>('currentAction');
    let effect = AuthorizationType.DENY;
    let resources;
    const applies = doesApply === 'applies';
    const bucketName = action.useWildCardBucketName ?
        '*' : this.getSaved<string>('bucketName');
    if (doesExist === 'existing') {
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
    const createdPolicy = await IAM.createPolicy({
        policyDocument: JSON.stringify(basePolicy),
        policyName: `policyforauthz-${Utils.randomString()}`,
    });
    const policyArn = extractPropertyFromResults<string>(createdPolicy, 'Policy', 'Arn');

    if (!policyArn) {
        throw new Error('Policy creation failed: no policy ARN');
    }

    if (identityType === EntityType.ASSUME_ROLE_USER
        || identityType === EntityType.ASSUME_ROLE_USER_CROSS_ACCOUNT
        || identityType === EntityType.DATA_CONSUMER) {
        const result = await IAM.attachRolePolicy({
            policyArn,
            roleName: this.getSaved<string>('identityNameForScenario'),
        });
        assert.ifError(result.stderr || result.err);
    }
    if (identityType === EntityType.IAM_USER) {
        const result = await IAM.attachUserPolicy({
            policyArn,
            userName: this.getSaved<string>('identityNameForScenario'),
        });
        assert.ifError(result.stderr || result.err);
    }
    this.useSavedIdentity();
});

Given('a policy granting full access to the objects and read access to the bucket', async function (this: Zenko) {
    Identity.resetIdentity();
    const authzConfiguration: AuthorizationConfiguration = {
        Identity: this.getSaved<AuthorizationConfiguration>('authzConfiguration')?.Identity
            || AuthorizationType.NO_RESOURCE,
        Resource: AuthorizationType.ALLOW,
    };
    const action = this.getSaved<ActionPermissionsType>('currentAction');
    if (writeOperationsOnABucket.includes(action.action)) {
        authzConfiguration.Resource = AuthorizationType.DENY;
    }
    this.addToSaved('authzConfiguration', authzConfiguration);
    const bucketName = this.getSaved<string>('bucketName');
    const identityType = this.getSaved<string>('identityType') as EntityType;
    const currentIdentityArn = this.getSaved<string>('identityArn');
    const accountId = currentIdentityArn.split(':')[4];
    let principal = `arn:aws:iam::${accountId}:root`;
    const resources = {
        bucket: `arn:aws:s3:::${bucketName}`,
        object: `arn:aws:s3:::${bucketName}/*`,
    };
    if (identityType === EntityType.ASSUME_ROLE_USER
        || identityType === EntityType.ASSUME_ROLE_USER_CROSS_ACCOUNT
        || identityType === EntityType.DATA_CONSUMER) {
        principal = '*';
    }
    const basePolicy = {
        ...preCreatedPolicies.fullAccess,
    };
    basePolicy.Statement[0].Principal.AWS = [principal];
    basePolicy.Statement[0].Resource = [resources.bucket];
    basePolicy.Statement[1].Principal.AWS = [principal];
    basePolicy.Statement[1].Resource = [resources.object];

    const result = await S3.putBucketPolicy({
        bucket: this.getSaved<string>('bucketName'),
        policy: JSON.stringify(basePolicy),
    });
    assert.ifError(result.stderr || result.err);
    this.useSavedIdentity();
});

Given('a condition for the bucket policy with {string} {string} {string} expecting {string}', function (
    this: Zenko,
    conditionVerb: string,
    conditionType: string,
    conditionValue: string,
    expect: string,
) {
    let conditionInPolicy: string | string[] = conditionValue;
    if (conditionValue.includes(',')) {
        conditionInPolicy = conditionValue.split(',');
    }
    const conditionForPolicy = {
        [conditionVerb]: {
            [conditionType]: conditionInPolicy,
        },
    };
    this.addToSaved('conditionForPolicy', conditionForPolicy);
    this.addToSaved('expectFromConditions', expect);
});

Given('a retention date set to {string} days', function (this: Zenko, retentionDays: string) {
    const currentDate = new Date();
    const targetDate = new Date(currentDate.getTime() + (parseInt(retentionDays, 10) * 24 * 60 * 60 * 1000));
    const retentionDate = targetDate.toISOString();
    this.addToSaved('retention', `Mode=GOVERNANCE,RetainUntilDate=${retentionDate}`);
});

Given('an {string} S3 Bucket Policy that {string} with {string} effect for the current API', async function (
    this: Zenko,
    doesExist: string,
    doesApply: string,
    isAllow: string,
) {
    const identityType = this.getSaved<string>('identityType') as EntityType;
    if (identityType === EntityType.ACCOUNT) {
        return;
    }
    // This step needs full access.
    Identity.resetIdentity();
    const authzConfiguration = getAuthorizationConfiguration(this);
    const action = this.getSaved<ActionPermissionsType>('currentAction');
    let effect = AuthorizationType.DENY;
    let resources;
    const applies = doesApply === 'applies';
    const bucketName = this.getSaved<string>('bucketName');
    if (doesExist === 'existing') {
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
    const expectFromConditions = this.getSaved<AuthorizationType>('expectFromConditions');
    if (expectFromConditions) {
        authzConfiguration.Resource = expectFromConditions;
    }
    this.addToSaved('authzConfiguration', authzConfiguration);
    const currentIdentityArn = this.getSaved<string>('identityArn');
    let principal = currentIdentityArn;
    if (identityType === EntityType.ASSUME_ROLE_USER
        || identityType === EntityType.ASSUME_ROLE_USER_CROSS_ACCOUNT
        || identityType === EntityType.DATA_CONSUMER) {
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
                Condition: {},
            },
        ],
    };
    const conditionForPolicy =
        this.getSaved<{ [key: string]: string | string[] }>('conditionForPolicy');
    if (conditionForPolicy) {
        basePolicy.Statement[0].Condition = conditionForPolicy;
    }
    const result = await S3.putBucketPolicy({
        bucket: this.getSaved<string>('bucketName'),
        policy: JSON.stringify(basePolicy),
    });
    assert.ifError(result.stderr || result.err);
    this.useSavedIdentity();
});

Given('an environment setup for the API', async function (this: Zenko) {
    const action = this.getSaved<ActionPermissionsType>('currentAction');
    if (!action.needsSetup) {
        return;
    }
    // Create an IAM policy with full S3 permission on any bucket
    // and attach it to the current identity
    Identity.resetIdentity();
    const basePolicy = {
        Version: '2012-10-17',
        Statement: [
            {
                Effect: 'Allow',
                Action: '*',
                Resource: '*',
            },
        ],
    };
    const createdPolicy = await IAM.createPolicy({
        policyDocument: JSON.stringify(basePolicy),
        policyName: `policyforauthz-${Utils.randomString()}`,
    });
    const policyArn = extractPropertyFromResults<string>(createdPolicy, 'Policy', 'Arn');

    if (!policyArn) {
        throw new Error('Policy creation failed: no policy ARN');
    }

    const identityType = this.getSaved<string>('identityType') as EntityType;
    if (identityType === EntityType.ASSUME_ROLE_USER
        || identityType === EntityType.ASSUME_ROLE_USER_CROSS_ACCOUNT
        || identityType === EntityType.DATA_CONSUMER) {
        const result = await IAM.attachRolePolicy({
            policyArn,
            roleName: this.getSaved<string>('identityNameForScenario'),
        });
        assert.ifError(result.stderr || result.err);
    } else if (identityType === EntityType.IAM_USER) { // accounts do not have any policy
        const result = await IAM.attachUserPolicy({
            policyArn,
            userName: this.getSaved<string>('identityNameForScenario'),
        });
        assert.ifError(result.stderr || result.err);
    }
    // Perform actions as the current user: some APIs require strict checks on the
    // initiator, so we do that for all APIs to reduce code complexity.
    this.useSavedIdentity();
    switch (action.action) {
    case 'CompleteMultipartUpload':
    case 'AbortMultipartUpload':
    case 'UploadPart':
        const objectKey = `multipartUpload-${Utils.randomString()}`;
        const initiateMPUResult = await S3.createMultipartUpload({
            bucket: this.getSaved<string>('bucketName'),
            key: objectKey,
        });
        assert.ifError(initiateMPUResult.stderr || initiateMPUResult.err);
        this.addToSaved('uploadId', extractPropertyFromResults<string>(initiateMPUResult, 'UploadId'));
        this.addToSaved('objectName', objectKey);
        break;
    case 'UploadPartCopy':
        // create an object to copy from
        const copyObjectKey = `objectforcopy-${Utils.randomString()}`;
        await putObject(this, copyObjectKey);
        this.addToSaved('objectName', copyObjectKey);
        // create an object for the MPU as copyObject
        const objectKeyCopy = `multipartUpload-${Utils.randomString()}`;
        const initiateMPUResultCopy = await S3.createMultipartUpload({
            bucket: this.getSaved<string>('bucketName'),
            key: objectKeyCopy,
        });
        assert.ifError(initiateMPUResultCopy.stderr || initiateMPUResultCopy.err);
        this.addToSaved('uploadId', extractPropertyFromResults<string>(initiateMPUResultCopy, 'UploadId'));
        this.addToSaved('copyObject', objectKeyCopy);
        break;
    case 'GetObjectLegalHold':
        const objectLegalHoldConfigResult = await S3.putObjectLegalHold({
            bucket: this.getSaved<string>('bucketName'),
            key: this.getSaved<string>('objectName'),
            legalHold: 'Status=ON',
        });
        assert.ifError(objectLegalHoldConfigResult.stderr || objectLegalHoldConfigResult.err);
        break;
    case 'GetObjectRetention':
        const objectRetentionResult = await S3.putObjectRetention({
            bucket: this.getSaved<string>('bucketName'),
            key: this.getSaved<string>('objectName'),
            retention: 'Mode=GOVERNANCE,RetainUntilDate=2080-01-01T00:00:00Z',
            bypassGovernanceRetention: 'true',
        });
        assert.ifError(objectRetentionResult.stderr || objectRetentionResult.err);
        break;
    case 'PutObjectRetention':
        this.addCommandParameter({ bypassGovernanceRetention: 'true' });
        break;
    case 'CreateMultipartUpload':
        this.addToSaved('objectName', `objectforbptests-${Utils.randomString()}`);
        this.addCommandParameter({ key: this.getSaved<string>('objectName') });
        break;
    default:
        break;
    }
    if (identityType === EntityType.ASSUME_ROLE_USER
        || identityType === EntityType.ASSUME_ROLE_USER_CROSS_ACCOUNT
        || identityType === EntityType.DATA_CONSUMER) {
        const result = await IAM.detachRolePolicy({
            policyArn,
            roleName: this.getSaved<string>('identityNameForScenario'),
        });
        assert.ifError(result.stderr || result.err);
    } else if (identityType === EntityType.IAM_USER) { // accounts do not have any policy
        const detachResult = await IAM.detachUserPolicy({
            policyArn,
            userName: this.getSaved<string>('identityNameForScenario'),
        });
        assert.ifError(detachResult.stderr || detachResult.err);
    }
    this.useSavedIdentity();
});

When('the user tries to perform the current S3 action on the bucket', async function (this: Zenko) {
    this.useSavedIdentity();
    const action = {
        ...this.getSaved<ActionPermissionsType>('currentAction'),
    };
    if (action.action === 'ListObjectVersions') {
        action.action = 'ListObjects';
        this.addToSaved('currentAction', action);
    }
    if (action.action.includes('Version') && !action.action.includes('Versioning')) {
        action.action = action.action.replace('Version', '');
        this.addToSaved('currentAction', action);
    }
    await runActionAgainstBucket(this, this.getSaved<ActionPermissionsType>('currentAction').action);
});

Then('the authorization result is correct', function (this: Zenko) {
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
    if (!isAllowed) {
        // special case: DeleteObjects always returns code 200
        // if the API is allowed but additional checks are denied.
        if (action.subAuthorizationChecks) {
            assert.strictEqual(this.getResult().stdout?.includes('AccessDenied') ||
                this.getResult().err?.includes('AccessDenied'), true);
        } else if (action.action === 'HeadObject' || action.action === 'HeadBucket') {
            // SDK return Unknown errors for HeadObject, but error code from
            // S3 is correct.
            assert.strictEqual(this.getResult().err?.includes('AccessDenied') ||
                this.getResult().err?.includes('403'), true);
        } else {
            assert.strictEqual(this.getResult().err?.includes('AccessDenied'), true);
        }
    } else {
        if (action.expectedResultOnAllowTest) {
            assert.strictEqual(
                this.getResult().err?.includes(action.expectedResultOnAllowTest) ||
                this.getResult().stdout?.includes(action.expectedResultOnAllowTest) ||
                this.getResult().err === null, true);
        } else {
            assert.strictEqual(this.getResult().err === null || this.getResult().err === undefined, true);
        }
    }
});
