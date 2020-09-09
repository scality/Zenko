.. _list-policy-versions:

list-policy-versions
====================

Lists information about the versions of the specified managed policy, including
the version that is currently set as the policy's default version.

For more information about managed policies, see `Managed Policies and Inline
Policies
<https://docs.aws.amazon.com/IAM/latest/UserGuide/policies-managed-vs-inline.html>`__
in the *IAM User Guide*.

See also: `AWS API Documentation
<https://docs.aws.amazon.com/goto/WebAPI/iam-2010-05-08/ListPolicyVersions>`_.

See `aws help <https://docs.aws.amazon.com/cli/latest/reference/index.html>`_
for descriptions of global parameters.

``list-policy-versions`` is a paginated operation. You can issue multiple API
calls to retrieve the entire data set of results. Providing the
``--no-paginate`` argument disables pagination. When using ``--output text``
and the ``--query`` argument on a paginated response, the ``--query`` argument
must extract data from the results of the ``Versions`` query expression.

Synopsis
--------

::

  list-policy-versions
    --policy-arn <value>
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

See `aws help <https://docs.aws.amazon.com/cli/latest/reference/index.html>`_ for descriptions of global parameters.

Examples
--------

**To list information about the versions of the specified managed policy**

This example returns the list of available versions of the policy whose ARN is
``arn:aws:iam::123456789012:policy/MySamplePolicy``::

  aws iam list-policy-versions --policy-arn arn:aws:iam::123456789012:policy/MySamplePolicy 

Output::

  {
    "IsTruncated": false,
    "Versions": [
      {
        "CreateDate": "2015-06-02T23:19:44Z",
        "VersionId": "v2",
        "IsDefaultVersion": true
      },
      {
        "CreateDate": "2015-06-02T22:30:47Z",
        "VersionId": "v1",
        "IsDefaultVersion": false
      }
    ]
  }

For more information, see `Overview of IAM Policies`_ in the *Using IAM* guide.

.. _`Overview of IAM Policies`: http://docs.aws.amazon.com/IAM/latest/UserGuide/policies_overview.html

Output
------

Versions -> (list)

  A list of policy versions.

  For more information about managed policy versions, see `Versioning for
  Managed Policies
  <https://docs.aws.amazon.com/IAM/latest/UserGuide/policies-managed-versions.html>`__
  in the *IAM User Guide*.

  (structure)

    Contains information about a version of a managed policy.

    This data type is used as a response element in the CreatePolicyVersion,
    GetPolicyVersion, ListPolicyVersions, and GetAccountAuthorizationDetails
    operations.

    For more information about managed policies, refer to `Managed Policies and
    Inline Policies
    <https://docs.aws.amazon.com/IAM/latest/UserGuide/policies-managed-vs-inline.html>`__
    in the *Using IAM* guide.

    Document -> (string)

      The policy document.

      The policy document is returned in the response to the GetPolicyVersion
      and GetAccountAuthorizationDetails operations. It is not returned in the
      response to the CreatePolicyVersion or ListPolicyVersions operations.

      The policy document returned in this structure is URL-encoded compliant
      with `RFC 3986 <https://tools.ietf.org/html/rfc3986>`__. You can use a URL
      decoding method to convert the policy back to plain JSON text. For
      example, if you use Java, you can use the ``decode`` method of the
      ``java.net.URLDecoder`` utility class in the Java SDK. Other languages and
      SDKs provide similar functionality.

    VersionId -> (string)

      The identifier for the policy version.

      Policy version identifiers always begin with ``v`` (always
      lowercase). When a policy is created, the first policy version is ``v1``.

    IsDefaultVersion -> (Boolean)

      Specifies whether the policy version is set as the policy's default
      version.

    CreateDate -> (timestamp)

      The date and time, in `ISO 8601 date-time format
      <http://www.iso.org/iso/iso8601>`__, when the policy version was created.

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

