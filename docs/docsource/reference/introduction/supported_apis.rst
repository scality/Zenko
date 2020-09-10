Supported Commands and APIs
===========================

Supported S3 commands and IAM commands and endpoints for S3 Connector are
detailed here.

Scality extended APIs, including the Utilization API (UTAPI), a REST API for
reporting on utilization metrics (capacity, objects, bandwidth, and operations
per unit time) are also provided here.

Commands
--------

IAM Command Set
~~~~~~~~~~~~~~~

S3 Connector emulates many AWS Identity and Access Management service methods as
required to perform its tasks.

This table describes current and planned support for the AWS
IAM API commands for :ref:`Users, Groups, and Policies <Supported IAM Actions>`.

.. tabularcolumns:: lll
.. table::
   :widths: auto

   +-------------------------------------+----------------------------+------------+
   | Operation Name                      | Command Type               | Available? |
   +=====================================+============================+============+
   | :ref:`create-user`                  | IAM User                   | yes        |
   +-------------------------------------+----------------------------+------------+
   | :ref:`delete-user`                  | IAM User                   | yes        |
   +-------------------------------------+----------------------------+------------+
   | :ref:`get-user`                     | IAM User                   | yes        |
   +-------------------------------------+----------------------------+------------+
   | :ref:`list-users`                   | IAM User                   | yes        |
   +-------------------------------------+----------------------------+------------+
   | :ref:`create-group`                 | IAM Group                  | yes        |
   +-------------------------------------+----------------------------+------------+
   | :ref:`add-user-to-group`            | IAM Group                  | yes        |
   +-------------------------------------+----------------------------+------------+
   | :ref:`delete-group`                 | IAM Group                  | yes        |
   +-------------------------------------+----------------------------+------------+
   | :ref:`get-group`                    | IAM Group                  | yes        |
   +-------------------------------------+----------------------------+------------+
   | :ref:`list-groups`                  | IAM Group                  | yes        |
   +-------------------------------------+----------------------------+------------+
   | :ref:`list-groups-for-user`         | IAM Group                  | yes        |
   +-------------------------------------+----------------------------+------------+
   | :ref:`remove-user-from-group`       | IAM Group                  | yes        |
   +-------------------------------------+----------------------------+------------+
   | :ref:`create-access-key`            | IAM Access Key             | yes        |
   +-------------------------------------+----------------------------+------------+
   | :ref:`delete-access-key`            | IAM Access Key             | yes        |
   +-------------------------------------+----------------------------+------------+
   | :ref:`list-access-keys`             | IAM Access Key             | yes        |
   +-------------------------------------+----------------------------+------------+
   | :ref:`create-policy`                | Standalone Policy          | yes        |
   +-------------------------------------+----------------------------+------------+
   | :ref:`create-policy-version`        | Standalone Policy          | yes        |
   +-------------------------------------+----------------------------+------------+
   | :ref:`delete-policy`                | Standalone Policy          | yes        |
   +-------------------------------------+----------------------------+------------+
   | :ref:`delete-policy-version`        | Standalone Policy          | yes        |
   +-------------------------------------+----------------------------+------------+
   | :ref:`get-policy`                   | Standalone Policy          | yes        |
   +-------------------------------------+----------------------------+------------+
   | :ref:`get-policy-version`           | Standalone Policy          | yes        |
   +-------------------------------------+----------------------------+------------+
   | :ref:`list-entities-for-policy`     | Standalone Policy          | yes        |
   +-------------------------------------+----------------------------+------------+
   | :ref:`list-policies`                | Standalone Policy          | yes        |
   +-------------------------------------+----------------------------+------------+
   | :ref:`list-policy-versions`         | Standalone Policy          | yes        |
   +-------------------------------------+----------------------------+------------+
   | :ref:`set-default-policy-version`   | Standalone Policy          | yes        |
   +-------------------------------------+----------------------------+------------+
   | :ref:`attach-user-policy`           | User Policy                | yes        |
   +-------------------------------------+----------------------------+------------+
   | :ref:`detach-user-policy`           | User Policy                | yes        |
   +-------------------------------------+----------------------------+------------+
   | get-user-policy                     | User Policy                | no         |
   +-------------------------------------+----------------------------+------------+
   | :ref:`list-attached-user-policies`  | User Policy                | yes        |
   +-------------------------------------+----------------------------+------------+
   | list-user-policies                  | User Policy                | no         |
   +-------------------------------------+----------------------------+------------+
   | :ref:`attach-group-policy`          | Group Policy               | yes        |
   +-------------------------------------+----------------------------+------------+
   | :ref:`detach-group-policy`          | Group Policy               | yes        |
   +-------------------------------------+----------------------------+------------+
   | :ref:`list-attached-group-policies` | Group Policy               | yes        |
   +-------------------------------------+----------------------------+------------+
   | :ref:`delete-group-policy`          | Inline Policies for Groups | yes        |
   +-------------------------------------+----------------------------+------------+
   | :ref:`get-group-policy`             | Inline Policies for Groups | yes        |
   +-------------------------------------+----------------------------+------------+
   | :ref:`list-group-policies`          | Inline Policies for Groups | yes        |
   +-------------------------------------+----------------------------+------------+
   | :ref:`put-group-policy`             | Inline Policies for Groups | yes        |
   +-------------------------------------+----------------------------+------------+
   | :ref:`create-role`                  | Role                       | yes        |
   +-------------------------------------+----------------------------+------------+
   | :ref:`delete-role`                  | Role                       | yes        |
   +-------------------------------------+----------------------------+------------+
   | :ref:`get-role`                     | Role                       | yes        |
   +-------------------------------------+----------------------------+------------+
   | :ref:`list-roles`                   | Role                       | yes        |
   +-------------------------------------+----------------------------+------------+
   | list-role-policies                  | Role                       | no         |
   +-------------------------------------+----------------------------+------------+
   | :ref:`detach-role-policy`           | Role                       | yes        |
   +-------------------------------------+----------------------------+------------+
   | :ref:`attach-role-policy`           | Role                       | yes        |
   +-------------------------------------+----------------------------+------------+
   | update-assume-role-policy           | Role                       | no         |
   +-------------------------------------+----------------------------+------------+

STS Command Set
---------------

S3 Connector partially implements the AWS Security Token Service (STS) API for
role changes. Only the assume-role command is supported.

.. tabularcolumns:: lll
.. table::
   :widths: auto

   +-------------------------------+----------------------------+------------+
   | Operation Name                | Command Type               | Available? |
   +===============================+============================+============+
   | :ref:`assume-role`            | Role                       | yes        |
   +-------------------------------+----------------------------+------------+
   | assume-role-with-SAML         | Role                       | no         |
   +-------------------------------+----------------------------+------------+
   | assume-role-with-web-identity | Role                       | no         |
   +-------------------------------+----------------------------+------------+
   | decode-authorization-message  | Authorization Status       | no         |
   +-------------------------------+----------------------------+------------+
   | get-access-key-info           | Account Identifier         | no         |
   +-------------------------------+----------------------------+------------+
   | get-caller-identity           | User/Role Identifier       | no         |
   +-------------------------------+----------------------------+------------+
   | get-federation-token          | Security Credentials       | no         |
   +-------------------------------+----------------------------+------------+
   | get-session-token             | Security Credentials       | no         |
   +-------------------------------+----------------------------+------------+

APIs
----
.. _S3 API:

S3 API
~~~~~~

.. tabularcolumns:: X{0.50\textwidth}X{0.30\textwidth}X{0.15\textwidth}
.. table::
   :widths: auto

   +---------------------------------------+----------------+------------+
   | Operation Name                        | Operation Type | Available? |
   +=======================================+================+============+
   | :ref:`DELETE Bucket`                  | Bucket         | yes        |
   +---------------------------------------+----------------+------------+
   | :ref:`GET Bucket Versioning`          | Bucket         | yes        |
   +---------------------------------------+----------------+------------+
   | :ref:`GET Bucket Location`            | Bucket         | yes        |
   +---------------------------------------+----------------+------------+
   | :ref:`GET Bucket (List Objects)`      | Bucket         | yes        |
   +---------------------------------------+----------------+------------+
   | :ref:`GET Bucket (List Objects) v.2`  | Bucket         | yes        |
   +---------------------------------------+----------------+------------+
   | :ref:`GET Bucket Object Versions`     | Bucket         | yes        |
   +---------------------------------------+----------------+------------+
   | :ref:`Head Bucket`                    | Bucket         | yes        |
   +---------------------------------------+----------------+------------+
   | :ref:`PUT Bucket`                     | Bucket         | yes        |
   +---------------------------------------+----------------+------------+
   | :ref:`PUT Bucket Versioning`          | Bucket         | yes        |
   +---------------------------------------+----------------+------------+
   | :ref:`GET Bucket ACL`                 | Bucket         | yes        |
   +---------------------------------------+----------------+------------+
   | :ref:`PUT Bucket ACL`                 | Bucket         | yes        |
   +---------------------------------------+----------------+------------+
   | :ref:`List Multipart Uploads`         | Bucket         | yes        |
   +---------------------------------------+----------------+------------+
   | :ref:`PUT Bucket Website`             | Bucket         | yes        |
   +---------------------------------------+----------------+------------+
   | :ref:`GET Bucket Website`             | Bucket         | yes        |
   +---------------------------------------+----------------+------------+
   | :ref:`DELETE Bucket Website`          | Bucket         | yes        |
   +---------------------------------------+----------------+------------+
   | :ref:`PUT Bucket CORS`                | Bucket         | yes        |
   +---------------------------------------+----------------+------------+
   | :ref:`GET Bucket CORS`                | Bucket         | yes        |
   +---------------------------------------+----------------+------------+
   | :ref:`DELETE Bucket CORS`             | Bucket         | yes        |
   +---------------------------------------+----------------+------------+
   | DELETE Bucket Lifecycle               | Bucket         | no         |
   +---------------------------------------+----------------+------------+
   | :ref:`DELETE Bucket Replication`      | Bucket         | yes        |
   +---------------------------------------+----------------+------------+
   | :ref:`DELETE Bucket Policy`           | Bucket         | yes        |
   +---------------------------------------+----------------+------------+
   | DELETE Bucket Tagging                 | Bucket         | no         |
   +---------------------------------------+----------------+------------+
   | GET Bucket Lifecycle                  | Bucket         | no         |
   +---------------------------------------+----------------+------------+
   | :ref:`GET Bucket Replication`         | Bucket         | yes        |
   +---------------------------------------+----------------+------------+
   | :ref:`GET Bucket Policy`              | Bucket         | yes        |
   +---------------------------------------+----------------+------------+
   | :ref:`GET Object Lock Configuration`  | Bucket         | yes        |
   +---------------------------------------+----------------+------------+
   | GET Object Lock Configuration         | Bucket         | no         |
   +---------------------------------------+----------------+------------+
   | GET Bucket Logging                    | Bucket         | no         |
   +---------------------------------------+----------------+------------+
   | GET Bucket Notification               | Bucket         | no         |
   +---------------------------------------+----------------+------------+
   | GET Bucket Tagging                    | Bucket         | no         |
   +---------------------------------------+----------------+------------+
   | GET Bucket RequestPayment             | Bucket         | no         |
   +---------------------------------------+----------------+------------+
   | PUT Bucket Lifecycle                  | Bucket         | no         |
   +---------------------------------------+----------------+------------+
   | :ref:`PUT Bucket Replication`         | Bucket         | yes        |
   +---------------------------------------+----------------+------------+
   | :ref:`PUT Bucket Policy`              | Bucket         | yes        |
   +---------------------------------------+----------------+------------+
   | :ref:`PUT Object Lock Configuration`  | Bucket         | yes        |
   +---------------------------------------+----------------+------------+
   | PUT Object Lock Configuration         | Bucket         | no         |
   +---------------------------------------+----------------+------------+
   | PUT Bucket Logging                    | Bucket         | no         |
   +---------------------------------------+----------------+------------+
   | PUT Bucket Notification               | Bucket         | no         |
   +---------------------------------------+----------------+------------+
   | PUT Bucket Tagging                    | Bucket         | no         |
   +---------------------------------------+----------------+------------+
   | PUT Bucket RequestPayment             | Bucket         | no         |
   +---------------------------------------+----------------+------------+
   | :ref:`DELETE Object`                  | Object         | yes        |
   +---------------------------------------+----------------+------------+
   | :ref:`DELETE Object Tagging`          | Object         | yes        |
   +---------------------------------------+----------------+------------+
   | :ref:`Multi-Object Delete`            | Object         | yes        |
   +---------------------------------------+----------------+------------+
   | :ref:`GET Object`                     | Object         | yes        |
   +---------------------------------------+----------------+------------+
   | :ref:`GET Object Legal Hold`          | Object         | yes        |
   +---------------------------------------+----------------+------------+
   | :ref:`GET Object Retention`           | Object         | yes        |
   +---------------------------------------+----------------+------------+
   | :ref:`GET Object Tagging`             | Object         | yes        |
   +---------------------------------------+----------------+------------+
   | :ref:`GET Object ACL`                 | Object         | yes        |
   +---------------------------------------+----------------+------------+
   | :ref:`HEAD Object`                    | Object         | yes        |
   +---------------------------------------+----------------+------------+
   | :ref:`Copy Object`                    | Object         | yes        |
   +---------------------------------------+----------------+------------+
   | GET Object Torrent                    | Object         | no         |
   +---------------------------------------+----------------+------------+
   | OPTIONS Object                        | Object         | no         |
   +---------------------------------------+----------------+------------+
   | POST Object                           | Object         | no         |
   +---------------------------------------+----------------+------------+
   | POST Object Restore                   | Object         | no         |
   +---------------------------------------+----------------+------------+
   | :ref:`PUT Object`                     | Object         | yes        |
   +---------------------------------------+----------------+------------+
   | :ref:`PUT Object Legal Hold`          | Object         | yes        |
   +---------------------------------------+----------------+------------+
   | :ref:`PUT Object Retention`           | Object         | yes        |
   +---------------------------------------+----------------+------------+   
   | :ref:`PUT Object Tagging`             | Object         | yes        |
   +---------------------------------------+----------------+------------+
   | :ref:`PUT Object ACL`                 | Object         | yes        |
   +---------------------------------------+----------------+------------+
   | :ref:`PUT Object - Copy`              | Object         | yes        |
   +---------------------------------------+----------------+------------+
   | :ref:`Initiate Multipart Upload`      | Multipart      | yes        |
   |                                       | Upload         |            |
   +---------------------------------------+----------------+------------+
   | :ref:`Upload Part`                    | Multipart      | yes        |
   |                                       | Upload         |            |
   +---------------------------------------+----------------+------------+
   | :ref:`Upload Part - copy`             | Multipart      | yes        |
   |                                       | Upload         |            |
   +---------------------------------------+----------------+------------+
   | :ref:`Complete Multipart Upload`      | Multipart      | yes        |
   |                                       | Upload         |            |
   +---------------------------------------+----------------+------------+
   | :ref:`Abort Multipart Upload`         | Multipart      | yes        |
   |                                       | Upload         |            |
   +---------------------------------------+----------------+------------+
   | :ref:`List Parts`                     | Multipart      | yes        |
   |                                       | Upload         |            |
   +---------------------------------------+----------------+------------+
   | **Special Notes**                                                   |
   +---------------------------------------+----------------+------------+
   | Transfer-stream-encoding for          |                | yes        |
   | object PUT with v4 AUTH               |                |            |
   +---------------------------------------+----------------+------------+

IAM API
~~~~~~~

S3 Connector emulates many AWS Identity and Access Management service methods as
required to perform its tasks.

This table describes current and planned support for the AWS
IAM API commands for :ref:`Users, Groups, and Policies <Supported IAM Actions>`.

.. tabularcolumns:: lll
.. table::
   :widths: auto

   +------------------------------+----------------------------+------------+
   | Operation Name               | Command Type               | Available? |
   +==============================+============================+============+
   | create-user                  | IAM User                   | yes        |
   +------------------------------+----------------------------+------------+
   | delete-user                  | IAM User                   | yes        |
   +------------------------------+----------------------------+------------+
   | get-user                     | IAM User                   | yes        |
   +------------------------------+----------------------------+------------+
   | list-users                   | IAM User                   | yes        |
   +------------------------------+----------------------------+------------+
   | create-group                 | IAM Group                  | yes        |
   +------------------------------+----------------------------+------------+
   | add-user-to-group            | IAM Group                  | yes        |
   +------------------------------+----------------------------+------------+
   | delete-group                 | IAM Group                  | yes        |
   +------------------------------+----------------------------+------------+
   | get-group                    | IAM Group                  | yes        |
   +------------------------------+----------------------------+------------+
   | list-groups                  | IAM Group                  | yes        |
   +------------------------------+----------------------------+------------+
   | list-groups-for-user         | IAM Group                  | yes        |
   +------------------------------+----------------------------+------------+
   | remove-user-from-group       | IAM Group                  | yes        |
   +------------------------------+----------------------------+------------+
   | create-access-key            | IAM Access Key             | yes        |
   +------------------------------+----------------------------+------------+
   | delete-access-key            | IAM Access Key             | yes        |
   +------------------------------+----------------------------+------------+
   | list-access-keys             | IAM Access Key             | yes        |
   +------------------------------+----------------------------+------------+
   | create-policy                | Standalone Policy          | yes        |
   +------------------------------+----------------------------+------------+
   | create-policy-version        | Standalone Policy          | yes        |
   +------------------------------+----------------------------+------------+
   | delete-policy                | Standalone Policy          | yes        |
   +------------------------------+----------------------------+------------+
   | delete-policy-version        | Standalone Policy          | yes        |
   +------------------------------+----------------------------+------------+
   | get-policy                   | Standalone Policy          | yes        |
   +------------------------------+----------------------------+------------+
   | get-policy-version           | Standalone Policy          | yes        |
   +------------------------------+----------------------------+------------+
   | list-entities-for-policies   | Standalone Policy          | no         |
   +------------------------------+----------------------------+------------+
   | list-policies                | Standalone Policy          | yes        |
   +------------------------------+----------------------------+------------+
   | list-policy-versions         | Standalone Policy          | yes        |
   +------------------------------+----------------------------+------------+
   | set-default-policy-version   | Standalone Policy          | yes        |
   +------------------------------+----------------------------+------------+
   | attach-user-policy           | User Policy                | yes        |
   +------------------------------+----------------------------+------------+
   | detach-user-policy           | User Policy                | yes        |
   +------------------------------+----------------------------+------------+
   | get-user-policy              | User Policy                | no         |
   +------------------------------+----------------------------+------------+
   | list-attached-user-policies  | User Policy                | yes        |
   +------------------------------+----------------------------+------------+
   | list-user-policies           | User Policy                | no         |
   +------------------------------+----------------------------+------------+
   | attach-group-policy          | Group Policy               | yes        |
   +------------------------------+----------------------------+------------+
   | detach-group-policy          | Group Policy               | yes        |
   +------------------------------+----------------------------+------------+
   | list-attached-group-policies | Group Policy               | yes        |
   +------------------------------+----------------------------+------------+
   | delete-group-policy          | Inline Policies for Groups | yes        |
   +------------------------------+----------------------------+------------+
   | get-group-policy             | Inline Policies for Groups | yes        |
   +------------------------------+----------------------------+------------+
   | list-group-policies          | Inline Policies for Groups | yes        |
   +------------------------------+----------------------------+------------+
   | put-group-policy             | Inline Policies for Groups | yes        |
   +------------------------------+----------------------------+------------+
   | create-role                  | Role                       | yes        |
   +------------------------------+----------------------------+------------+
   | delete-role                  | Role                       | yes        |
   +------------------------------+----------------------------+------------+
   | get-role                     | Role                       | yes        |
   +------------------------------+----------------------------+------------+
   | list-roles                   | Role                       | yes        |
   +------------------------------+----------------------------+------------+
   | list-role-policies           | Role                       | no         |
   +------------------------------+----------------------------+------------+
   | detach-role-policy           | Role                       | yes        |
   +------------------------------+----------------------------+------------+
   | attach-role-policy           | Role                       | yes        |
   +------------------------------+----------------------------+------------+
   | update-assume-role-policy    | Role                       | no         |
   +------------------------------+----------------------------+------------+

STS API
-------

S3 Connector partially implements the AWS Securtity Token Service (STS) API for
role changes. Only the AssumeRole API is supported.

.. tabularcolumns:: lll
.. table::
   :widths: auto

   +-------------------------------+----------------------------+------------+
   | Operation Name                | Command Type               | Available? |
   +===============================+============================+============+
   | assume-role                   | Role                       | yes        |
   +-------------------------------+----------------------------+------------+
   | assume-role-with-SAML         | Role                       | no         |
   +-------------------------------+----------------------------+------------+
   | assume-role-with-web-identity | Role                       | no         |
   +-------------------------------+----------------------------+------------+
   | decode-authorization-message  | Authorization Status       | no         |
   +-------------------------------+----------------------------+------------+
   | get-access-key-info           | Account Identifier         | no         |
   +-------------------------------+----------------------------+------------+
   | get-caller-identity           | User/Role Identifier       | no         |
   +-------------------------------+----------------------------+------------+
   | get-federation-token          | Security Credentials       | no         |
   +-------------------------------+----------------------------+------------+
   | get-session-token             | Security Credentials       | no         |
   +-------------------------------+----------------------------+------------+

Utilization API (UTAPI)
-----------------------

Scality's UTilization API (UTAPI) is a RESTful API is accessed using POST
requests via a JSON-based protocol. Input parameters are provided as a JSON body
(at the service level) or a JSON array of entities (for example an array of
buckets, accounts, or users) on which to query, plus a time range. The RESTful
API through which UTAPI is accessed is securely authenticated via HTTPS on a
dedicated web server and port.

.. tabularcolumns:: lll
.. table::
   :widths: auto

   +-------------------------------------+-----------+------------+
   | Utilization Metric                  | Operation | Available? |
   +=====================================+===========+============+
   | :ref:`Account Level<Post Accounts>` | Post      | yes        |
   +-------------------------------------+-----------+------------+
   | :ref:`Bucket Level<Post Buckets>`   | Post      | yes        |
   +-------------------------------------+-----------+------------+
   | :ref:`User Level<Post Users>`       | Post      | yes        |
   +-------------------------------------+-----------+------------+
   | :ref:`Service Level<Post Service>`  | Post      | yes        |
   +-------------------------------------+-----------+------------+

