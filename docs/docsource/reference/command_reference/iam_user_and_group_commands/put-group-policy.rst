.. _put-group-policy:

put-group-policy
================

Adds or updates an inline policy document that is embedded in the specified IAM
group.

A user can also have managed policies attached to it. To attach a managed policy
to a group, use AttachGroupPolicy. To create a new managed policy, use
CreatePolicy. For information about policies, see `Managed Policies and Inline
Policies
<https://docs.aws.amazon.com/IAM/latest/UserGuide/policies-managed-vs-inline.html>`__
in the *IAM User Guide*.

For information about limits on the number of inline policies that you can embed
in a group, see `Limitations on IAM Entities
<https://docs.aws.amazon.com/IAM/latest/UserGuide/LimitationsOnEntities.html>`__
in the *IAM User Guide*.

.. note::

  Because policy documents can be large, you should use POST rather than GET
  when calling ``PutGroupPolicy``. For general information about using the Query
  API with IAM, go to `Making Query Requests
  <https://docs.aws.amazon.com/IAM/latest/UserGuide/IAM_UsingQueryAPI.html>`__
  in the *IAM User Guide*.

See also: `AWS API Documentation
<https://docs.aws.amazon.com/goto/WebAPI/iam-2010-05-08/PutGroupPolicy>`_.

See `aws help <https://docs.aws.amazon.com/cli/latest/reference/index.html>`_
for descriptions of global parameters.

Synopsis
--------

::

  put-group-policy
    --group-name <value>
    --policy-name <value>
    --policy-document <value>
    [--cli-input-json <value>]

Options
-------

``--group-name`` (string)

  The name of the group to associate the policy with.

  This parameter allows (through its regex pattern) a string of characters
  consisting of upper and lowercase alphanumeric characters with no spaces. You
  can also include any of the following characters: ``_``, ``+``, ``=``, ``,``,
  ``.``, ``@``, and ``-``..

``--policy-name`` (string)

  The name of the policy document.

  This parameter allows (through its regex pattern) a string of characters
  consisting of upper and lowercase alphanumeric characters with no spaces. You
  can also include any of the following characters: ``_``, ``+``, ``=``, ``,``,
  ``.``, ``@``, and ``-``.

``--policy-document`` (string)

  The policy document.

  You must provide policies in JSON format in IAM. However, for AWS
  CloudFormation templates formatted in YAML, you can provide the policy in JSON
  or YAML format. AWS CloudFormation always converts a YAML policy to JSON
  format before submitting it to IAM.

  The regex pattern used to validate this
  parameter is a string of characters consisting of the following:

  * Any printable ASCII character ranging from the space character (\u0020)
    through the end of the ASCII character range

  * The printable characters in the Basic Latin and Latin-1 Supplement character
    set (through \u00FF)

  * The special characters tab (\u0009), line feed (\u000A), and carriage return
    (\u000D)

``--cli-input-json`` (string)

  Performs service operation based on the JSON string provided. If other
  arguments are provided on the command line, the CLI values will override the
  JSON-provided values. It is not possible to pass arbitrary binary values using
  a JSON-provided value as the string will be taken literally.

See `aws help <https://docs.aws.amazon.com/cli/latest/reference/index.html>`_
for descriptions of global parameters.

Examples
--------

**To add a policy to a group**

The following ``put-group-policy`` command adds a policy to the IAM group named
``Admins``::

  aws iam put-group-policy --group-name Admins --policy-document file://AdminPolicy.json --policy-name AdminRoot

The policy is defined as a JSON document in the *AdminPolicy.json* file. (The
file name and extension do not have significance.)

For more information, see `Managing IAM Policies`_ in the *Using IAM* guide.

.. _`Managing IAM Policies`: http://docs.aws.amazon.com/IAM/latest/UserGuide/ManagingPolicies.html

Output
------

None
