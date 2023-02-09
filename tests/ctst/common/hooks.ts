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
    await this.prepareForType(type);
});

export default worlds;
