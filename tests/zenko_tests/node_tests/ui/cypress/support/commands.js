import 'cypress-file-upload';

Cypress.Commands.add('kcLogin', (username, password) => {
    Cypress.log({ name: 'keycloak login' });

    const kcUsername = username || Cypress.env('KEYCLOAK_USERNAME');
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

Cypress.Commands.add('createAccount', (accountName) => {
    Cypress.log({ name: `Create Account: ${accountName}` });
    cy.visit('/create-account');
    cy.get('input#name').type(accountName);
    cy.get('input#email').type('my@email.ok');
    cy.get('button#create-account-btn').click();
});

Cypress.Commands.add('deleteAccount', (accountName) => {
    Cypress.log({ name: `Delete Account: ${accountName}` });
    cy.visit('/accounts');
    cy.get('#account-list tbody').contains('tr', accountName).should('be.visible');
    cy.get('#account-list tbody').contains('tr', accountName).click();
    cy.get('button').contains('Delete Account').click();
    cy.get('.sc-modal-content button').contains('Delete').click();
});

Cypress.Commands.add('createBucket', (bucketName) => {
    Cypress.log({ name: `Create Bucket: ${bucketName}` });
    cy.visit('/create-bucket');
    cy.get('input#name').type(bucketName);
    cy.get('button').contains('Create').click();
});

Cypress.Commands.add('deleteBucket', (bucketName) => {
    Cypress.log({ name: `Delete Bucket: ${bucketName}` });
    cy.visit('/buckets');
    cy.get('table tbody').contains('tr', bucketName).should('be.visible');
    cy.get('table tbody').contains('tr', bucketName).click();
    cy.get('button').contains('Delete Bucket').click();
    cy.get('.sc-modal-content button').contains('Delete').click();
});

Cypress.Commands.add('uploadObject', (bucketName, fileName) => {
    Cypress.log({ name: `Upload object "${fileName}" to bucket "${bucketName}"` });
    cy.visit(`/buckets/${bucketName}/objects`);
    cy.get('button').contains('Upload').click();
    cy.get('input.object-upload-drop-zone-input')
        .attachFile(fileName);
    cy.get('#object-upload-upload-button').click();
    cy.intercept({
        method: 'POST',
        url: `/s3/${bucketName}/${fileName}`,
        query: {
            uploadId: /.*/,
        },
    }).as('mpu');
    cy.wait('@mpu');
});

Cypress.Commands.add('deleteObject', (bucketName, fileName) => {
    Cypress.log({ name: `Delete object "${fileName}" in bucket "${bucketName}"` });
    cy.visit(`/buckets/${bucketName}/objects`);
    cy.get('table tbody').contains('tr', fileName).should('be.visible');
    cy.get('table tbody').contains('tr', fileName).click();
    cy.get('button#object-list-delete-button').click();
    cy.get('.sc-modal-content button').contains('Delete').click();
});
