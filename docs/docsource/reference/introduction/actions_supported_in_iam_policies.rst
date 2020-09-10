.. _Actions Supported in IAM Policies:

Actions Supported in IAM Policies
=================================

This page lists the subset of all possible bucket, object, IAM, and STS actions
that S3 Connector supports when defining IAM policies.

.. tip::

   Although Vault supports the same aws-cli subcommands as AWS IAM, the
   ``--endpoint-url`` parameter must be included in these commands to specify
   the targeted S3 cluster. For example:

   .. code::

      $ aws --endpoint-url http://192.168.1.1 iam create-policy \
        --policy-name sample_policy --policy-document file://policy.json

Supported Bucket Actions
------------------------

.. tabularcolumns::X{0.10\textwidth}X{0.70\textwidth}X{0.15\textwidth}
.. table::
   :widths: auto
   :class: longtable

   +-------------------------------+------------------------------------------------+----------------------------+
   | This Action...                | Allows These aws-cli Commands...               | Which Call This API        |
   +===============================+================================================+============================+
   | s3:CreateBucket               | s3api :ref:`create-bucket`                     | `CreateBucket`_            |
   |                               |                                                |                            |
   |                               | s3 :ref:`mb`                                   |                            |
   +-------------------------------+------------------------------------------------+----------------------------+
   | s3:DeleteBucket               | s3api :ref:`delete-bucket`                     | `DeleteBucket`_            |
   |                               |                                                |                            |
   |                               | s3 :ref:`rb`                                   |                            |
   +-------------------------------+------------------------------------------------+----------------------------+
   | s3:DeleteBucketWebsite        | s3api :ref:`delete-bucket-website`             | `DeleteBucketWebSite`_     |
   +-------------------------------+------------------------------------------------+----------------------------+
   | s3:DeleteBucketReplication    | s3api :ref:`delete-bucket-replication`         | `DeleteBucketReplication`_ |
   +-------------------------------+------------------------------------------------+----------------------------+
   | s3:GetBucketAcl               | s3api :ref:`get-bucket-acl`                    | `GetBucketAcl`_            |
   +-------------------------------+------------------------------------------------+----------------------------+
   | s3:GetBucketCORS              | s3api :ref:`get-bucket-cors`                   | `GetBucketCors`_           |
   +-------------------------------+------------------------------------------------+----------------------------+
   | s3:GetBucketLocation          | s3api :ref:`get-bucket-location`               | `GetBucketLocation`_       |
   +-------------------------------+------------------------------------------------+----------------------------+
   | s3:GetBucketVersioning        | s3api :ref:`get-bucket-versioning`             | `GetBucketVersioning`_     |
   +-------------------------------+------------------------------------------------+----------------------------+
   | s3:GetBucketWebsite           | s3api :ref:`get-bucket-website`                | `GetBucketWebsite`_        |
   +-------------------------------+------------------------------------------------+----------------------------+
   | s3:GetBucketReplication       | s3api :ref:`get-bucket-replication`            | `GetBucketReplication`_    |
   +-------------------------------+------------------------------------------------+----------------------------+
   | s3:ListAllMyBuckets           | s3api :ref:`list-buckets`                      | `ListBuckets`_             |
   |                               |                                                |                            |
   |                               | s3 :ref:`ls`                                   |                            |
   +-------------------------------+------------------------------------------------+----------------------------+
   | s3:ListBucket                 | s3api :ref:`list-objects`,                     | `ListObjects`_,            |
   |                               | :ref:`list-objects-v2`, :ref:`head-bucket`     | `ListObjectsV2`_,          |
   |                               |                                                | `HeadBucket`_              |
   |                               | s3 :ref:`ls` s3://bucket                       |                            |
   +-------------------------------+------------------------------------------------+----------------------------+
   | s3:ListBucketVersions         | s3api :ref:`list-object-versions`              | `ListObjectVersions`_      |
   +-------------------------------+------------------------------------------------+----------------------------+
   | s3:ListBucketMultipartUploads | s3api :ref:`list-multipart-uploads`,           | `ListMultipartUploads`_    |
   |                               |  :ref:`list-parts`                             |                            |
   +-------------------------------+------------------------------------------------+----------------------------+
   | s3:PutBucketAcl               | s3api :ref:`put-bucket-acl`                    | `PutBucketAcl`_            |
   +-------------------------------+------------------------------------------------+----------------------------+
   | s3:PutBucketCORS              | s3api :ref:`put-bucket-cors`                   | `PutBucketCORS`_           |
   +-------------------------------+------------------------------------------------+----------------------------+
   | s3:PutBucketVersioning        | s3api :ref:`put-bucket-versioning`             | `PutBucketVersioning`_     |
   +-------------------------------+------------------------------------------------+----------------------------+
   | s3:PutBucketWebsite           | s3api :ref:`put-bucket-website`                | `PutBucketWebsite`_        |
   +-------------------------------+------------------------------------------------+----------------------------+
   | s3:PutBucketReplication       | s3api :ref:`put-bucket-replication`            | `PutBucketReplication`_    |
   +-------------------------------+------------------------------------------------+----------------------------+

.. _mb: https://docs.aws.amazon.com/cli/latest/reference/s3/mb.html
.. _CreateBucket: https://docs.aws.amazon.com/AmazonS3/latest/API/API_CreateBucket.html   
.. _rb: https://docs.aws.amazon.com/cli/latest/reference/s3/rb.html
.. _DeleteBucket: https://docs.aws.amazon.com/AmazonS3/latest/API/API_DeleteBucket.html
.. _ListMultipartUploads: https://docs.aws.amazon.com/AmazonS3/latest/API/API_ListMultipartUploads.html
.. _ListBuckets: https://docs.aws.amazon.com/AmazonS3/latest/API/API_ListBuckets.html   
.. _ls: https://docs.aws.amazon.com/cli/latest/reference/s3/ls.html
.. _ListObjects: https://docs.aws.amazon.com/AmazonS3/latest/API/API_ListObjects.html   
.. _ListObjectsV2: https://docs.aws.amazon.com/AmazonS3/latest/API/API_ListObjectsV2.html
.. _ListObjectVersions: https://docs.aws.amazon.com/AmazonS3/latest/API/API_ListObjectVersions.html
.. _HeadBucket: https://docs.aws.amazon.com/AmazonS3/latest/API/API_HeadBucket.html
.. _DeleteBucketWebSite: https://docs.aws.amazon.com/AmazonS3/latest/API/API_DeleteBucketWebsite.html   
.. _DeleteBucketReplication: https://docs.aws.amazon.com/AmazonS3/latest/API/API_DeleteBucketReplication.html
.. _GetBucketAcl: https://docs.aws.amazon.com/AmazonS3/latest/API/API_GetBucketAcl.html   
.. _GetBucketCors: https://docs.aws.amazon.com/AmazonS3/latest/API/API_GetBucketCors.html   
.. _GetBucketLocation: https://docs.aws.amazon.com/AmazonS3/latest/API/API_GetBucketLocation.html
.. _GetBucketReplication: https://docs.aws.amazon.com/AmazonS3/latest/API/API_GetBucketReplication.html
.. _GetBucketVersioning: https://docs.aws.amazon.com/AmazonS3/latest/API/API_GetBucketVersioning.html
.. _GetBucketWebSite: https://docs.aws.amazon.com/AmazonS3/latest/API/API_GetBucketWebsite.html
.. _PutBucketAcl: https://docs.aws.amazon.com/AmazonS3/latest/API/API_PutBucketAcl.html   
.. _PutBucketCors: https://docs.aws.amazon.com/AmazonS3/latesPutt/API/API_PutBucketCors.html   
.. _PutBucketReplication: https://docs.aws.amazon.com/AmazonS3/latest/API/API_PutBucketReplication.html
.. _PutBucketVersioning: https://docs.aws.amazon.com/AmazonS3/latest/API/API_PutBucketVersioning.html
.. _PutBucketWebSite: https://docs.aws.amazon.com/AmazonS3/latest/API/API_PutBucketWebsite.html

Supported Object Actions
------------------------

.. tabularcolumns::X{0.10\textwidth}X{0.70\textwidth}X{0.15\textwidth}
.. table::
   :widths: auto
   :class: longtable

   +-------------------------------+--------------------------------------------------+----------------------------+
   | This Action...                | Allows These aws-cli Commands...                 | Which Call This API        |
   +===============================+==================================================+============================+
   | s3:AbortMultipartUpload       | s3api :ref:`abort-multipart-upload`              | `AbortMultipartUpload`_    |
   +-------------------------------+--------------------------------------------------+----------------------------+
   | s3:CopyObject                 | s3api :ref:`copy-object`                         | `CopyObject`_              |
   +-------------------------------+--------------------------------------------------+----------------------------+   
   | s3:DeleteObject               | s3api :ref:`delete-object`,                      | `DeleteObject`_            |
   |                               | :ref:`delete-objects`                            |                            |
   |                               |                                                  |                            |
   |                               | s3 :ref:`rm`                                     |                            |
   +-------------------------------+--------------------------------------------------+----------------------------+
   | s3:DeleteObjectTagging        | s3api :ref:`delete-object-tagging`               | `DeleteObjectTagging`_     |
   +-------------------------------+--------------------------------------------------+----------------------------+
   | s3:DeleteObjectVersion        | s3api :ref:`delete-object` |1|                   | `DeleteObject`_ |1|        |
   +-------------------------------+--------------------------------------------------+----------------------------+
   | s3:DeleteObjectVersionTagging | s3api :ref:`delete-object-tagging`               | `GetObjectTagging`_        |
   +-------------------------------+--------------------------------------------------+----------------------------+
   | s3:GetObject                  | s3api :ref:`get-object`, :ref:`head-object`      | `GetObject`_,              |
   |                               |                                                  | `HeadObject`_              |
   |                               | s3 :ref:`cp`                                     |                            |
   +-------------------------------+--------------------------------------------------+----------------------------+
   | s3:GetObjectAcl               | s3api :ref:`get-object-acl`                      | `GetObjectAcl`_            |
   +-------------------------------+--------------------------------------------------+----------------------------+
   | s3:GetObjectTagging           | s3api :ref:`get-object-tagging`                  | `GetObjectTagging`_        |
   +-------------------------------+--------------------------------------------------+----------------------------+
   | s3:GetObjectVersion           | s3api :ref:`get-object` |1|,                     | `GetObject`_ |1|,          |
   |                               | :ref:`head-object` |1|                           | `HeadObject`_ |1|          |
   +-------------------------------+--------------------------------------------------+----------------------------+
   | s3:GetObjectVersionAcl        | s3api :ref:`get-object` |1|                      | `GetObjectAcl`_ |1|        |
   +-------------------------------+--------------------------------------------------+----------------------------+
   | s3:GetObjectVersionTagging    | s3api :ref:`get-object` |1|                      | `GetObjectTagging`_ |1|    |
   +-------------------------------+--------------------------------------------------+----------------------------+
   | s3:ListMultipartUploadParts   | s3api :ref:`list-parts`                          | `ListParts`_               |
   +-------------------------------+--------------------------------------------------+----------------------------+
   | s3:PutObject                  | s3api :ref:`put-object`,                         | `PutObject`_,              |
   |                               | :ref:`create-multipart-upload`,                  | `CreateMultipartUpload`_,  |
   |                               | :ref:`upload-part`,                              | `UploadPart`_,             |
   |                               | :ref:`complete-multipart-upload`,                | `CompleteMultipartUpload`_,|
   |                               | :ref:`upload-part-copy`,                         | `UploadPartCopy`_          |
   |                               |                                                  |                            |
   |                               | s3 :ref:`cp`                                     |                            |
   +-------------------------------+--------------------------------------------------+----------------------------+
   | s3:PutObjectAcl               | s3api :ref:`put-object-acl`,                     | `PutObjectAcl`_            |
   |                               | :ref:`put-object` |1|                            |                            |
   +-------------------------------+--------------------------------------------------+----------------------------+
   | s3:PutObjectTagging           | s3api :ref:`put-object-tagging`,                 | `PutObjectTagging`_        |
   |                               | :ref:`put-object` |1|                            |                            |
   +-------------------------------+--------------------------------------------------+----------------------------+
   | s3:PutObjectVersionAcl        | s3api :ref:`put-object` |1|                      | `PutObjectAcl`_ |1|        |
   +-------------------------------+--------------------------------------------------+----------------------------+
   | s3:PutObjectVersionTagging    | s3api :ref:`put-object` |1|                      | `PutObjectTagging`_ |1|    |
   +-------------------------------+--------------------------------------------------+----------------------------+
   | |1| With additional options                                                                                   |
   +-------------------------------+--------------------------------------------------+----------------------------+   
.. |1| replace:: :sup:`1`

.. _AbortMultipartUpload: https://docs.aws.amazon.com/AmazonS3/latest/API/API_AbortMultipartUpload.html
.. _CopyObject: https://docs.aws.amazon.com/AmazonS3/latest/API/API_CopyObject.html
.. _DeleteObject: https://docs.aws.amazon.com/AmazonS3/latest/API/API_DeleteObject.html
.. _rm: https://docs.aws.amazon.com/cli/latest/reference/s3/rm.html   
.. _DeleteObjectTagging: https://docs.aws.amazon.com/AmazonS3/latest/API/API_DeleteObjectTagging.html
.. _GetObject: https://docs.aws.amazon.com/AmazonS3/latest/API/API_GetObject.html
.. _HeadObject: https://docs.aws.amazon.com/AmazonS3/latest/API/API_HeadObject.html
.. _cp: https://docs.aws.amazon.com/cli/latest/reference/s3/cp.html
.. _GetObjectAcl: https://docs.aws.amazon.com/AmazonS3/latest/API/API_GetObjectAcl.html
.. _GetObjectTagging: https://docs.aws.amazon.com/AmazonS3/latest/API/API_GetObjectTagging.html
.. _ListParts: https://docs.aws.amazon.com/AmazonS3/latest/API/API_ListParts.html
.. _PutObject: https://docs.aws.amazon.com/AmazonS3/latest/API/API_PutObject.html   
.. _PostObject: https://docs.aws.amazon.com/AmazonS3/latest/API/RESTObjectPOST.html
.. _CreateMultipartUpload: https://docs.aws.amazon.com/AmazonS3/latest/API/API_CreateMultipartUpload.html
.. _UploadPart: https://docs.aws.amazon.com/AmazonS3/latest/API/API_UploadPart.html
.. _CompleteMultipartUpload: https://docs.aws.amazon.com/AmazonS3/latest/API/API_CompleteMultipartUpload.html
.. _UploadPartCopy: https://docs.aws.amazon.com/AmazonS3/latest/API/API_UploadPartCopy.html
.. _PutObjectAcl: https://docs.aws.amazon.com/AmazonS3/latest/API/API_PutObjectAcl.html
.. _PutObjectTagging: https://docs.aws.amazon.com/AmazonS3/latest/API/API_PutObjectTagging.html

.. _Supported IAM Actions:

Supported IAM Actions
---------------------

Use standard IAM commands to create and manage users and groups and to
create and manage access keys for Vault users.

.. tabularcolumns::X{0.30\textwidth}X{0.40\textwidth}X{0.25\textwidth}
.. table::
   :widths: auto
   :class: longtable

   +-------------------------------+-----------------------------------------+------------------------------+
   | This Action...                | Allows This aws-cli Subcommand...       | Which Calls This API         |
   +===============================+=========================================+==============================+
   | iam:AddUserToGroup            | iam :ref:`add-user-to-group`            | `AddUserToGroup`_            |
   +-------------------------------+-----------------------------------------+------------------------------+
   | iam:AttachGroupPolicy         | iam :ref:`attach-group-policy`          | `AttachGroupPolicy`_         |
   +-------------------------------+-----------------------------------------+------------------------------+
   | iam:AttachRolePolicy          | iam :ref:`attach-role-policy`           | `AttachRolePolicy`_          |
   +-------------------------------+-----------------------------------------+------------------------------+
   | iam:AttachUserPolicy          | iam :ref:`attach-user-policy`           | `AttachUserPolicy`_          |
   +-------------------------------+-----------------------------------------+------------------------------+
   | iam:CreateAccessKey           | iam :ref:`create-access-key`            | `CreateAccessKey`_           |
   +-------------------------------+-----------------------------------------+------------------------------+
   | iam:CreateGroup               | iam :ref:`create-group`                 | `CreateGroup`_               |
   +-------------------------------+-----------------------------------------+------------------------------+
   | iam:CreateLoginProfile        | iam :ref:`create-login-profile`         | `CreateLoginProfile`_        |
   +-------------------------------+-----------------------------------------+------------------------------+
   | iam:CreatePolicy              | iam :ref:`create-policy`                | `CreatePolicy`_              |
   +-------------------------------+-----------------------------------------+------------------------------+
   | iam:CreatePolicyVersion       | iam :ref:`create-policy-version`        | `CreatePolicyVersion`_       |
   +-------------------------------+-----------------------------------------+------------------------------+
   | iam:CreateRole                | iam :ref:`create-role`                  | `CreateRole`_                |
   +-------------------------------+-----------------------------------------+------------------------------+
   | iam:CreateUser                | iam :ref:`create-user`                  | `CreateUser`_                |
   +-------------------------------+-----------------------------------------+------------------------------+
   | iam:DeleteAccessKey           | iam :ref:`delete-access-key`            | `DeleteAccessKey`_           |
   +-------------------------------+-----------------------------------------+------------------------------+
   | iam:DeleteGroup               | iam :ref:`delete-group`                 | `DeleteGroup`_               |
   +-------------------------------+-----------------------------------------+------------------------------+
   | iam:DeleteGroupPolicy         | iam :ref:`delete-group-policy`          | `DeleteGroupPolicy`_         |
   +-------------------------------+-----------------------------------------+------------------------------+
   | iam:DeleteLoginProfile        | iam :ref:`delete-login-profile`         | `DeleteLoginProfile`_        |
   +-------------------------------+-----------------------------------------+------------------------------+
   | iam:DeletePolicy              | iam :ref:`delete-policy`                | `DeletePolicy`_              |
   +-------------------------------+-----------------------------------------+------------------------------+
   | iam:DeletePolicyVersion       | iam :ref:`delete-policy-version`        | `DeletePolicyVersion`_       |
   +-------------------------------+-----------------------------------------+------------------------------+
   | iam:DeleteRole                | iam :ref:`delete-role`                  | `DeleteRole`_                |
   +-------------------------------+-----------------------------------------+------------------------------+
   | iam:DeleteUser                | iam :ref:`delete-user`                  | `DeleteUser`_                |
   +-------------------------------+-----------------------------------------+------------------------------+
   | iam:DetachGroupPolicy         | iam :ref:`detach-group-policy`          | `DetachGroupPolicy`_         |
   +-------------------------------+-----------------------------------------+------------------------------+
   | iam:DetachRolePolicy          | iam :ref:`detach-role-policy`           | `DetachRolePolicy`_          |
   +-------------------------------+-----------------------------------------+------------------------------+
   | iam:DetachUserPolicy          | iam :ref:`detach-user-policy`           | `DetachUserPolicy`_          |
   +-------------------------------+-----------------------------------------+------------------------------+
   | iam:GetGroup                  | iam :ref:`get-group`                    | `GetGroup`_                  |
   +-------------------------------+-----------------------------------------+------------------------------+
   | iam:GetGroupPolicy            | iam :ref:`get-group-policy`             | `GetGroupPolicy`_            |
   +-------------------------------+-----------------------------------------+------------------------------+
   | iam:GetLoginProfile           | iam :ref:`get-login-profile`            | `GetLoginProfile`_           |
   +-------------------------------+-----------------------------------------+------------------------------+
   | iam:GetPolicy                 | iam :ref:`get-policy`                   | `GetPolicy`_                 |
   +-------------------------------+-----------------------------------------+------------------------------+
   | iam:GetPolicyVersion          | iam :ref:`get-policy-version`           | `GetPolicyVersion`_          |
   +-------------------------------+-----------------------------------------+------------------------------+
   | iam:GetRole                   | iam :ref:`get-role`                     | `GetRole`_                   |
   +-------------------------------+-----------------------------------------+------------------------------+
   | iam:GetUser                   | iam :ref:`get-user`                     | `GetUser`_                   |
   +-------------------------------+-----------------------------------------+------------------------------+
   | iam:ListAccessKeys            | iam :ref:`list-access-keys`             | `ListAccessKeys`_            |
   +-------------------------------+-----------------------------------------+------------------------------+
   | iam:ListAttachedGroupPolicies | iam :ref:`list-attached-group-policies` | `ListAttachedGroupPolicies`_ |
   +-------------------------------+-----------------------------------------+------------------------------+
   | iam:ListAttachedRolePolicies  | iam :ref:`list-attached-role-policies`  | `ListAttachedRolePolicies`_  |
   +-------------------------------+-----------------------------------------+------------------------------+
   | iam:ListAttachedUserPolicies  | iam :ref:`list-attached-user-policies`  | `ListAttachedUserPolicies`_  |
   +-------------------------------+-----------------------------------------+------------------------------+
   | iam:ListGroupPolicies         | iam :ref:`list-group-policies`          | `ListGroupPolicies`_         |
   +-------------------------------+-----------------------------------------+------------------------------+
   | iam:ListGroups                | iam :ref:`list-groups`                  | `ListGroups`_                |
   +-------------------------------+-----------------------------------------+------------------------------+
   | iam:ListGroupsForUser         | iam :ref:`list-groups-for-user`         | `ListGroupsForUser`_         |
   +-------------------------------+-----------------------------------------+------------------------------+
   | iam:ListPolicies              | iam :ref:`list-policies`                | `ListPolicies`_              |
   +-------------------------------+-----------------------------------------+------------------------------+
   | iam:ListPolicyVersions        | iam :ref:`list-policy-versions`         | `ListPolicyVersions`_        |
   +-------------------------------+-----------------------------------------+------------------------------+
   | iam:ListRoles                 | iam :ref:`list-roles`                   | `ListRoles`_                 |
   +-------------------------------+-----------------------------------------+------------------------------+
   | iam:ListUsers                 | iam :ref:`list-users`                   | `ListUsers`_                 |
   +-------------------------------+-----------------------------------------+------------------------------+
   | iam:PutGroupPolicy            | iam :ref:`put-group-policy`             | `PutGroupPolicy`_            |
   +-------------------------------+-----------------------------------------+------------------------------+
   | iam:RemoveUserFromGroup       | iam :ref:`remove-user-from-group`       | `RemoveUserFromGroup`_       |
   +-------------------------------+-----------------------------------------+------------------------------+
   | iam:SetDefaultPolicyVersion   | iam :ref:`set-default-policy-version`   | `SetDefaultPolicyVersion`_   |
   +-------------------------------+-----------------------------------------+------------------------------+
   | iam:UpdateLoginProfile        | iam :ref:`update-login-profile`         | `UpdateLoginProfile`_        |
   +-------------------------------+-----------------------------------------+------------------------------+

.. _CreateUser: https://docs.aws.amazon.com/IAM/latest/APIReference/API_CreateUser.html
.. _DeleteUser: https://docs.aws.amazon.com/IAM/latest/APIReference/API_DeleteUser.html
.. _GetUser: https://docs.aws.amazon.com/IAM/latest/APIReference/API_GetUser.html
.. _CreateAccessKey: https://docs.aws.amazon.com/IAM/latest/APIReference/API_CreateAccessKey.html
.. _CreateLoginProfile: https://docs.aws.amazon.com/IAM/latest/APIReference/API_CreateLoginProfile.html
.. _DeleteAccessKey: https://docs.aws.amazon.com/IAM/latest/APIReference/API_DeleteAccessKey.html
.. _ListAccessKeys: https://docs.aws.amazon.com/IAM/latest/APIReference/API_ListAccessKeys.html
.. _CreateGroup: https://docs.aws.amazon.com/IAM/latest/APIReference/API_CreateGroup.html
.. _AddUserToGroup: https://docs.aws.amazon.com/IAM/latest/APIReference/API_AddUserToGroup.html
.. _DeleteGroup: https://docs.aws.amazon.com/IAM/latest/APIReference/API_DeleteGroup.html
.. _GetGroup: https://docs.aws.amazon.com/IAM/latest/APIReference/API_GetGroup.html
.. _ListGroups: https://docs.aws.amazon.com/IAM/latest/APIReference/API_ListGroups.html
.. _ListGroupsForUser: https://docs.aws.amazon.com/IAM/latest/APIReference/API_ListGroupsForUser.html
.. _CreatePolicy: https://docs.aws.amazon.com/IAM/latest/APIReference/API_CreatePolicy.html
.. _CreatePolicyVersion: https://docs.aws.amazon.com/IAM/latest/APIReference/API_CreatePolicyVersion.html
.. _DeletePolicy: https://docs.aws.amazon.com/IAM/latest/APIReference/API_DeletePolicy.html
.. _DeletePolicyVersion: https://docs.aws.amazon.com/IAM/latest/APIReference/API_DeletePolicyVersion.html
.. _GetPolicy: https://docs.aws.amazon.com/IAM/latest/APIReference/API_GetPolicy.html
.. _GetPolicyVersion: https://docs.aws.amazon.com/IAM/latest/APIReference/API_GetPolicyVersion.html
.. _ListPolicies: https://docs.aws.amazon.com/IAM/latest/APIReference/API_ListPolicies.html
.. _ListPolicyVersions: https://docs.aws.amazon.com/IAM/latest/APIReference/API_ListPolicyVersions.html
.. _SetDefaultPolicyVersion: https://docs.aws.amazon.com/IAM/latest/APIReference/API_SetDefaultPolicyVersion.html
.. _DeleteGroupPolicy: https://docs.aws.amazon.com/IAM/latest/APIReference/API_DeleteGroupPolicy.html
.. _GetGroupPolicy: https://docs.aws.amazon.com/IAM/latest/APIReference/API_GetGroupPolicy.html
.. _ListGroupPolicies: https://docs.aws.amazon.com/IAM/latest/APIReference/API_ListGroupPolicies.html
.. _PutGroupPolicy: https://docs.aws.amazon.com/IAM/latest/APIReference/API_PutGroupPolicy.html
.. _AttachGroupPolicy: https://docs.aws.amazon.com/IAM/latest/APIReference/API_AttachGroupPolicy.html
.. _DetachGroupPolicy: https://docs.aws.amazon.com/IAM/latest/APIReference/API_DetachGroupPolicy.html
.. _GetGroupPolicy: https://docs.aws.amazon.com/IAM/latest/APIReference/API_GetGroupPolicy.html
.. _ListAttachedGroupPolicies: https://docs.aws.amazon.com/IAM/latest/APIReference/API_ListAttachedGroupPolicies.html
.. _ListAttachedRolePolicies: https://docs.aws.amazon.com/IAM/latest/APIReference/API_ListAttachedRolePolicies.html
.. _ListAttachedUserPolicies: https://docs.aws.amazon.com/IAM/latest/APIReference/API_ListAttachedUserPolicies.html
.. _ListAttachedUserPolicies: https://docs.aws.amazon.com/IAM/latest/APIReference/API_ListAttachedUserPolicies.html
.. _AttachUserPolicy: https://docs.aws.amazon.com/IAM/latest/APIReference/API_AttachUserPolicy.html
.. _DetachUserPolicy: https://docs.aws.amazon.com/IAM/latest/APIReference/API_DetachUserPolicy.html
.. _AttachRolePolicy: https://docs.aws.amazon.com/IAM/latest/APIReference/API_AttachRolePolicy.html
.. _CreateRole: https://docs.aws.amazon.com/IAM/latest/APIReference/API_CreateRole.html
.. _DeleteRole: https://docs.aws.amazon.com/IAM/latest/APIReference/API_DeleteRole.html
.. _DetachRolePolicy: https://docs.aws.amazon.com/IAM/latest/APIReference/API_DetachRolePolicy.html
.. _GetRole: https://docs.aws.amazon.com/IAM/latest/APIReference/API_GetRole.html
.. _ListRoles: https://docs.aws.amazon.com/IAM/latest/APIReference/API_ListRoles.html
.. _ListUsers: https://docs.aws.amazon.com/IAM/latest/APIReference/API_ListUsers.html
.. _RemoveUserFromGroup: https://docs.aws.amazon.com/IAM/latest/APIReference/API_RemoveUserFromGroup.html
.. _DeleteLoginProfile: https://docs.aws.amazon.com/IAM/latest/APIReference/API_DeleteLoginProfile.html
.. _GetLoginProfile: https://docs.aws.amazon.com/IAM/latest/APIReference/API_GetLoginProfile.html
.. _UpdateLoginProfile: https://docs.aws.amazon.com/IAM/latest/APIReference/API_UpdateLoginProfile.html


Supported STS Actions
---------------------

.. tabularcolumns::X{0.10\textwidth}X{0.70\textwidth}X{0.15\textwidth}
.. table::
   :widths: auto
   :class: longtable

   +----------------+------------------------------------+----------------------+
   | This Action... | Allows This aws-cli Subcommand...  | Which Calls This API |
   +================+====================================+======================+
   | sts:AssumeRole | sts :ref:`assume-role`             | `AssumeRole`_        |
   +----------------+------------------------------------+----------------------+

.. _AssumeRole: https://docs.aws.amazon.com/STS/latest/APIReference/API_AssumeRole.html


UTAPI Actions
-------------

The Utilization API (UTAPI) tracks resource utilization and reports metrics. It
cannot be queried with either aws-cli or any AWS SDK.

utapi:ListMetrics
~~~~~~~~~~~~~~~~~

The ``utapi:ListMetrics`` action permits the listing of the :ref:`UTAPI
metrics<Service Utilization API>`.
