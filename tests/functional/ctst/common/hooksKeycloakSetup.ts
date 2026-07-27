import { BeforeAll, HookTarget } from '@cucumber/cucumber';
import * as Werelogs from 'werelogs';
import Keycloak from 'steps/utils/keycloak';

BeforeAll({ name: 'keycloak setup', on: HookTarget.COORDINATOR }, async function (this) {
    const logger = new Werelogs.Logger('KeycloakSetup').newRequestLogger();

    if (process.env.SEED_KEYCLOAK_DEFAULT_ROLES !== 'true') {
        logger.info('Skipping Keycloak setup');
        return;
    }

    logger.info('Starting Keycloak setup');
    const host = process.env.KEYCLOAK_TEST_HOST;
    const realm = process.env.KEYCLOAK_REALM;
    if (!host || !realm) {
        throw new Error('KEYCLOAK_TEST_HOST and KEYCLOAK_REALM not set for keycloak setup');
    }
    const keycloakSeeder = new Keycloak({
        host,
        realm,
        username: process.env.KEYCLOAK_ADMIN_USERNAME || 'admin',
        password: process.env.KEYCLOAK_ADMIN_PASSWORD || 'password',
        clientId: process.env.KEYCLOAK_ADMIN_CLIENT_ID || 'admin-cli',
    }, logger);
    await keycloakSeeder.seedKeycloakWithDefaultRoles();
    logger.info('Keycloak setup completed successfully');
});
