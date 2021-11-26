describe('Account', () => {
    describe('creation', () => {
        const accountName = 'account_spec_1';
        beforeEach(cy.kcLogin);

        it('should create an account', () => {
            cy.createAccount(accountName);

            cy.location('pathname').should('eq', `/accounts/${accountName}`);
            cy.get('#account-list tbody tr').contains(accountName).should('be.visible');
        });

        afterEach(() => {
            cy.deleteAccount(accountName);
            cy.kcLogout();
        });
    });
});
