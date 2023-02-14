import { Given, setDefaultTimeout } from '@cucumber/cucumber';
import { Constants, IAM, Utils } from 'cli-testing';

setDefaultTimeout(Constants.DEFAULT_TIMEOUT);

/**
 * Policy are using ARN, not names. This helper will dynamically extract a policy
 * ARN from a CLI result
 * @param {object} results - results from the command line
 * @return {string} - the policy arn, or null if an error occured when
 * parsing results.
 */
function extractPolicyArnFromResults(results: any) {
    try {
        if (results.stdout) {
            return JSON.parse(results.stdout).Policy.Arn;
        }
        return null;
    } catch (err) {
        return null;
    }
}

Given('an IAM policy attached to the entity {string} with {string} effect to perform {string} on {string}', async function (entity: string, effect: string, action: string, resource: string) {
    this.cleanupEntity();
    this.resetCommand();
    this.saved.action = action;
    // create the IAM policy
    this.addCommandParameter({policyName: `${Constants.POLICY_NAME_TEST}${Utils.randomString()}`});
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
        })
    });
    this.saved.policyArn = extractPolicyArnFromResults(await IAM.createPolicy(this.getCommandParameters()));

    // attach the IAM policy to the user
    this.resetCommand();
    this.addCommandParameter({ policyArn: this.saved.policyArn });
    if (entity === 'user') {
        this.addCommandParameter({ userName: this.parameters.IAMUserName });
        await IAM.attachUserPolicy(this.getCommandParameters());
    } else if (entity === 'role') {
        this.addCommandParameter({ roleName: this.saved.roleName });
        await IAM.attachRolePolicy(this.getCommandParameters());
    } else if (entity === 'group') {
        this.addCommandParameter({ groupName: this.saved.groupName });
        await IAM.attachGroupPolicy(this.getCommandParameters());
    }
});
