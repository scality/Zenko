Feature: Bucket Websites

    @2.6.0
    @PreMerge
    @BucketWebsite
    Scenario Outline: Bucket Website CRUD
        # The scenario should test that we can put a bucket website configuration on a bucket
        # send an index.html
        # Then using the local etc hosts, we should be able to load the html page
        # The mywebsite.com endpoint is pre-configured in configure-e2e-ctst.sh to avoid triggering reconciliation
        Given an existing bucket "website" "" versioning, "without" ObjectLock "without" retention mode
        And an index html file
        When the user puts the bucket website configuration
        And the user creates an S3 Bucket policy granting public read access
        And the "<domain>" endpoint is present in the overlay
        Then the user should be able to load the index.html file from the "<domain>" endpoint

        Examples:
            |        domain |
            | mywebsite.com |
