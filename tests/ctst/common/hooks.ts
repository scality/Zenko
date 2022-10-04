import { Before, AfterAll } from '@cucumber/cucumber';
import Zenko from '../world/Zenko';

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

export default worlds;
