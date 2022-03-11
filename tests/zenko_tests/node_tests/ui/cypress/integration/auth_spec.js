describe('Authentication with keycloak', () => {
    describe('User authenticated', () => {
        beforeEach(cy.kcLogin);

        it(`should render user full name: ${Cypress.env('KEYCLOAK_USER_FULLNAME')}`, () => {
            const kcUserFullname = Cypress.env('KEYCLOAK_USER_FULLNAME');
            if (!kcUserFullname) {
                throw new Error('missing CYPRESS_KEYCLOAK_USER_FULLNAME environment variable');
            }

            cy.visit('/');
            cy.get('.sc-navbar').should('exist');
            cy.get('.sc-navbar').should('contain', kcUserFullname);
        });

        afterEach(cy.kcLogout);
    });

    describe('User not authenticated', () => {
        it('should not render user name', () => {
            cy.visit('/');
            cy.get('.sc-navbar').should('not.exist');
            cy.url();
        });
    });
});
