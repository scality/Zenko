.. _list-policies:

list-policies
=============

Lists all the managed policies that are available in your AWS account, including
your own customer-defined managed policies and all AWS managed policies.

You can filter the list of policies that is returned using the optional
``OnlyAttached``, ``Scope``, and ``PathPrefix`` parameters. For example, to list
only the customer managed policies in your AWS account, set ``Scope`` to
``Local``. To list only AWS managed policies, set ``Scope`` to ``AWS``.

You can paginate the results using the ``MaxItems`` and ``Marker`` parameters.

For more information about managed policies, see `Managed Policies and Inline
Policies
<https://docs.aws.amazon.com/IAM/latest/UserGuide/policies-managed-vs-inline.html>`__
in the *IAM User Guide*.

See also: `AWS API Documentation
<https://docs.aws.amazon.com/goto/WebAPI/iam-2010-05-08/ListPolicies>`_.

See `aws help <https://docs.aws.amazon.com/cli/latest/reference/index.html>`_
for descriptions of global parameters.

``list-policies`` is a paginated operation. Multiple API calls may be issued in
order to retrieve the entire data set of results. You can disable pagination by
providing the ``--no-paginate`` argument. When using ``--output text`` and the
``--query`` argument on a paginated response, the ``--query`` argument must
extract data from the results of the ``Policies`` query expression.

Synopsis
--------

::

  list-policies
    [--scope <value>]
    [--only-attached | --no-only-attached]
    [--path-prefix <value>]
    [--max-items <value>]
    [--cli-input-json <value>]
    [--starting-token <value>]
    [--page-size <value>]

Options
-------

``--scope`` (string)

  The scope to use for filtering the results.

  To list only AWS managed policies, set ``Scope`` to ``AWS``. To list only the
  customer managed policies in your AWS account, set ``Scope`` to ``Local``.

  This parameter is optional. If it is not included, or if it is set to ``All``,
  all policies are returned.

  Possible values:

  *   ``All``

  *   ``AWS``

  *   ``Local``

``--only-attached`` | ``--no-only-attached`` (Boolean)

  A flag to filter the results to only the attached policies.

  When ``OnlyAttached`` is ``true``, the returned list contains only the
  policies that are attached to an IAM user, group, or role. When
  ``OnlyAttached`` is ``false``, or when the parameter is not included, all
  policies are returned.

``--path-prefix`` (string)

  The path prefix for filtering the results. This parameter is optional. If it
  is not included, it defaults to a slash (/), listing all policies. This
  parameter allows (through its regex pattern) a string of characters consisting
  of either a forward slash (/) by itself or a string that must begin and end
  with forward slashes. In addition, it can contain any ASCII character from the
  "!" (\u0021) through the DEL character (\u007F), including most punctuation
  characters, digits, and upper and lowercased letters.

``--max-items`` (integer)

  The total number of items to return in the command's output. If the total
  number of items available is more than the value specified, a ``NextToken`` is
  provided in the command's output. To resume pagination, provide the
  ``NextToken`` value in the ``starting-token`` argument of a subsequent
  command. **Do not** use the ``NextToken`` response element directly outside of
  the AWS CLI.

  For usage examples, see `Pagination
  <https://docs.aws.amazon.com/cli/latest/userguide/pagination.html>`__ in the
  *AWS Command Line Interface User Guide*.

``--cli-input-json`` (string)

  Performs service operation based on the JSON string provided. 
  If other arguments
  are provided on the command line, the CLI values will override the
  JSON-provided values. It is not possible to pass arbitrary binary values using
  a JSON-provided value as the string will be taken literally.

``--starting-token`` (string)

  A token to specify where to start paginating. This is the ``NextToken`` from a
  previously truncated response.

  For usage examples, see `Pagination
  <https://docs.aws.amazon.com/cli/latest/userguide/pagination.html>`__ in the
  *AWS Command Line Interface User Guide*.

``--page-size`` (integer)

  The size of each page to get in the AWS service call. This does not affect the
  number of items returned in the command's output. Setting a smaller page size
  results in more calls to the AWS service, retrieving fewer items in each
  call. This can help prevent the AWS service calls from timing out.

  For usage examples, see `Pagination
  <https://docs.aws.amazon.com/cli/latest/userguide/pagination.html>`__ in the
  *AWS Command Line Interface User Guide*.

See `aws help <https://docs.aws.amazon.com/cli/latest/reference/index.html>`_
for descriptions of global parameters.

Examples
--------

**To list managed policies that are available to your AWS account**

This example returns a collection of the first two managed policies available in
the current AWS account::

  aws iam list-policies --max-items 2

Output::

  {
      "Marker": "AAIWFnoA2MQ9zN9nnTorukxr1uesDIDa4u+q1mEfaurCDZ1AuCYagYfayKYGvu7\
      5BEGk8PooPsw5uvumkuizFACZ8f4rKtN1RuBWiVDBWet2OA==",
	  "IsTruncated": true,
	  "Policies": [
	  {
		  "PolicyName": "AdministratorAccess",
		  "CreateDate": "2015-02-06T18:39:46Z",
		  "AttachmentCount": 5,
		  "IsAttachable": true,
		  "PolicyId": "ANPAIWMBCKSKIEE64ZLYK",
		  "DefaultVersionId": "v1",
		  "Path": "/",
		  "Arn": "arn:aws:iam::aws:policy/AdministratorAccess",
		  "UpdateDate": "2015-02-06T18:39:46Z"
		},
		{
		  "PolicyName": "ASamplePolicy",
          "CreateDate": "2015-06-17T19:23;32Z",
          "AttachmentCount": "0",
          "IsAttachable": "true",
		  "PolicyId": "Z27SI6FQMGNQ2EXAMPLE1",
          "DefaultVersionId": "v1",
		  "Path": "/",
		  "Arn": "arn:aws:iam::123456789012:policy/ASamplePolicy",
		  "UpdateDate": "2015-06-17T19:23:32Z"
		}
	  ]
  }

For more information, see `Overview of IAM Policies`_ in the *Using IAM* guide.

.. _`Overview of IAM Policies`: http://docs.aws.amazon.com/IAM/latest/UserGuide/policies_overview.html

Output
------

Policies -> (list)

  A list of policies.

  (structure)

    Contains information about a managed policy.

    This data type is used as a response element in the CreatePolicy, GetPolicy,
    and ListPolicies operations.

    For more information about managed policies, refer to `Managed Policies and
    Inline Policies
    <https://docs.aws.amazon.com/IAM/latest/UserGuide/policies-managed-vs-inline.html>`__
    in the *Using IAM* guide.

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

      For more information about ARNs, go to `Amazon Resource Names (ARNs) and
      AWS Service Namespaces
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

      The number of entities (users and roles) for which the policy is used to
      set the permissions boundary.

      For more information about permissions boundaries, see `Permissions
      Boundaries for IAM Identities
      <https://docs.aws.amazon.com/IAM/latest/UserGuide/access_policies_boundaries.html>`__
      in the *IAM User Guide*.

    IsAttachable -> (Boolean)

      Specifies whether the policy can be attached to an IAM user, group, or
      role.

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

IsTruncated -> (Boolean)

  A flag that indicates whether there are more items to return. If your results
  were truncated, you can make a subsequent pagination request using the
  ``Marker`` request parameter to retrieve more items. Note that IAM might
  return fewer than the ``MaxItems`` number of results even when there are more
  results available. We recommend that you check ``IsTruncated`` after every
  call to ensure that you receive all your results.

Marker -> (string)

  When ``IsTruncated`` is ``true``, this element is present and contains the
  value to use for the ``Marker`` parameter in a subsequent pagination request.
