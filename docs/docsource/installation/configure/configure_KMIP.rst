.. _Configuring KMIP:

Configuring KMIP
================

Using Encryption with a KMIP Appliance
--------------------------------------

KMIP is a standard protocol for accessing third party key management
systems.

The XDM KMIP driver requires a KMIP version 1.2 or later server. The server
must also support the following KMIP profiles:

- Baseline Server Profile (TLS transport and TTLV encoding)
- Symmetric Key Lifecycle Server Profile
- Basic Cryptographic Server Profile


Configure KMIP
--------------

To use KMIP server to manage bucket encryption keys, cd to
kubernetes/zenko/charts/cloudserver/ and edit values.yaml.

The default settings for this section are:

::
   
   kmip:
      enabled: false
      port: 5696
      hosts: []
      compoundCreate: false
      bucketAttributeName: ''
      pipelineDepth: 8

Where: 

- ``enabled`` activates the feature. Set it to ``true``.
      
- ``port`` (default value is ``5696``) sets the TCP port to which the KMIP server listens.

- ``hosts`` (undefined by default). Array of *one* host name or IP address for the KMIP server.

- ``compoundCreate`` (default value is ``false``). Enable this option if the
  KMIP server supports creation and activation in a single operation. Leave it
  disabled to prevent clock desynchronization issues in two-step creation
  processes. (Two-step creation relies on the server time, rather than the
  client-specified activation date, for "now", resulting in desynchronization.)

- ``bucketAttributeName`` (default value is empty). Set the bucket name
  attribute here if the KMIP server supports storing custom attributes along
  with the keys. KMIP appliances reference managed objects using an unfriendly
  identifier that is not related to the bucket to which the key belongs. This
  option enables you to specify an attribute name to store the name of the
  bucket to which the key belongs. Leaving this option unset does not affect
  operation, but setting it can facilitate debugging and administration.

- ``pipelineDepth`` (default value is ``8``). This value specifies the request
  pipeline depth. If the server replies out of order and confuses the client, a
  value of 1 can provides a convenient workaround for this kind of server-side
  bug. Otherwise, there is almost no performance improvement to be gained from
  tuning this value away from 8.

  .. note:: Zero is not an appropriate value. XDM will fall back to 1.

The KMIP protocol uses certificates for client authentication. The key, cert and
ca files must be stored in the kubernetes/zenko/charts/cloudserver/ directory
and the file names must comply with the following pattern: ``kmip-XYZ.pem``
where ``XYZ`` is replaced with a meaningful word, as in:
kubernetes/zenko/charts/cloudserver/kmip-ca.pem
kubernetes/zenko/charts/cloudserver/kmip-cert.pem
kubernetes/zenko/charts/cloudserver/kmip-key.pem
      
When you've reconfigured the KMIP settings in values.yaml, deploy or upgrade
XDM with a Helm command:

::

  $ helm upgrade {{zenko-server-name}} .

Limitations
-----------

Even though it may appear to work with the Safenet appliance, this configuration
is not compatible with, and its operation is mutually exclusive to that of the
proprietary Safenet NAE KMS protocol. There is no migration path from Safenet
NAE to KMIP.

The KMIP protocol does not provide the service introspection operations required
to implement high availability, automatic failover, or load balancing on
multiple appliances. Failover must be handled manually at the appliance level,
which is beyond the scope of this driver.

Despite the KMIP configuration's lack of high availability and scalability at
the protocol level, the cluster administrator must ensure that the KMIP service
is properly replicated, to ensure the durability of the keys and thus the data
stored in encrypted buckets.

The KMIP protocol does not provide the operations needed to implement key
rotation at the appliance level.
