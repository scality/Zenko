# Feature: Bucket Websites

#     @2.6.0
#     @PreMerge
#     @BucketWebsite
#     Scenario: Bucket Website CRUD
#         # The scenario should test that we can put a bucket website configuration on a bucket
#         # send an index.html
#         # The website endpoint is pre-configured in configure-e2e-ctst.sh (Rule 3: avoid service restarts during tests)
#         # Then using the local etc hosts, we should be able to load the html page
#         Given an existing bucket "website" "" versioning, "without" ObjectLock "without" retention mode
#         And an index html file
#         When the user puts the bucket website configuration
#         And the user creates an S3 Bucket policy granting public read access
#         Then the user should be able to load the index.html file from the "mywebsite.com" endpoint
