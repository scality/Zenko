import { Before, AfterAll, defineParameterType, Given } from '@cucumber/cucumber';
import Zenko, { EntityType } from '../world/Zenko';

// HTTPS should not cause any error for CTST
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

const worlds : any = {
    ZENKO: Zenko,
};

Before(async function () {
    await worlds[process.env.MODE ?? 'ZENKO'].init(this.parameters);
});

AfterAll(async function () {
    await worlds[process.env.MODE ?? 'ZENKO'].teardown();
});

defineParameterType({
    name: 'type',
    regexp: /(.*)/,
    transformer: s => <keyof typeof EntityType> s,
});

Given('a {type} type', async function (type) {
    await this.setupEntity(type);
});

Given('a {string} AssumeRole user', async function (crossAccount: string) {
    await this.prepareAssumeRole(crossAccount === 'cross account');
    this.saved.type = EntityType.ASSUME_ROLE_USER;
});

Given('a service user {string} assuming the role {string} of an internal service account', async function (serviceUserName: string, roleName: string) {
    await this.prepareServiceUser(serviceUserName, roleName, true);
    this.saved.type = EntityType.ASSUME_ROLE_USER;
});

Given('a service user {string} assuming the role {string} of a user account', async function (serviceUserName: string, roleName: string) {
    await this.prepareServiceUser(serviceUserName, roleName);
    this.saved.type = EntityType.ASSUME_ROLE_USER;
});

export default worlds;
