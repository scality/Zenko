describe('Bucket', () => {
    describe('creation', () => {
        const accountName = 'bucket_spec_1';
        const bucketName = 'bucket1';
        beforeEach(() => {
            cy.kcLogin();
            cy.createAccount(accountName);
        });

        it('should create a bucket', () => {
            cy.createBucket(bucketName);

            cy.location('pathname').should('eq', `/buckets/${bucketName}`);
            cy.get('table tbody tr').should('have.length', 1);
            cy.get('table tbody tr').contains(bucketName).should('be.visible');
        });

        afterEach(() => {
            cy.deleteBucket(bucketName);
            cy.deleteAccount(accountName);
            cy.kcLogout();
        });
    });
});
