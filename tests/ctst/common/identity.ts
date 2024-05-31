import {
    defineParameterType,
    Given,
} from '@cucumber/cucumber';
import Zenko, { EntityType } from 'world/Zenko';

defineParameterType({
    name: 'type',
    regexp: /(.*)/,
    transformer: s => <keyof typeof EntityType>s,
});

Given('a {type} type', async function (this: Zenko, type: string) {
    await this.setupEntity(type);
});

Given('a {string} AssumeRole user', async function (this: Zenko, crossAccount: string) {
    await this.prepareAssumeRole(crossAccount === 'cross account');
});

Given('a service user {string} assuming the role {string} of an internal service account',
    async function (this: Zenko, serviceUserName: string, roleName: string) {
        await this.prepareServiceUser(serviceUserName, roleName, true);
    });

Given('a service user {string} assuming the role {string} of a user account',
    async function (this: Zenko, serviceUserName: string, roleName: string) {
        await this.prepareServiceUser(serviceUserName, roleName);
    });
