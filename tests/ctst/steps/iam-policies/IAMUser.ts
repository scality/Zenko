import { Given, setDefaultTimeout } from '@cucumber/cucumber';
import { Constants, IAM, Utils } from 'cli-testing';
import { extractPropertyFromResults } from '../../common/utils';
import Zenko from 'world/Zenko';

setDefaultTimeout(Constants.DEFAULT_TIMEOUT);

Given('an IAM policy attached to the entity {string} with {string} effect to perform {string} on {string}',
    async function (this: Zenko, entity: string, effect: string, action: string, resource: string) {
        this.cleanupEntity();
        this.resetCommand();
        this.addToSaved('action', action);
        // create the IAM policy
        this.addCommandParameter({ policyName: `${Constants.POLICY_NAME_TEST}${Utils.randomString()}` });
        this.addCommandParameter({
            policyDocument: JSON.stringify({
                Version: '2012-10-17',
                Statement: [
                    {
                        Effect: effect === 'Allow' ? 'Allow' : 'Deny',
                        Action: `s3:${action}`,
                        Resource: `arn:aws:s3:::${resource}`,
                    },
                ],
            }),
        });
        this.addToSaved('policyArn',
            extractPropertyFromResults(await IAM.createPolicy(this.getCommandParameters()), 'Policy', 'Arn'));

        // attach the IAM policy to the user
        this.resetCommand();
        this.addCommandParameter({ policyArn: this.getSaved<string>('policyArn') });
        if (entity === 'user') {
            this.addCommandParameter({ userName: this.getSaved<string>('userName') });
            await IAM.attachUserPolicy(this.getCommandParameters());
        } else if (entity === 'role') {
            this.addCommandParameter({ roleName: this.getSaved<string>('roleName') });
            await IAM.attachRolePolicy(this.getCommandParameters());
        } else if (entity === 'group') {
            this.addCommandParameter({ groupName: this.getSaved<string>('groupName') });
            await IAM.attachGroupPolicy(this.getCommandParameters());
        }
    });
