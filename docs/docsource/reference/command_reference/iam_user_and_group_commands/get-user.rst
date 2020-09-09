.. _get-user:

get-user
========

Retrieves information about the specified IAM user, including the user's
creation date, path, unique ID, and ARN.

If you do not specify a user name, IAM determines the user name implicitly based
on the AWS access key ID used to sign the request to this API.

See also: `AWS API Documentation
<https://docs.aws.amazon.com/goto/WebAPI/iam-2010-05-08/GetUser>`_.

See `aws help <https://docs.aws.amazon.com/cli/latest/reference/index.html>`_
for descriptions of global parameters.

Synopsis
--------

::

  get-user
    [--user-name <value>]
    [--cli-input-json <value>]

Options
-------

``--user-name`` (string)

  The name of the user to get information about.

  This parameter is optional. If it is not included, it defaults to the user
  making the request. This parameter allows (through its regex pattern) a string
  of characters consisting of upper and lowercase alphanumeric characters with
  no spaces. You can also include any of the following characters: ``_``, ``+``,
  ``=``, ``,``, ``.``, ``@``, and ``-``.

``--cli-input-json`` (string)

  Performs service operation based on the JSON string provided. If other
  arguments are provided on the command line, the CLI values will override the
  JSON-provided values. It is not possible to pass arbitrary binary values using
  a JSON-provided value as the string will be taken literally.

See `aws help <https://docs.aws.amazon.com/cli/latest/reference/index.html>`_
for descriptions of global parameters.

Examples
--------

**To get information about an IAM user**

The following ``get-user`` command gets information about the IAM user named ``Bob``::

  aws iam get-user --user-name Bob

Output::

  {
      "User": {
          "UserName": "Bob",
          "Path": "/",
          "CreateDate": "2012-09-21T23:03:13Z",
          "UserId": "AKIAIOSFODNN7EXAMPLE",
          "Arn": "arn:aws:iam::123456789012:user/Bob"
      }
  }

For more information, see `Listing Users`_ in the *Using IAM* guide.

.. _`Listing Users`: http://docs.aws.amazon.com/IAM/latest/UserGuide/Using_GetListOfUsers.html

Output
------

User -> (structure)

  A structure containing details about the IAM user.

  .. warning::

    Due to a service issue, password last used data does not include password
    use from May 3, 2018 22:50 PDT to May 23, 2018 14:08 PDT. This affects `last
    sign-in
    <https://docs.aws.amazon.com/IAM/latest/UserGuide/id_credentials_finding-unused.html>`__
    dates shown in the IAM console and password last used dates in the `IAM
    credential report
    <https://docs.aws.amazon.com/IAM/latest/UserGuide/id_credentials_getting-report.html>`__,
    and returned by this GetUser API. If users signed in during the affected
    time, the password last used date that is returned is the date the user last
    signed in before May 3, 2018. For users that signed in after May 23, 2018
    14:08 PDT, the returned password last used date is accurate.

    You can use password last used information to identify unused credentials
    for deletion. For example, you might delete users who did not sign in to AWS
    in the last 90 days. In cases like this, we recommend that you adjust your
    evaluation window to include dates after May 23, 2018. Alternatively, if
    your users use access keys to access AWS programmatically you can refer to
    access key last used information because it is accurate for all dates.

  Path -> (string)

    The path to the user. For more information about paths, see `IAM Identifiers
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
    information about ARNs and how to use ARNs in policies, see `IAM Identifiers
    <https://docs.aws.amazon.com/IAM/latest/UserGuide/Using_Identifiers.html>`__
    in the *Using IAM* guide.

  CreateDate -> (timestamp)

    The date and time, in `ISO 8601 date-time format
    <http://www.iso.org/iso/iso8601>`__, when the user was created.

  PasswordLastUsed -> (timestamp)

    The date and time, in `ISO 8601 date-time format
    <http://www.iso.org/iso/iso8601>`__, when the user's password was last used
    to sign in to an AWS website. For a list of AWS websites that capture a
    user's last sign-in time, see the `Credential Reports
    <https://docs.aws.amazon.com/IAM/latest/UserGuide/credential-reports.html>`__
    topic in the *Using IAM* guide. If a password is used more than once in a
    five-minute span, only the first use is returned in this field. If the field
    is null (no value), then it indicates that they never signed in with a
    password. This can be because:

    * The user never had a password. 

    * A password exists but has not been used since IAM started tracking this
      information on October 20, 2014.

    A null value does not mean that the user *never* had a password. Also, if
    the user does not currently have a password, but had one in the past, then
    this field contains the date and time the most recent password was used.

    This value is returned only in the GetUser and ListUsers operations.

  PermissionsBoundary -> (structure)

    The ARN of the policy used to set the permissions boundary for the user.

    For more information about permissions boundaries, see `Permissions
    Boundaries for IAM Identities
    <https://docs.aws.amazon.com/IAM/latest/UserGuide/access_policies_boundaries.html>`__
    in the *IAM User Guide*.

    PermissionsBoundaryType -> (string)

      The permissions boundary usage type that indicates what type of IAM
      resource is used as the permissions boundary for an entity. This data type
      can only have a value of ``Policy``.

    PermissionsBoundaryArn -> (string)

      The ARN of the policy used to set the permissions boundary for the user or
      role.

  Tags -> (list)

    A list of tags that are associated with the specified user. For more
    information about tagging, see `Tagging IAM Identities
    <https://docs.aws.amazon.com/IAM/latest/UserGuide/id_tags.html>`__ in the
    *IAM User Guide*.

    (structure)

      A structure that represents user-provided metadata that can be associated
      with a resource such as an IAM user or role. For more information about
      tagging, see `Tagging IAM Identities
      <https://docs.aws.amazon.com/IAM/latest/UserGuide/id_tags.html>`__ in the
      *IAM User Guide*.

      Key -> (string)

        The key name that can be used to look up or retrieve the associated
        value. For example, ``Department`` or ``Cost Center`` are common
        choices.
	
      Value -> (string)
      
        The value associated with this tag. For example, tags with a key name of
        ``Department`` could have values such as ``Human Resources``,
        ``Accounting``, and ``Support``. Tags with a key name of ``Cost Center``
        might have values that consist of the number associated with the
        different cost centers in your company. Typically, many resources have
        tags with the same key name but with different values.

        .. note::

          AWS always interprets the tag ``Value`` as a single string. If you
          need to store an array, you can store comma-separated values in the
          string. However, you must interpret the value in your code.
