.. _create-role:

create-role
===========

Creates a new role for your AWS account. For more information about roles, go to
`IAM Roles
<https://docs.aws.amazon.com/IAM/latest/UserGuide/WorkingWithRoles.html>`__.
For information about limitations on role names and the number of roles you can
create, go to `Limitations on IAM Entities
<https://docs.aws.amazon.com/IAM/latest/UserGuide/LimitationsOnEntities.html>`__
in the *IAM User Guide*.

See also: :ref:`CreateRole`.

See `aws help <https://docs.aws.amazon.com/cli/latest/reference/index.html>`_
for descriptions of global parameters.

Synopsis
--------

::

  create-role
    [--path <value>]
    --role-name <value>
    --assume-role-policy-document <value>
    [--description <value>]
    [--max-session-duration <value>]
    [--permissions-boundary <value>]
    [--tags <value>]
    [--cli-input-json <value>]

Options
-------

``--path`` (string)

  The path to the role. For more information about paths, see `IAM Identifiers
  <https://docs.aws.amazon.com/IAM/latest/UserGuide/Using_Identifiers.html>`__
  in the *IAM User Guide*.

  This parameter is optional. If it is not included, it defaults to a slash (/).

  This parameter allows (through its regex pattern) a string of characters
  consisting of either a forward slash (/) by itself or a string that must begin
  and end with forward slashes. In addition, it can contain any ASCII character
  from the "!" (\u0021) through the DEL character (\u007F), including most
  punctuation characters, digits, and upper and lowercased letters.

``--role-name`` (string)

  The name of the role to create.

  IAM user, group, role, and policy names must be unique within the
  account. Names are not distinguished by case. For example, you cannot create
  resources named both "MyResource" and "myresource".

``--assume-role-policy-document`` (string)

  The trust relationship policy document that grants an entity permission to
  assume the role.

  In IAM, you must provide a JSON policy that has been converted to a
  string. However, for AWS CloudFormation templates formatted in YAML, you can
  provide the policy in JSON or YAML format. AWS CloudFormation always converts
  a YAML policy to JSON format before submitting it to IAM.

  The regex pattern used to validate this
  parameter is a string of characters consisting of the following:

  * Any printable ASCII character ranging from the space character (\u0020)
    through the end of the ASCII character range

  * The printable characters in the Basic Latin and Latin-1 Supplement character
    set (through \u00FF)

  * The special characters tab (\u0009), line feed (\u000A), and carriage return
    (\u000D)

  Upon success, the response includes the same trust policy as a URL-encoded
  JSON string.

``--description`` (string)

  A description of the role.

``--max-session-duration`` (integer)

  The maximum session duration (in seconds) that you want to set for the
  specified role. If you do not specify a value for this setting, the default
  maximum of one hour is applied. This setting can have a value from 1 hour to
  12 hours.

  Anyone who assumes the role from the AWS CLI or API can use the
  ``DurationSeconds`` API parameter or the ``duration-seconds`` CLI parameter to
  request a longer session. The ``MaxSessionDuration`` setting determines the
  maximum duration that can be requested using the ``DurationSeconds``
  parameter. If users don't specify a value for the ``DurationSeconds``
  parameter, their security credentials are valid for one hour by default. This
  applies when you use the ``AssumeRole*`` API operations or the
  ``assume-role*`` CLI operations but does not apply when you use those
  operations to create a console URL. For more information, see `Using IAM Roles
  <https://docs.aws.amazon.com/IAM/latest/UserGuide/id_roles_use.html>`__ in the
  *IAM User Guide*.

``--permissions-boundary`` (string)

  The ARN of the policy that is used to set the permissions boundary for the
  role.

``--tags`` (list)

  A list of tags that you want to attach to the newly created role. Each tag
  consists of a key name and an associated value. For more information about
  tagging, see `Tagging IAM Identities
  <https://docs.aws.amazon.com/IAM/latest/UserGuide/id_tags.html>`__ in the *IAM
  User Guide*.

  .. note::

    If any one of the tags is invalid or if you exceed the allowed number of
    tags per role, then the entire request fails and the role is not created.

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

**To create an IAM role**

The following ``create-role`` command creates a role named ``Test-Role`` and
attaches a trust policy to it::

  aws iam create-role --role-name Test-Role --assume-role-policy-document file://Test-Role-Trust-Policy.json

Output::

  {
    "Role": {
        "AssumeRolePolicyDocument": "<URL-encoded-JSON>",
        "RoleId": "AKIAIOSFODNN7EXAMPLE",
        "CreateDate": "2013-06-07T20:43:32.821Z",
        "RoleName": "Test-Role",
        "Path": "/",
        "Arn": "arn:aws:iam::123456789012:role/Test-Role"
    }
  }

The trust policy is defined as a JSON document in the
*Test-Role-Trust-Policy.json* file. (The file name and extension do not have
significance.) The trust policy must specify a principal.

To attach a permissions policy to a role, use the ``put-role-policy`` command.

For more information, see `Creating a Role`_ in the *Using IAM* guide.

.. _`Creating a Role`: http://docs.aws.amazon.com/IAM/latest/UserGuide/creating-role.html

Output
------

Role -> (structure)

  A structure containing details about the new role.

  Path -> (string)

    The path to the role. For more information about paths, see `IAM Identifiers
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

    The maximum session duration (in seconds) for the specified role. Anyone who
    uses the AWS CLI, or API to assume the role can specify the duration using
    the optional ``DurationSeconds`` API parameter or ``duration-seconds`` CLI
    parameter.

  PermissionsBoundary -> (structure)

    The ARN of the policy used to set the permissions boundary for the role.

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

    A list of tags that are attached to the specified role. For more information
    about tagging, see `Tagging IAM Identities
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
	  
