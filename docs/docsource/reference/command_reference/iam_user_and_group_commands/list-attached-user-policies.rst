.. _list-attached-user-policies:

list-attached-user-policies
===========================

Lists all managed policies that are attached to the specified IAM user.

An IAM user can also have inline policies embedded with it. For information
about policies, see `Managed Policies and Inline Policies
<https://docs.aws.amazon.com/IAM/latest/UserGuide/policies-managed-vs-inline.html>`__
in the *IAM User Guide*.

You can paginate the results using the ``MaxItems`` and ``Marker``
parameters. You can use the ``PathPrefix`` parameter to limit the list of
policies to only those matching the specified path prefix. If there are no
policies attached to the specified group (or none that match the specified path
prefix), the operation returns an empty list.

See also: `AWS API Documentation
<https://docs.aws.amazon.com/goto/WebAPI/iam-2010-05-08/ListAttachedUserPolicies>`_.

``list-attached-user-policies`` is a paginated operation. Multiple API calls may
be issued in order to retrieve the entire data set of results. You can disable
pagination by providing the ``--no-paginate`` argument.  When using ``--output
text`` and the ``--query`` argument on a paginated response, the ``--query``
argument must extract data from the results of the following query expressions:
``AttachedPolicies``

Synopsis
--------

::

  list-attached-user-policies
    --user-name <value>
    [--path-prefix <value>]
    [--max-items <value>]
    [--cli-input-json <value>]
    [--starting-token <value>]
    [--page-size <value>]

Options
-------

``--user-name`` (string)

  The name (friendly name, not ARN) of the user to list attached policies for.

  This parameter allows (through its regex pattern) a string of characters
  consisting of upper and lowercase alphanumeric characters with no spaces. You
  can also include any of the following characters: ``_``, ``+``, ``=``, ``,``,
  ``.``, ``@``, and ``-``.

``--path-prefix`` (string)

  The path prefix for filtering the results. This parameter is optional. If it
  is not included, it defaults to a slash (/), listing all policies.

  This parameter allows (through its regex pattern) a string of characters
  consisting of either a forward slash (/) by itself or a string that must begin
  and end with forward slashes. In addition, it can contain any ASCII character
  from the "!"  (\u0021) through the DEL character (\u007F), including most
  punctuation characters, digits, and upper and lowercased letters.

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

  Performs service operation based on the JSON string provided.  If other
  arguments are provided on the command line, the CLI values will override the
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

**To list all managed policies that are attached to the specified user**

This command returns the names and ARNs of the managed policies for the IAM user
named ``Bob`` in the AWS account::

  aws iam list-attached-user-policies --user-name Bob

Output::

  {
    "AttachedPolicies": [
      {
        "PolicyName": "AdministratorAccess",
        "PolicyArn": "arn:aws:iam::aws:policy/AdministratorAccess"
      },
      {
        "PolicyName": "SecurityAudit",
        "PolicyArn": "arn:aws:iam::aws:policy/SecurityAudit"
      }
    ],
    "IsTruncated": false
  }

For more information, see `Overview of IAM Policies`_ in the *Using IAM* guide.

.. _`Overview of IAM Policies`: http://docs.aws.amazon.com/IAM/latest/UserGuide/policies_overview.html

Output
------

AttachedPolicies -> (list)

  A list of the attached policies.

  (structure)

    Contains information about an attached policy.

    An attached policy is a managed policy that has been attached to a user, If
    other argumentsroup, or role. This data type is used as a response element
    in the ListAttachedGroupPolicies, ListAttachedRolePolicies,
    ListAttachedUserPolicies, and GetAccountAuthorizationDetails operations.

    For more information about managed policies, refer to `Managed Policies and
    Inline Policies
    <https://docs.aws.amazon.com/IAM/latest/UserGuide/policies-managed-vs-inline.html>`__
    in the *Using IAM* guide.

    PolicyName -> (string)

      The friendly name of the attached policy.

    PolicyArn -> (string)

      The Amazon Resource Name (ARN). ARNs are unique identifiers for AWS
      resources.

      For more information about ARNs, go to `Amazon Resource Names (ARNs) and
      AWS Service Namespaces
      <https://docs.aws.amazon.com/general/latest/gr/aws-arns-and-namespaces.html>`__
      in the *AWS General Reference*.

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

