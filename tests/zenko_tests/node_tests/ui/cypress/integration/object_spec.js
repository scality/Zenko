describe('Object', () => {
    describe('creation', () => {
        const accountName = 'account2';
        const bucketName = 'mybucket6';
        const smallFileName = 'fivehundredandtwelvekb';
        const mpuFileName = 'fifteenmb';

        beforeEach(() => {
            cy.kcLogin();
            cy.createAccount(accountName);
            cy.createBucket(bucketName);
        });

        it('should upload a small object to a bucket (512 kb)', () => {
            cy.uploadObject(bucketName, smallFileName);
            cy.get('table tbody tr').should('have.length', 1);
            cy.get('table tbody tr').contains(smallFileName).should('be.visible');
        });

        it('should multipart upload an object to a bucket (15 mb)', () => {
            cy.uploadObject(bucketName, mpuFileName);
            cy.get('table tbody tr').should('have.length', 1);
            cy.get('table tbody tr').contains(mpuFileName).should('be.visible');
        });

        afterEach(() => {
            cy.deleteObjects(bucketName);
            cy.deleteBucket(bucketName);
            cy.deleteAccount(accountName);
            cy.kcLogout();
        });
    });
});
