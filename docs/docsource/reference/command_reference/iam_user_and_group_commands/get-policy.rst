.. _get-policy:

get-policy
==========

Retrieves information about the specified managed policy, including the policy's
default version and the total number of IAM users, groups, and roles to which
the policy is attached. To retrieve the list of the specific users, groups, and
roles that the policy is attached to, use the ListEntitiesForPolicy API. This
API returns metadata about the policy. To retrieve the actual policy document
for a specific version of the policy, use GetPolicyVersion.

This API retrieves information about managed policies. To retrieve information
about an inline policy that is embedded with an IAM user, group, or role, use
the GetUserPolicy, GetGroupPolicy, or GetRolePolicy API.

For more information about policies, see `Managed Policies and Inline Policies
<https://docs.aws.amazon.com/IAM/latest/UserGuide/policies-managed-vs-inline.html>`__
in the *IAM User Guide*.

See also: `AWS API Documentation
<https://docs.aws.amazon.com/goto/WebAPI/iam-2010-05-08/GetPolicy>`_.

Synopsis
--------

::

  get-policy
    --policy-arn <value>
    [--cli-input-json <value>]

Options
-------

``--policy-arn`` (string)

  The Amazon Resource Name (ARN) of the managed policy that you want information about.

  For more information about ARNs, see `Amazon Resource Names (ARNs) and AWS
  Service Namespaces
  <https://docs.aws.amazon.com/general/latest/gr/aws-arns-and-namespaces.html>`__
  in the *AWS General Reference*.

``--cli-input-json`` (string)

  Performs service operation based on the JSON string provided.  If other
  arguments are provided on the command line, the CLI values will override the
  JSON-provided values. It is not possible to pass arbitrary binary values using
  a JSON-provided value as the string will be taken literally.

See `aws help <https://docs.aws.amazon.com/cli/latest/reference/index.html>`_
for descriptions of global parameters.

Examples
--------

**To retrieve information about the specified managed policy**

This example returns details about the managed policy whose ARN is
``arn:aws:iam::123456789012:policy/MySamplePolicy``::

  aws iam get-policy --policy-arn arn:aws:iam::123456789012:policy/MySamplePolicy

Output::

  {
      "Policy": {
          "PolicyName": "MySamplePolicy",
          "CreateDate": "2015-06-17T19:23;32Z",
          "AttachmentCount": "0",
          "IsAttachable": "true",
		  "PolicyId": "Z27SI6FQMGNQ2EXAMPLE1",
          "DefaultVersionId": "v1",
		  "Path": "/",
		  "Arn": "arn:aws:iam::123456789012:policy/MySamplePolicy",
		  "UpdateDate": "2015-06-17T19:23:32Z"
      }
  }

For more information, see `Overview of IAM Policies`_ in the *Using IAM* guide.

.. _`Overview of IAM Policies`: http://docs.aws.amazon.com/IAM/latest/UserGuide/policies_overview.html

Output
------

Policy -> (structure)

  A structure containing details about the policy.

  PolicyName -> (string)

    The friendly name (not ARN) identifying the policy.

  PolicyId -> (string)

    The stable and unique string identifying the policy.

    For more information about IDs, see `IAM Identifiers
    <https://docs.aws.amazon.com/IAM/latest/UserGuide/Using_Identifiers.html>`__
    in the *Using IAM* guide.

  Arn -> (string)

    The Amazon Resource Name (ARN). ARNs are unique identifiers for AWS
    resources.

    For more information about ARNs, go to `Amazon Resource Names (ARNs) and AWS
    Service Namespaces
    <https://docs.aws.amazon.com/general/latest/gr/aws-arns-and-namespaces.html>`__
    in the *AWS General Reference*.

  Path -> (string)

    The path to the policy.

    For more information about paths, see `IAM Identifiers
    <https://docs.aws.amazon.com/IAM/latest/UserGuide/Using_Identifiers.html>`__
    in the *Using IAM* guide.

  DefaultVersionId -> (string)

    The identifier for the version of the policy that is set as the default
    version.

  AttachmentCount -> (integer)

    The number of entities (users, groups, and roles) that the policy is
    attached to.

  PermissionsBoundaryUsageCount -> (integer)

    The number of entities (users and roles) for which the policy is used to set
    the permissions boundary.

    For more information about permissions boundaries, see `Permissions
    Boundaries for IAM Identities
    <https://docs.aws.amazon.com/IAM/latest/UserGuide/access_policies_boundaries.html>`__
    in the *IAM User Guide*.

  IsAttachable -> (Boolean)

    Specifies whether the policy can be attached to an IAM user, group, or role.

  Description -> (string)

    A friendly description of the policy.

    This element is included in the response to the GetPolicy operation. It is
    not included in the response to the ListPolicies operation.

  CreateDate -> (timestamp)

    The date and time, in `ISO 8601 date-time format
    <http://www.iso.org/iso/iso8601>`__, when the policy was created.

  UpdateDate -> (timestamp)

    The date and time, in `ISO 8601 date-time format
    <http://www.iso.org/iso/iso8601>`__, when the policy was last updated.

    When a policy has only one version, this field contains the date and time
    when the policy was created. When a policy has more than one version, this
    field contains the date and time when the most recent policy version was
    created.

