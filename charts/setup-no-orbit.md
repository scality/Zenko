# Setup without Zenko Orbit Support

This guide will cover how to setup Zenko with user-defined cloud backends and
replication backends without using Zenko Orbit.

## Location Constraints Setup

To setup and use user-defined cloud backends as location constraints and/or
replication sites, Orbit must be disabled in the Zenko
[values.yaml](./zenko/values.yaml) file.

### Adding Cloud Backends

To add a cloud backend, you will have to edit the `locationConstraints`
value for the `cloudserver-front` in your Zenko `values.yaml` file.

** Note: ** default location `us-east-1` must be set when defining
`locationConstraints`

```
  cloudserver-front:
    (...)
    locationConstraints:
      us-east-1:
        type: file
        legacyAwsBehavior: true
```

## Replication Setup

To setup replication with user-defined locations and sites, you will need to
disable Orbit for both the `cloudserver-front` and `backbeat` services. These
configuration can be found in the Zenko [values.yaml](./zenko/values.yaml)
file.

### Adding Replication Sites in Cloudserver

To add replication sites in Cloudserver, you will need to first define all
the site information as location constraints, and, once those are defined,
you can use the locations as sites by modifying the `replicationEndpoints`
value for `cloudserver-front` in your Zenko `values.yaml` file.

In this examples, the locations `awsbackend`, `azurebackend`, and `gcpbackend`
are set up as a locations in Cloudserver.

```
  cloudserver-front:
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

### Adding Replication Sites in Backbeat

To add replication sites in Backbeat, like the replication site setup in
Cloudserver, the location constraints must first be defined. With the locations
set up, you can add replication sites to the `backbeat` service by modifying
the `bootstrapList` section of the config in your Zenko `values.yaml` file.

** Note: ** the sites listed for both the `cloudserver-front` and `backbeat`
services should be identical, as not doing so will cause undesirable behaviors

```
  cloudserver-front:
    orbit:
      enabled: false
    (...)
    locationConstraints:
      (...)
    replicationEndpoint:
      - {{ site-1 }}
      - {{ site-2 }}
      (...)
  backbeat:
    orbit:
      enabled: false
    (...)
    bootstrapList:
      - name: {{ site-1 }}
        type: {{ site-1-type }}
      - name: {{ site-2 }}
        type: {{ site-2-type }}
    (...)
```

#### Granting Backbeat Permissions to Cloudserver

In order for Backbeat to perform the necessary tasks for replication, it will
need permission to access Cloudserver. To grant Backbeat permissions to
Cloudserver, you can add the s3 credentials to the `s3Accounts` config in
`backbeat` section of the Zenko `values.yaml`.

`backbeat.s3Accounts` configurables:

```
  s3Accounts:
    - name: {{ account-name }}
      keyId: {{ access-key }}
      secretKey: {{ secret-key }}
    - (...)
```

** Note: ** PoC only - `backbeat` uses `cloudserver-front` deployment specific
credentials to access Cloudserver

## Example

The following will show an example of configure the location constraints and
replication sites for the `cloudserver-front` and `backbeat` services.

In the file [Zenko/values.yaml](./zenko/values.yaml):

+ Configure `cloudserver-front` values:

    - Set `orbit.enabled` to `false`:

      ```
         cloudserver-front:
           orbit:
             enabled: false
      ```

    - Set `credentials.keyId` and `credentials.secretKey`:

      ```
        cloudserver-front:
          orbit: (...)
          credentials:
            keyId: deployment-specific-access-key
            secretKey: deployment-specific-secret-key
      ```

    - Add Cloudserver compatible backends in `locationConstraints`:

      In this example, our backend is named `cloud-backend` with the endpoint
      `aws.endpoint.com` and uses the bucket `zenko-bucket`

      ```
        cloudserver-front:
          orbit: (...)
          credentials: (...)
          locationConstraints:
            us-east-1:
              type: file
              legacyAwsBehavior: true
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

      ```
        cloudserver-front:
          orbit: (...)
          credentials: (...)
          locationConstraints:
            us-east-1: (...)
            cloud-backend: (...)
          replicationEndpoints:
            - cloud-backend
      ```

+ Configure `backbeat` values:

    - Set `orbit.enabled` to `false`:

      ```
         backbeat:
           orbit:
             enabled: false
      ```

    - Add replication sites under `bootstrapList`:

      Using the configurations from the steps above in `cloudserver-front`

      ```
        backbeat:
          orbit: (...)
          bootstrapList:
            - site: cloud-backend
              type: aws_s3
      ```

    - Add `cloudserver-front` credentials as an account under `s3Accounts`:

      Add an account in Backbeat with the name `Replication` and with
      `cloudserver-front.credentials`

      ```
        backbeat:
          orbit: (...)
          bootstrapList: (...)
          s3Accounts:
            - name: Replication
              keyId: deployment-specific-access-key
              secretKey: deployment-specific-secret-key
      ```

With these configuration set, `cloud-backend` can now be used as a location
constraint and replication site.

<!--
```
  cloudserver-front:
    orbit:
      enabled: false
    credentials:
      keyId: deployment-specific-access-key
      secretKey: deployment-specific-secret-key
    locationConstraints:
      us-east-1:
        type: file
        legacyAwsBehavior: true
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
  backbeat:
    orbit: false
    bootstrapList:
      - site: awsbackend
        type: aws_s3
      - site: azurebackend
        type: azure
      - site: gcpbackend
        type: gcp
    s3Accounts:
      - name: Replication
        keyId: deployment-specific-access-key
        secretKey: deployment-specific-secret-key
```
 -->

<!---
#### AWS S3 as a cloud backend

AWS S3 location configurables:

```
  cloudserver-front:
    orbit:
      enabled: false
    (...)
    locationConstraints:
      (...)
      awsbackend:
        type: aws_s3
        legacyAwsBehavior: {{ true | false }}
        details:
          bucketMatch: {{ true | false }}
          https: {{ true | false }}
          serverSideEncryption: {{ true | false }}
          awsEndpoint: s3.amazonaws.com
          bucketName: {{ aws-bucket-name }}
          credentials:
            accessKey: {{ aws-access-key }}
            secretKey: {{ aws-secret-key }}
      (...)
```

#### Microsoft Azure as a cloud backend

Azure location configurables:

```
  cloudserver-front:
    orbit:
      enabled: false
    (...)
    locationconstraints:
      (...)
      azurebackend:
        type: azure
        legacyawsbehavior: {{ true | false }}
        details:
          bucketmatch: {{ true | false }}
          azurestorageendpoint: {{ azure-storage-endpoint }}
          azurestorageaccountname: {{ azure-storage-account-name }}
          azurestorageaccesskey: {{ azure-storage-access-key }}
          azurecontainername: {{ azure-container-name }}
      (...)
```

#### Google Cloud Storage as a cloud backend

GCP location configurables:

```
  cloudserver-front:
    orbit:
      enabled: false
    (...)
    locationConstraints:
      (...)
      gcpbackend:
        type: gcp
        legacyAwsBehavior: {{ true | false }}
        details:
          bucketMatch: {{ true | false }}
          https: {{ true | false }}
          gcpEndpoint: storage.googleapis.com
          bucketName: {{ gcp-bucket-name }}
          mpuBucketName: {{ gcp-mpu-bucket-name }}
          credentials:
            accessKey: {{ gcp-access-key }}
            secretKey: {{ gcp-secret-key }}
      (...)
```
 -->