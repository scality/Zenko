` <>`__\ Configuring S3 Vault HTTPS Certificates
------------------------------------------------

HTTPS can be optionally configured for both service and backend
interfaces at S3 Vault and S3 Metadata.

A correct HTTPS configuration must include at least a certificate and a
private key file for every server (Take care to ensure that different
sets of HTTPS files are not used for different target servers.) It is
highly recommended that the certificates be signed by a well known
certification authority (CA), in which case the CA’s certificate file
can also be provided.

When using the HTTPS certification to deploy Vault with SAML, add
certificate\_file and private\_key\_file from a trusted CA. This is not
required if the default configuration is used for making HTTP
connections to the Vault.

.. raw:: html

   <div style="page-break-after: avoid;">

The path to the certificates is defined in
env/server-pool-1/group\_vars/all as:

::

    cert_filepaths:
      key: {{path to private_key_file}}
      cert: {{path to certificate_file}}

.. raw:: html

   </div>

.. raw:: html

   <div style="page-break-inside: avoid;">

.. rubric:: Example: HTTPS Configuration Section
   :name: example-https-configuration-section

::

    cert_filepaths:
      ca: {{CA's certificate filepath in target server, OPTIONAL}}
      cert: {{certificate filepath in target server}}
      key: {{private key filepath in target server}}

.. note:: Filepath refers to the location of files in the target server,
so files must be installed in the same path in all servers beforehand.

.. raw:: html

   </div>

.. raw:: html

   <div style="page-break-inside: avoid;">

.. rubric:: Example: Command Chain for Obtaining a Self-Signed
   Certificate
   :name: example-command-chain-for-obtaining-a-self-signed-certificate

::

    $ openssl genrsa -out ca.key 2048

    $ openssl req -new -x509 -extensions v3_ca -key ca.key -out ca.crt -days 99999 -subj "/C=US/ST=Country/L=City/O=Organization/CN={{TEST_HOSTNAME}}"

    $ openssl genrsa -out test.key 2048

    $ openssl req -new -key test.key -out test.csr -subj "/C=US/ST=Country/L=City/O=Organization/CN=*.{{TEST_HOSTNAME}}"

    $ openssl x509 -req -in test.csr -CA ca.crt -CAkey ca.key -CAcreateserial -out test.crt -days 99999 -sha256

.. raw:: html

   </div>

.. raw:: html

   <div>

.. rubric:: ` <>`__\ Setting the Leader Site for a Stretched Two-Site
   RING
   :name: setting-the-leader-site-for-a-stretched-two-site-ring

If the minority of the Metadata servers is listed in the inventory file
as being on site\_a, uncomment the following line in the
/group\_vars/all template.

::

    # env_metadata_force_leader_on_site: site_a

If the minority is on site\_b, uncomment this line and change it to
site\_b.

.. rubric:: ` <>`__\ Using Encryption
   :name: using-encryption

To use bucket and object encryption, uncomment the lines for the Key
Management Service (kms) username and password in the /group\_vars/all
template and set them appropriately.

::

    env_s3
      rest_endpoints:
        - s3.example.com
      # kms:
        # username:
        # password:

If no location constraint is set, location constraint defaults to REST
endpoint configuration.

The kms properties file
(/{{targetEnvironmentName}}/kms/ProtectAppICAPI.properties) contains
parameters specific to each customer install. Zenko Enterprise currently
supports cryptographic key management with Gemalto SafeNet. Check
**Allow Key and Policy Configuration Operations** on the the SafeNet
KeySecure Management Console to enable key encryption for Zenko
Enterprise buckets and objects.

.. rubric:: ` <>`__\ Enabling the Service Utilization API
   :name: enabling-the-service-utilization-api

Scality Zenko Enterprise provides a Service Utilization API (UTAPI) for
resource utilization tracking and metrics reporting. This feature is
currently included for testing purposes only and is disabled by default.
To enable UTAPI functionality, uncomment the ``enable_utilization_api``
line in the env/{{targetEnvironmentName}}/group\_vars/all file and set
it to **true**.

.. rubric:: ` <>`__\ Frontend Settings
   :name: frontend-settings

Either software load balancers (Nginx containers, for example) or
hardware load balancers can be set as SSL termination points for
end-user applications. They can also be used to check the health of the
installed Zenko Enterprise instances and to blacklist any connectors
that are not responding properly to the health check.

Frontend SSL termination is incompatible with encryption on internal
communication between components (end-to-end encryption).

The following commented text in the group variables template describes
the features that can be enabled on frontend load balancers:

::

    ## Frontend settings. The frontend container:
    ## - optionally terminates ssl
    ## - checks its local s3 connector health
    ## - directs requests to its local s3 connector if healthy
    ## - directs requests to other s3 connectors if the local one is unhealthy

Uncomment the following code in the group variables template and assign
values appropriate for the environment:

::

    # env_s3_frontend_port: 80         # change for a non-standard port
    # env_s3_frontend_server_name: s3.example.com # must match SSL cert CN
    # env_s3_frontend_ssl_only: false  # set to true en enforce ssl
    # env_s3_frontend_ssl_port: 443    # change for a non-standard port
    # env_s3_frontend_ssl_cert: s3.crt # if ssl is used, file must be in <env>/ssl
    # env_s3_frontend_ssl_key: s3.key  # if ssl is used, file must be in <env>/ssl
    # env_s3_frontend_ssl_ca_bundle: ca-bundle.crt # optional, must be in <env>/ssl

.. rubric:: ` <>`__\ Integrating with Single Sign-On (SSO) Services
   Using SAML
   :name: integrating-with-single-sign-on-sso-services-using-saml

See to learn how to integrate SSO services (such as Microsoft ADFS)
using the SAML 2.0 protocol.

.. raw:: html

   </div>
