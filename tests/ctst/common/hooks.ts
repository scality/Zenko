import { AfterAll, Before, defineParameterType, Given } from '@cucumber/cucumber';
import Zenko, { EntityType } from '../world/Zenko';
// HTTPS should not cause any error for CTST
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

Before(async function () {
    await Zenko.init(this.parameters);
});


defineParameterType({
    name: 'type',
    regexp: /(.*)/,
    transformer: s => <keyof typeof EntityType> s,
});

Given('a {type} type', async function (this: Zenko, type: string) {
    await this.setupEntity(type);
});

Given('a {string} AssumeRole user', async function (this: Zenko, crossAccount: string) {
    await this.prepareAssumeRole(crossAccount === 'cross account');
    this.addToSaved('type', EntityType.ASSUME_ROLE_USER);
});

Given('a service user {string} assuming role {string}',
    async function (this: Zenko, serviceUserName: string, roleName: string) {
        await this.prepareServiceUser(serviceUserName, roleName);
        this.addToSaved('type', EntityType.ASSUME_ROLE_USER);
    });

export default Zenko;
