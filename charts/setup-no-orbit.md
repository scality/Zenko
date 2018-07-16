# Setup without Zenko Orbit

This guide will cover how to setup Zenko with user-defined cloud backends and
replication backends without using Zenko Orbit.

## Location Constraints Setup

To setup and use user-defined cloud backends as location constraints and/or
replication sites, Orbit must be disabled in the Zenko
[values.yaml](./zenko/values.yaml) file.

### Adding Cloud Backends

To add a cloud backend, you will have to edit the `locationConstraints`
value for `global` in your Zenko `values.yaml` file.

```yaml
global:
  locationConstraints:
    (...)
```

### Adding Replication Sites

To add replication sites, you will need to first define all
the site information as location constraints, and, once those are defined,
you can use the locations as sites by modifying the `replicationEndpoints`
value for `global` in your Zenko `values.yaml` file.

In this examples, the locations `awsbackend`, `azurebackend`, and `gcpbackend`
are set up as a locations for Zenko.

```yaml
global:
  orbit:
    enabled: false
  (...)
  locationConstraints:
    awsbackend: (...)
    azurebackend: (...)
    gcpbackend: (...)
  replicationEndpoints:
    - awsbackend
    - azurebackend
    - gcpbackend
```

## Example

The following will show an example of configure the location constraints and
replication sites for Zenko.

In the file [Zenko/values.yaml](./zenko/values.yaml):

+ Configure `global` values:

    - Set `orbit.enabled` to `false`:

      ```yaml
         global:
           orbit:
             enabled: false
      ```

    - Add Cloudserver compatible backends in `locationConstraints`:

      In this example, our backend is named `cloud-backend` with the endpoint
      `aws.endpoint.com` and uses the bucket `zenko-bucket`

      ```yaml
        global:
          orbit: (...)
          locationConstraints:
            cloud-backend:
              type: aws_s3
              legacyAwsBehavior: true
              details:
                bucketMatch: true
                https: true
                awsEndpoint: aws.endpoint.com
                bucketName: zenko-bucket
                credentials:
                  accessKey: WHDBFKILOSDDVF78NPMQ
                  secretKey: 87hdfGCvDS+YYzefKLnjjZEYstOIuIjs/2X72eET
      ```

    - Add locations as sites under `replcitionEndpoints`:

      With `cloud-backend` defined in `locationConstraints`

      ```yaml
        global:
          orbit: (...)
          locationConstraints:
            cloud-backend: (...)
          replicationEndpoints:
            - cloud-backend
      ```

    - Set one or more users for cloudserver:

      ```yaml
        cloudserver:
          users:
            accountname:
              access: deployment-specific-access-key
              secret: deployment-specific-secret-key
      ```

      These are necessary to access cloudserver when orbit is disabled.

With these configurations set, `cloud-backend` can now be used as a location
constraint and replication site.

## Example with 3 different backends

```yaml
  global:
    orbit:
      enabled: false
    locationConstraints:
      awsbackend:
        type: aws_s3
        legacyAwsBehavior: true
        details:
          bucketMatch: true
          https: true
          awsEndpoint: s3.amazonaws.com
          bucketName: awsBucketName
          credentials:
            accessKey: WHDBFKILOSDDVF78NPMQ
            secretKey: 87hdfGCvDS+YYzefKLnjjZEYstOIuIjs/2X72eET
      azurebackend:
        type: azure
        legacyAwsBehavior: true
        details:
          bucketMatch: true
          azureStorageEndpoint: https://azure-account-name.blob.core.windows.net/
          azureStorageAccountName: azure-account-name
          azureStorageAccessKey: auhyDo8izbuU4aZGdhxnWh0ODKFP3IWjsN1UfFaoqFbnYzPj9bxeCVAzTIcgzdgqomDKx6QS+8ov8PYCON0Nxw==
          azureContainerName: azure-container
      gcpbackend:
        type: gcp
        legacyAwsBehavior: true
        details:
          bucketMatch: true
          https: true
          gcpEndpoint: storage.googleapis.com
          bucketName: gcpBucketName
          mpuBucketName: gcpMpuBucketName
          credentials:
            accessKey: GOOGFKILOSDDVF78NPMQ
            secretKey: 87hdfGCvDS+YYzefKLnjjZEYstOIuIjs/2X72eET
    replicationEndpoints:
      - awsbackend
      - azurebackend
      - gcpbackend

  cloudserver:
    endpoint: zenko.local
    users:
      accountname:
        access: deployment-specific-access-key
        secret: deployment-specific-secret-key
```
