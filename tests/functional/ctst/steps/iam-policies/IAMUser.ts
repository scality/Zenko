import { Given } from '@cucumber/cucumber';
import { Identity } from 'cli-testing';
import {
    AttachGroupPolicyCommand,
    AttachRolePolicyCommand,
    AttachUserPolicyCommand,
    CreatePolicyCommand,
} from '@aws-sdk/client-iam';
import constants from 'common/constants';
import { randomString } from '../../common/utils';
import Zenko from 'world/Zenko';

Given('an IAM policy attached to the entity {string} with {string} effect to perform {string} {string} on {string}',
    async function (this: Zenko, entity: string, effect: string, service: string, action: string, resource: string) {
        Identity.resetIdentity();
        this.addToSaved('action', action);
        // create the IAM policy
        const policyArn = (await this.iam.send(new CreatePolicyCommand({
            PolicyName: `${constants.POLICY_NAME_TEST}${randomString()}`,
            PolicyDocument: JSON.stringify({
                Version: '2012-10-17',
                Statement: [
                    {
                        Effect: effect === 'Allow' ? 'Allow' : 'Deny',
                        Action: `${service}:${action}`,
                        Resource: resource,
                    },
                ],
            }),
        }))).Policy?.Arn;
        this.addToSaved('policyArn', policyArn);

        // attach the IAM policy to the entity
        if (entity === 'user') {
            await this.iam.send(new AttachUserPolicyCommand({
                PolicyArn: policyArn, UserName: this.getSaved<string>('userName') }));
        } else if (entity === 'role') {
            await this.iam.send(new AttachRolePolicyCommand({
                PolicyArn: policyArn, RoleName: this.getSaved<string>('roleName') }));
        } else if (entity === 'group') {
            await this.iam.send(new AttachGroupPolicyCommand({
                PolicyArn: policyArn, GroupName: this.getSaved<string>('groupName') }));
        }
        this.useSavedIdentity();
    });
