import { populateParameters } from '../tests_common/configuration.js';

export const mochaHooks = {
    beforeAll: async () => {
        await populateParameters();
    },
};
