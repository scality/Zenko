Vault/IAM API
=============

This section details the Vault service's command set and application programming
interface for the Zenko. The Vault handles Zenko account
authentication and provides secure storage for all identity- and
authentication-related information.

You can make calls to Vault as an AWS IAM web service using standard AWS SDK
commands. Zenko accounts are created using the vaultclient API; however,
once an account is created, standard IAM commands are used to create and manage
account users, groups, and access keys for the users. IAM policies can also be
managed and attached to or detached from Vault users and groups.

Refer to Zenko Operations for more information about creating and managing account users,
groups, and access keys.

Users are expected to use S3 Console GUI commands for most Vault actions.
However, some actions remain under development and are not yet available in the
S3 Console, and for others demanding greater control (granularity and
repeatability) over their workflows, Zenko tasks—including Vault
tasks—can also be managed through Ansible scripts driven by ansible-playbook
commands. These commands, as well as sample YAML scripts, are provided as
appropriate in :version-ref:`Zenko Operation
<https://documentation.scality.com/S3C/{version}/operation/index.html>`. Most
opportunities for scripted mainenance involve IAM commands for users, groups,
and policies after accounts have been created with vaultclient (using the S3
Console, live command entries, or YAML scripts).

.. important::

   Vault does not support AWS Signature V2 for IAM. For IAM interactions with
   Vault, use AWS Signature V4 only.

For more information about creating and managing account users, groups, roles,
and access keys, see :version-ref:`Managing IAM User, Groups, and Policies<https://documentation.scality.com/S3C/{version}/operation/Use/Using_IAM/Managing_IAM_Users_Groups_Policies_and_Roles/index.html>`.
	     
.. toctree::
   :maxdepth: 2

   entity_related_operations/index
   non_entity_related_operations/index
