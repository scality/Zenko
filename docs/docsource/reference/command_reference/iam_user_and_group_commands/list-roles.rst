.. _list-roles:

list-roles
==========

Lists the IAM roles that have the specified path prefix. If there are none, the
operation returns an empty list. For more information about roles, go to
`Working with Roles
<https://docs.aws.amazon.com/IAM/latest/UserGuide/WorkingWithRoles.html>`__.

You can paginate the results using the ``MaxItems`` and ``Marker`` parameters.

See also: `AWS API Documentation
<https://docs.aws.amazon.com/goto/WebAPI/iam-2010-05-08/ListRoles>`_.

See `aws help <https://docs.aws.amazon.com/cli/latest/reference/index.html>`_
for descriptions of global parameters.

``list-roles`` is a paginated operation. Multiple API calls may be issued in
order to retrieve the entire data set of results. You can disable pagination by
providing the ``--no-paginate`` argument.  When using ``--output text`` and the
``--query`` argument on a paginated response, the ``--query`` argument must
extract data from the results of the ``Roles`` query expression. 

Synopsis
--------

::

  list-roles
    [--path-prefix <value>]
    [--max-items <value>]
    [--cli-input-json <value>]
    [--starting-token <value>]
    [--page-size <value>]

Options
-------

``--path-prefix`` (string)

  The path prefix for filtering the results. For example, the prefix
  ``/application_abc/component_xyz/`` gets all roles whose path starts with
  ``/application_abc/component_xyz/``.

  This parameter is optional. If it is not included, it defaults to a slash (/),
  listing all roles. This parameter allows (through its regex pattern) a string
  of characters consisting of either a forward slash (/) by itself or a string
  that must begin and end with forward slashes. In addition, it can contain any
  ASCII character from the "!" (\u0021) through the DEL character (\u007F),
  including most punctuation characters, digits, and upper and lowercased
  letters.

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

**To list IAM roles for the current account**

The following ``list-roles`` command lists IAM roles for the current account::

  aws iam list-roles

Output::

  {
    "Roles": [
      {
        "AssumeRolePolicyDocument": {
          "Version": "2012-10-17",
          "Statement": [
            {
              "Action": "sts:AssumeRole",
              "Principal": {
                "Service": "ec2.amazonaws.com"
              },
              "Effect": "Allow",
              "Sid": ""
            }
          ]
        },
        "RoleId": "AROAJ52OTH4H7LEXAMPLE",
        "CreateDate": "2013-05-11T00:02:27Z",
        "RoleName": "ExampleRole1",
        "Path": "/",
        "Arn": "arn:aws:iam::123456789012:role/ExampleRole1"
      },
      {
        "AssumeRolePolicyDocument": {
          "Version": "2012-10-17",
          "Statement": [
            {
              "Action": "sts:AssumeRole",
              "Principal": {
                "Service": "elastictranscoder.amazonaws.com"
              },
              "Effect": "Allow",
              "Sid": ""
            }
          ]
        },
        "RoleId": "AROAI4QRP7UFT7EXAMPLE",
        "CreateDate": "2013-04-18T05:01:58Z",
        "RoleName": "emr-access",
        "Path": "/",
        "Arn": "arn:aws:iam::123456789012:role/emr-access"
      }
    ]
  }

For more information, see `Creating a Role`_ in the *Using IAM* guide.

.. _`Creating a Role`: http://docs.aws.amazon.com/IAM/latest/UserGuide/creating-role.html

Output
------

Roles -> (list)

  A list of roles.

  (structure)

    Contains information about an IAM role. This structure is returned as a
    response element in several API operations that interact with roles.

    Path -> (string)

      The path to the role. For more information about paths, see `IAM
      Identifiers
      <https://docs.aws.amazon.com/IAM/latest/UserGuide/Using_Identifiers.html>`__
      in the *Using IAM* guide.

    RoleName -> (string)

      The friendly name that identifies the role.

    RoleId -> (string)

      The stable and unique string identifying the role. For more information
      about IDs, see `IAM Identifiers
      <https://docs.aws.amazon.com/IAM/latest/UserGuide/Using_Identifiers.html>`__
      in the *Using IAM* guide.

    Arn -> (string)

      The Amazon Resource Name (ARN) specifying the role. For more information
      about ARNs and how to use them in policies, see `IAM Identifiers
      <https://docs.aws.amazon.com/IAM/latest/UserGuide/Using_Identifiers.html>`__
      in the *IAM User Guide* guide.

    CreateDate -> (timestamp)

      The date and time, in `ISO 8601 date-time format
      <http://www.iso.org/iso/iso8601>`__, when the role was created.

    AssumeRolePolicyDocument -> (string)

      The policy that grants an entity permission to assume the role.

    Description -> (string)

      A description of the role that you provide.

    MaxSessionDuration -> (integer)

      The maximum session duration (in seconds) for the specified role. Anyone
      who uses the AWS CLI, or API to assume the role can specify the duration
      using the optional ``DurationSeconds`` API parameter or
      ``duration-seconds`` CLI parameter.

    PermissionsBoundary -> (structure)

      The ARN of the policy used to set the permissions boundary for the role.

      For more information about permissions boundaries, see `Permissions
      Boundaries for IAM Identities
      <https://docs.aws.amazon.com/IAM/latest/UserGuide/access_policies_boundaries.html>`__
      in the *IAM User Guide*.

      PermissionsBoundaryType -> (string)

        The permissions boundary usage type that indicates what type of IAM
        resource is used as the permissions boundary for an entity. This data
        type can only have a value of ``Policy``.

      PermissionsBoundaryArn -> (string)
      
        The ARN of the policy used to set the permissions boundary for the user
        or role.

    Tags -> (list)

      A list of tags that are attached to the specified role. For more
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

  A flag that indicates whether there are more items to return. If your results
  were truncated, you can make a subsequent pagination request using the
  ``Marker`` request parameter to retrieve more items. Note that IAM might
  return fewer than the ``MaxItems`` number of results even when there are more
  results available. We recommend that you check ``IsTruncated`` after every
  call to ensure that you receive all your results.

Marker -> (string)

  When ``IsTruncated`` is ``true``, this element is present and contains the
  value to use for the ``Marker`` parameter in a subsequent pagination request.
