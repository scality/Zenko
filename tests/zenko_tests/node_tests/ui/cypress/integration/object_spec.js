describe('Object', () => {
    describe('creation', () => {
        const accountName = 'account2';
        const bucketName = 'mybucket3';
        const fileName = 'fifteenmb';
        beforeEach(() => {
            cy.kcLogin();
            cy.createAccount(accountName);
            cy.createBucket(bucketName);
        });

        it('should upload object to a bucket', () => {
            cy.uploadObject(bucketName, fileName);
            cy.get('table tbody tr').should('have.length', 1);
            cy.get('table tbody tr').contains(fileName).should('be.visible');
        });

        afterEach(() => {
            cy.deleteObject(bucketName, fileName);
            cy.deleteBucket(bucketName);
            cy.deleteAccount(accountName);
            cy.kcLogout();
        });
    });
});
