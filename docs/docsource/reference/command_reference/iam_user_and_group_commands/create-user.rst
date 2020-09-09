.. _create-user:

create-user
===========

Creates a new IAM user for your AWS account.

For information about limitations on the number of IAM users you can create, see
`Limitations on IAM Entities
<https://docs.aws.amazon.com/IAM/latest/UserGuide/LimitationsOnEntities.html>`__
in the *IAM User Guide*.

See also: :ref:`Create User`.

See `aws help <https://docs.aws.amazon.com/cli/latest/reference/index.html>`_ for
descriptions of global parameters.

Synopsis
--------

::

  create-user
    [--path <value>]
    --user-name <value>
    [--permissions-boundary <value>]
    [--tags <value>]
    [--cli-input-json <value>]

Options
-------

``--path`` (string)

  The path for the user name. For more information about paths, see `IAM
  Identifiers
  <https://docs.aws.amazon.com/IAM/latest/UserGuide/Using_Identifiers.html>`__
  in the *IAM User Guide*.

  This parameter is optional. If it is not included, it defaults to a slash (/).

  This parameter allows (through its regex pattern)
  a string of characters consisting of
  either a forward slash (/) by itself or a string that must begin and end with
  forward slashes. In addition, it can contain any ASCII character from the "!"
  (\u0021) through the DEL character (\u007F), including most punctuation
  characters, digits, and upper and lowercased letters.

``--user-name`` (string)

  The name of the user to create.

  IAM user, group, role, and policy names must be unique within the
  account. Names are not distinguished by case. For example, you cannot create
  resources named both "MyResource" and "myresource".

``--permissions-boundary`` (string)

  The ARN of the policy that is used to set the permissions boundary for the user.

``--tags`` (list)

  A list of tags that you want to attach to the newly created user. Each tag
  consists of a key name and an associated value. For more information about
  tagging, see `Tagging IAM Identities
  <https://docs.aws.amazon.com/IAM/latest/UserGuide/id_tags.html>`__ in the *IAM
  User Guide*.

  .. note::

    If any one of the tags is invalid or if you exceed the allowed number of
    tags per user, then the entire request fails and the user is not created.

Shorthand Syntax::

    Key=string,Value=string ...

JSON Syntax::

  [
    {
      "Key": "string",
      "Value": "string"
    }
    ...
  ]

``--cli-input-json`` (string)

  Performs service operation based on the JSON string provided. 
  If other arguments
  are provided on the command line, the CLI values will override the
  JSON-provided values. It is not possible to pass arbitrary binary values using
  a JSON-provided value as the string will be taken literally.

See `aws help <https://docs.aws.amazon.com/cli/latest/reference/index.html>`_ for descriptions of global parameters.

Examples
--------

**To create an IAM user**

The following ``create-user`` command creates an IAM user named ``Bob`` in the
current account::

  aws iam create-user --user-name Bob

Output::

  {
      "User": {
          "UserName": "Bob",
          "Path": "/",
          "CreateDate": "2013-06-08T03:20:41.270Z",
          "UserId": "AIDAIOSFODNN7EXAMPLE",
          "Arn": "arn:aws:iam::123456789012:user/Bob"
      }
  }

For more information, see `Adding a New User to Your AWS Account`_ in the *Using
IAM* guide.

.. _`Adding a New User to Your AWS Account`: http://docs.aws.amazon.com/IAM/latest/UserGuide/Using_SettingUpUser.html

Output
------

User -> (structure)

  A structure with details about the new IAM user.

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

    This value is returned only in the  GetUser and  ListUsers operations. 

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
        ``Department`` could have values such as ``Human Resources`` ,
        ``Accounting``, and ``Support``. Tags with a key name of ``Cost
        Center`` might have values that consist of the number associated with
        the different cost centers in your company. Typically, many resources
        have tags with the same key name but with different values.

        .. note::

          AWS always interprets the tag ``Value`` as a single string. If you
          need to store an array, you can store comma-separated values in the
          string. However, you must interpret the value in your code.

           

        

        

