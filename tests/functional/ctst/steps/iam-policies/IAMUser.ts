import { Given } from '@cucumber/cucumber';
import { Constants, Utils } from 'cli-testing';
import Zenko from 'world/Zenko';
import {
    AttachGroupPolicyCommand,
    AttachRolePolicyCommand,
    AttachUserPolicyCommand,
    CreatePolicyCommand,
} from '@aws-sdk/client-iam';

Given('an IAM policy attached to the entity {string} with {string} effect to perform {string} {string} on {string}',
    async function (this: Zenko, entity: string, effect: string, service: string, action: string, resource: string) {
        this.resetIdentity();
        this.addToSaved('action', action);

        const policyResult = await this.awsClients.iam.send(new CreatePolicyCommand({
            PolicyName: `${Constants.POLICY_NAME_TEST}${Utils.randomString()}`,
            PolicyDocument: JSON.stringify({
                Version: '2012-10-17',
                Statement: [{
                    Effect: effect === 'Allow' ? 'Allow' : 'Deny',
                    Action: `${service}:${action}`,
                    Resource: resource,
                }],
            }),
        }));
        const policyArn = policyResult.Policy?.Arn;
        if (!policyArn) {
            throw new Error('Policy creation failed: no policy ARN');
        }
        this.addToSaved('policyArn', policyArn);

        if (entity === 'user') {
            await this.awsClients.iam.send(new AttachUserPolicyCommand({
                PolicyArn: policyArn,
                UserName: this.getSaved<string>('userName'),
            }));
        } else if (entity === 'role') {
            await this.awsClients.iam.send(new AttachRolePolicyCommand({
                PolicyArn: policyArn,
                RoleName: this.getSaved<string>('roleName'),
            }));
        } else if (entity === 'group') {
            await this.awsClients.iam.send(new AttachGroupPolicyCommand({
                PolicyArn: policyArn,
                GroupName: this.getSaved<string>('groupName'),
            }));
        }
        this.useSavedIdentity();
    });
