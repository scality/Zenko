.. _get-group:

get-group
=========

Returns a list of IAM users that are in the specified IAM group. You can
paginate the results using the ``MaxItems`` and ``Marker`` parameters.

See also: :ref:`GetGroup`.

See `aws help <https://docs.aws.amazon.com/cli/latest/reference/index.html>`_
for descriptions of global parameters.

``get-group`` is a paginated operation. You can issue multiple API calls to
retrieve the entire data set of results. Providing the ``--no-paginate``
argument disables pagination. When using ``--output text`` and the ``--query``
argument on a paginated response, use the ``--query`` argument to extract data
from the results of the ``Users`` query expression.

Synopsis
--------

::

  get-group
    --group-name <value>
    [--max-items <value>]
    [--cli-input-json <value>]
    [--starting-token <value>]
    [--page-size <value>]

Options
-------

``--group-name`` (string)

  The name of the group.

  This parameter allows (through its regex pattern) a string of characters
  consisting of upper and lowercase alphanumeric characters with no spaces. You
  can also include any of the following characters: ``_``, ``+``, ``=``, ``,``,
  ``.``, ``@``, and ``-``.

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

  Performs service operation based on the JSON string provided. If other
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

**To get an IAM group**

This example returns details about the IAM group ``Admins``::

  aws iam get-group --group-name Admins

Output::

  {
      "Group": {
          "Path": "/",
          "CreateDate": "2015-06-16T19:41:48Z",
          "GroupId": "AIDGPMS9RO4H3FEXAMPLE",
          "Arn": "arn:aws:iam::123456789012:group/Admins",
          "GroupName": "Admins"
      },
	  "Users": []
  }

For more information, see `IAM Users and Groups`_ in the *Using IAM* guide.

.. _`IAM Users and Groups`: http://docs.aws.amazon.com/IAM/latest/UserGuide/Using_WorkingWithGroupsAndUsers.html

Output
------

Group -> (structure)

  A structure that contains details about the group.

  Path -> (string)

    The path to the group. For more information about paths, see `IAM
    Identifiers
    <https://docs.aws.amazon.com/IAM/latest/UserGuide/Using_Identifiers.html>`__
    in the *Using IAM* guide.

  GroupName -> (string)

    The friendly name that identifies the group.

  GroupId -> (string)

    The stable and unique string identifying the group. For more information
    about IDs, see `IAM Identifiers
    <https://docs.aws.amazon.com/IAM/latest/UserGuide/Using_Identifiers.html>`__
    in the *Using IAM* guide.

  Arn -> (string)

    The Amazon Resource Name (ARN) specifying the group. For more information
    about ARNs and how to use them in policies, see `IAM Identifiers
    <https://docs.aws.amazon.com/IAM/latest/UserGuide/Using_Identifiers.html>`__
    in the *Using IAM* guide.

  CreateDate -> (timestamp)

    The date and time, in `ISO 8601 date-time format
    <http://www.iso.org/iso/iso8601>`__, when the group was created.

Users -> (list)

  A list of users in the group.

  (structure)

    Contains information about an IAM user entity.

    This data type is used as a response element in the following operations:

    *  CreateUser   

    *  GetUser   

    *  ListUsers   

    Path -> (string)

      The path to the user. For more information about paths, see `IAM
      Identifiers
      <https://docs.aws.amazon.com/IAM/latest/UserGuide/Using_Identifiers.html>`__
      in the *Using IAM* guide.

    UserName -> (string)

      The friendly name identifying the user.

    UserId -> (string)

      The stable and unique string identifying the user. For more information
      about IDs, see `IAM Identifiers
      <https://docs.aws.amazon.com/IAM/latest/UserGuide/Using_Identifiers.html>`__
      in the *Using IAM* guide.

    Arn -> (string)

      The Amazon Resource Name (ARN) that identifies the user. For more
      information about ARNs and how to use ARNs in policies, see `IAM
      Identifiers
      <https://docs.aws.amazon.com/IAM/latest/UserGuide/Using_Identifiers.html>`__
      in the *Using IAM* guide.

    CreateDate -> (timestamp)

      The date and time, in `ISO 8601 date-time format
      <http://www.iso.org/iso/iso8601>`__, when the user was created.

    PasswordLastUsed -> (timestamp)

      The date and time, in `ISO 8601 date-time format
      <http://www.iso.org/iso/iso8601>`__, when the user's password was last
      used to sign in to an AWS website. For a list of AWS websites that capture
      a user's last sign-in time, see the `Credential Reports
      <https://docs.aws.amazon.com/IAM/latest/UserGuide/credential-reports.html>`__
      topic in the *Using IAM* guide. If a password is used more than once in a
      five-minute span, only the first use is returned in this field. If the
      field is null (no value), then it indicates that they never signed in with
      a password. This can be because:

      * The user never had a password. 

      * A password exists but has not been used since IAM started tracking this
        information on October 20, 2014.

      A null value does not mean that the user *never* had a password. Also, if
      the user does not currently have a password, but had one in the past, then
      this field contains the date and time the most recent password was used.

      This value is returned only in the  GetUser and  ListUsers operations. 

    PermissionsBoundary -> (structure)

      The ARN of the policy used to set the permissions boundary for the user.

      For more information about permissions boundaries, see `Permissions
      Boundaries for IAM Identities
      <https://docs.aws.amazon.com/IAM/latest/UserGuide/access_policies_boundaries.html>`__
      in the *IAM User Guide*.

      PermissionsBoundaryType -> (string)

        The permissions boundary usage type that indicates what type of IAM
        resource is used as the permissions boundary for an entity. This data
        type can only have a value of ``Policy``.

      PermissionsBoundaryArn -> (string)

        The ARN of the policy used to set the permissions boundary for the user or role.

    Tags -> (list)

      A list of tags that are associated with the specified user. For more
      information about tagging, see `Tagging IAM Identities
      <https://docs.aws.amazon.com/IAM/latest/UserGuide/id_tags.html>`__ in the
      *IAM User Guide*.

      (structure)

        A structure that represents user-provided metadata that can be
        associated with a resource such as an IAM user or role. For more
        information about tagging, see `Tagging IAM Identities
        <https://docs.aws.amazon.com/IAM/latest/UserGuide/id_tags.html>`__ in
        the *IAM User Guide*.

        Key -> (string)

          The key name that can be used to look up or retrieve the associated
          value. For example, ``Department`` or ``Cost Center`` are common
          choices.

        Value -> (string)

          The value associated with this tag. For example, tags with a key name
          of ``Department`` could have values such as ``Human Resources``,
          ``Accounting``, and ``Support``. Tags with a key name of ``Cost
          Center`` might have values that consist of the number associated with
          the different cost centers in your company. Typically, many resources
          have tags with the same key name but with different values.

          .. note::
	     
            AWS always interprets the tag ``Value`` as a single string. If you
            need to store an array, you can store comma-separated values in the
            string. However, you must interpret the value in your code.

             

          

          

        

IsTruncated -> (Boolean)

  A flag that indicates whether there are more items to return. If your results were truncated, you can make a subsequent pagination request using the ``Marker`` request parameter to retrieve more items. Note that IAM might return fewer than the ``MaxItems`` number of results even when there are more results available. We recommend that you check ``IsTruncated`` after every call to ensure that you receive all your results.

Marker -> (string)

  When ``IsTruncated`` is ``true``, this element is present and contains the value to use for the ``Marker`` parameter in a subsequent pagination request.

