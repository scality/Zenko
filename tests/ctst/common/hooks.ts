import {
    Before,
    defineParameterType,
    Given,
    setParallelCanAssign,
    parallelCanAssignHelpers,
} from '@cucumber/cucumber';
import Zenko, { EntityType } from '../world/Zenko';
// HTTPS should not cause any error for CTST
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

const { atMostOnePicklePerTag } = parallelCanAssignHelpers;
const noParallelRun = atMostOnePicklePerTag(['@AzureArchive', '@Dmf', '@AfterAll']);

setParallelCanAssign(noParallelRun);

Before(async function (this: Zenko) {
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

Given('a service user {string} assuming the role {string} of an internal service account',
    async function (this: Zenko, serviceUserName: string, roleName: string) {
        await this.prepareServiceUser(serviceUserName, roleName, true);
        this.addToSaved('type', EntityType.ASSUME_ROLE_USER);
    });

Given('a service user {string} assuming the role {string} of a user account',
    async function (this: Zenko, serviceUserName: string, roleName: string) {
        await this.prepareServiceUser(serviceUserName, roleName);
        this.addToSaved('type', EntityType.ASSUME_ROLE_USER);
    });

export default Zenko;
