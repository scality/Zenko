.. _list-entities-for-policy:

list-entities-for-policy
========================

Lists all IAM users, groups, and roles that the specified managed policy is
attached to.

You can use the optional ``EntityFilter`` parameter to limit the results to a
particular type of entity (users, groups, or roles). For example, to list only
the roles that are attached to the specified policy, set ``EntityFilter`` to
``Role``.

You can paginate the results using the ``MaxItems`` and ``Marker`` parameters.

See also: `AWS API Documentation
<https://docs.aws.amazon.com/goto/WebAPI/iam-2010-05-08/ListEntitiesForPolicy>`_.

See `aws help <https://docs.aws.amazon.com/cli/latest/reference/index.html>`_
for descriptions of global parameters.

``list-entities-for-policy`` is a paginated operation. Multiple API calls may be
issued in order to retrieve the entire data set of results. You can disable
pagination by providing the ``--no-paginate`` argument. When using ``--output
text`` and the ``--query`` argument on a paginated response, the ``--query``
argument must extract data from the results of the following query expressions:
``PolicyGroups``, ``PolicyUsers``, ``PolicyRoles``.

Synopsis
--------

::

  list-entities-for-policy
    --policy-arn <value>
    [--entity-filter <value>]
    [--path-prefix <value>]
    [--policy-usage-filter <value>]
    [--max-items <value>]
    [--cli-input-json <value>]
    [--starting-token <value>]
    [--page-size <value>]

Options
-------

``--policy-arn`` (string)

  The Amazon Resource Name (ARN) of the IAM policy for which you want the
  versions.

  For more information about ARNs, see `Amazon Resource Names (ARNs) and AWS
  Service Namespaces
  <https://docs.aws.amazon.com/general/latest/gr/aws-arns-and-namespaces.html>`__
  in the *AWS General Reference*.

``--entity-filter`` (string)

  The entity type to use for filtering the results.

  For  example, when  ``EntityFilter``  is  ``Role``, only  the  roles that  are
  attached to the specified policy are  returned. This parameter is optional. If
  it  is not  included, all  attached entities  (users, groups,  and roles)  are
  returned. The  argument for  this parameter  must be one  of the  valid values
  listed below.

  Possible values:

  *   ``User``

  *   ``Role``

  *   ``Group``

  *   ``LocalManagedPolicy``

  *   ``AWSManagedPolicy``

``--path-prefix`` (string)

  The path prefix for filtering the results. This parameter is optional. If it
  is not included, it defaults to a slash (/), listing all entities.

  This parameter allows (through its regex pattern) a string of characters
  consisting of either a forward slash (/) by itself or a string that must begin
  and end with forward slashes. In addition, it can contain any ASCII character
  from the "!" (\u0021) through the DEL character (\u007F), including most
  punctuation characters, digits, and upper and lowercased letters.

``--policy-usage-filter`` (string)

  The policy usage method to use for filtering the results.

  To list only permissions policies, set ``PolicyUsageFilter`` to
  ``PermissionsPolicy``. To list only the policies used to set permissions
  boundaries, set the value to ``PermissionsBoundary``.

  This parameter is optional. If it is not included, all policies are returned.

  Possible values:

  *   ``PermissionsPolicy``

  *   ``PermissionsBoundary``

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

**To list all users, groups, and roles that the specified managed policy is attached to**

This example returns a list of IAM groups, roles, and users who have the policy
``arn:aws:iam::123456789012:policy/TestPolicy`` attached::

  aws iam list-entities-for-policy --policy-arn arn:aws:iam::123456789012:policy/TestPolicy 

Output::

  {
    "PolicyGroups": [
      {
        "GroupName": "Admins"
      }
    ],
    "PolicyUsers": [
      {
        "UserName": "Bob"
      }
    ],
    "PolicyRoles": [
      {
        "RoleName": "testRole"
      }
    ],
    "IsTruncated": false
  }

For more information, see `Overview of IAM Policies`_ in the *Using IAM* guide.

.. _`Overview of IAM Policies`: http://docs.aws.amazon.com/IAM/latest/UserGuide/policies_overview.html

Output
------

PolicyGroups -> (list)

  A list of IAM groups that the policy is attached to.

  (structure)

    Contains information about a group that a managed policy is attached to.

    This data type is used as a response element in the ListEntitiesForPolicy
    operation.

    For more information about managed policies, refer to `Managed Policies and
    Inline Policies
    <https://docs.aws.amazon.com/IAM/latest/UserGuide/policies-managed-vs-inline.html>`__
    in the *Using IAM* guide.

    GroupName -> (string)

      The name (friendly name, not ARN) identifying the group.

    GroupId -> (string)

      The stable and unique string identifying the group. For more information
      about IDs, see `IAM Identifiers
      <https://docs.aws.amazon.com/IAM/latest/UserGuide/reference_identifiers.html>`__
      in the *IAM User Guide*.

PolicyUsers -> (list)

  A list of IAM users that the policy is attached to.

  (structure)

    Contains information about a user that a managed policy is attached to.

    This data type is used as a response element in the ListEntitiesForPolicy
    operation.

    For more information about managed policies, refer to `Managed Policies and
    Inline Policies
    <https://docs.aws.amazon.com/IAM/latest/UserGuide/policies-managed-vs-inline.html>`__
    in the *Using IAM* guide.

    UserName -> (string)

      The name (friendly name, not ARN) identifying the user.

    UserId -> (string)

      The stable and unique string identifying the user. For more information
      about IDs, see `IAM Identifiers
      <https://docs.aws.amazon.com/IAM/latest/UserGuide/reference_identifiers.html>`__
      in the *IAM User Guide*.

PolicyRoles -> (list)

  A list of IAM roles that the policy is attached to.

  (structure)

    Contains information about a role that a managed policy is attached to.

    This data type is used as a response element in the  ListEntitiesForPolicy operation. 

    For more information about managed policies, refer to `Managed Policies and
    Inline Policies
    <https://docs.aws.amazon.com/IAM/latest/UserGuide/policies-managed-vs-inline.html>`__
    in the *Using IAM* guide.

    RoleName -> (string)

      The name (friendly name, not ARN) identifying the role.

    RoleId -> (string)

      The stable and unique string identifying the role. For more information
      about IDs, see `IAM Identifiers
      <https://docs.aws.amazon.com/IAM/latest/UserGuide/reference_identifiers.html>`__
      in the *IAM User Guide*.

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
