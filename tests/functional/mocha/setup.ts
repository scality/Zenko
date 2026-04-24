import { initConfig } from '../tests_common/configuration';

export const mochaHooks = {
    beforeAll: () => initConfig(),
};
