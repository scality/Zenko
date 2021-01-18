Cypress.Commands.add('kcLogin', (username, password) => {
    Cypress.log({ name: 'keycloak login' });

    const kcUsername =  username || Cypress.env('KEYCLOAK_USERNAME');
    const kcPassword = password || Cypress.env('KEYCLOAK_PASSWORD');
    const kcRoot = Cypress.env('KEYCLOAK_ROOT');
    const kcRealm = Cypress.env('KEYCLOAK_REALM');
    const kcClientID = Cypress.env('KEYCLOAK_CLIENT_ID');

    if (!kcUsername || !kcPassword || !kcRoot || !kcRealm || !kcClientID) {
        throw new Error('missing CYPRESS_KEYCLOAK_USERNAME, CYPRESS_KEYCLOAK_PASSWORD, CYPRESS_KEYCLOAK_ROOT, CYPRESS_KEYCLOAK_REALM or CYPRESS_KEYCLOAK_CLIENT_ID environment variable');
    }

    const getStartBody = {
        url: `${kcRoot}/auth/realms/${kcRealm}/protocol/openid-connect/auth`,
        followRedirect: false,
        qs: {
            scope: 'openid',
            response_type: 'code',
            approval_prompt: 'auto',
            redirect_uri: `${Cypress.config('baseUrl')}/login/callback`,
            client_id: kcClientID,
        },
    };
    return cy.request(getStartBody).then(response => {
        const html = document.createElement('html');
        html.innerHTML = response.body;

        const form = html.getElementsByTagName('form')[0];
        const url = form.action;
        const postLoginBody = {
            method: 'POST',
            url,
            followRedirect: false,
            form: true,
            body: {
                username: kcUsername,
                password: kcPassword,
            },
        };
        return cy.request(postLoginBody);
    });
});

Cypress.Commands.add('kcLogout', () => {
    Cypress.log({ name: 'keycloak logout' });

    const kcRoot = Cypress.env('KEYCLOAK_ROOT');
    const kcRealm = Cypress.env('KEYCLOAK_REALM');

    if (!kcRoot || !kcRealm) {
        throw new Error('missing CYPRESS_KEYCLOAK_ROOT and/or CYPRESS_KEYCLOAK_REALM environment variable');
    }

    cy.clearSession();
    return cy.request({
        url: `${kcRoot}/auth/realms/${kcRealm}/protocol/openid-connect/logout`,
    });
});

Cypress.Commands.add('clearSession', () => {
    Cypress.log({ name: 'Clear Session' });
    cy.window().then(window => window.sessionStorage.clear());
});
