describe('Object', () => {
    describe('creation', () => {
        const accountName = 'object_spec_1';
        const bucketName = 'mybucket6';
        const smallFileName = 'fivehundredandtwelvekb';
        const unicodeFileName = 'éléphant.txt';
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

        it('should upload an object with an escaped name to a bucket', () => {
            cy.uploadObject(bucketName, unicodeFileName);
            cy.get('table tbody tr').should('have.length', 1);
            cy.get('table tbody tr').contains(unicodeFileName).should('be.visible');
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
