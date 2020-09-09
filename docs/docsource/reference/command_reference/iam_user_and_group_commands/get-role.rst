.. _get-role:

get-role
========

Retrieves information about the specified role, including the role's path, GUID,
ARN, and the role's trust policy that grants permission to assume the role. For
more information about roles, see `Working with Roles
<https://docs.aws.amazon.com/IAM/latest/UserGuide/WorkingWithRoles.html>`__.

.. note::

  Policies returned by this API are URL-encoded compliant with `RFC 3986
  <https://tools.ietf.org/html/rfc3986>`__. You can use a URL decoding method to
  convert the policy back to plain JSON text. For example, if you use Java, you
  can use the ``decode`` method of the ``java.net.URLDecoder`` utility class in
  the Java SDK. Other languages and SDKs provide similar functionality.

See also: `AWS API Documentation
<https://docs.aws.amazon.com/goto/WebAPI/iam-2010-05-08/GetRole>`_.

See `aws help <https://docs.aws.amazon.com/cli/latest/reference/index.html>`_
for descriptions of global parameters.

Synopsis
--------

::

  get-role
    --role-name <value>
    [--cli-input-json <value>]

Options
-------

``--role-name`` (string)

  The name of the IAM role to get information about.

  This parameter allows (through its regex pattern) a string of characters
  consisting of upper and lowercase alphanumeric characters with no spaces. You
  can also include any of the following characters: ``_``, ``+``, ``=``, ``,``,
  ``.``, ``@``, and ``-``.

``--cli-input-json`` (string)

  Performs service operation based on the JSON string provided. If other
  arguments are provided on the command line, the CLI values will override the
  JSON-provided values. It is not possible to pass arbitrary binary values using
  a JSON-provided value as the string will be taken literally.

See `aws help <https://docs.aws.amazon.com/cli/latest/reference/index.html>`_
for descriptions of global parameters.

Examples
--------

**To get information about an IAM role**

The following ``get-role`` command gets information about the role named
``Test-Role``::

  aws iam get-role --role-name Test-Role

Output::

  {
    "Role": {
        "AssumeRolePolicyDocument": "<URL-encoded-JSON>",
        "RoleId": "AIDIODR4TAW7CSEXAMPLE",
        "CreateDate": "2013-04-18T05:01:58Z",
        "RoleName": "Test-Role",
        "Path": "/",
        "Arn": "arn:aws:iam::123456789012:role/Test-Role"
    }
  }

The command displays the trust policy attached to the role. To list the
permissions policies attached to a role, use the ``list-role-policies`` command.

For more information, see `Creating a Role`_ in the *Using IAM* guide.

.. _`Creating a Role`: http://docs.aws.amazon.com/IAM/latest/UserGuide/creating-role.html

Output
------

Role -> (structure)

  A structure containing details about the IAM role.

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
        ``Department`` could have values such as ``Human Resources``,
        ``Accounting``, and ``Support``. Tags with a key name of ``Cost Center``
        might have values that consist of the number associated with the
        different cost centers in your company. Typically, many resources have
        tags with the same key name but with different values.

        .. note::

          AWS always interprets the tag ``Value`` as a single string. If you
          need to store an array, you can store comma-separated values in the
          string. However, you must interpret the value in your code.
