.. _create-group:

create-group
============

Creates a new group.

For information about the number of groups you can create, see `Limitations on
IAM Entities
<https://docs.aws.amazon.com/IAM/latest/UserGuide/LimitationsOnEntities.html>`__
in the *IAM User Guide*.

See also: :ref:`CreateGroup`.

See `aws help <https://docs.aws.amazon.com/cli/latest/reference/index.html>`_
for descriptions of global parameters.

Synopsis
--------

::

  create-group
    [--path <value>]
    --group-name <value>
    [--cli-input-json <value>]

Options
-------

``--path`` (string)

  The path to the group. For more information about paths, see `IAM Identifiers
  <https://docs.aws.amazon.com/IAM/latest/UserGuide/Using_Identifiers.html>`__
  in the *IAM User Guide*.

  This parameter is optional. If it is not included, it defaults to a slash (/).

  This parameter allows (through its regex pattern) a string of characters
  consisting of either a forward slash (/) by itself or a string that must begin
  and end with forward slashes. In addition, it can contain any ASCII character
  from the "!"  (\u0021) through the DEL character (\u007F), including most
  punctuation marks, digits, and upper- and lower-case letters.

``--group-name`` (string)

  The name of the group to create. Do not include the path in this value.

  IAM user, group, role, and policy names must be unique within the
  account. Names are not distinguished by case. For example, you cannot create
  resources named both "MyResource" and "myresource".

``--cli-input-json`` (string)

  Performs service operation based on the JSON string provided. If other
  arguments are provided on the command line, the CLI values will override the
  JSON-provided values. It is not possible to pass arbitrary binary values using
  a JSON-provided value as the string will be taken literally.

See `aws help <https://docs.aws.amazon.com/cli/latest/reference/index.html>`_
for descriptions of global parameters.

Examples
--------

**To create an IAM group**

The following ``create-group`` command creates an IAM group named ``Admins``::

  aws iam create-group --group-name Admins

Output::

  {
      "Group": {
          "Path": "/",
          "CreateDate": "2015-03-09T20:30:24.940Z",
          "GroupId": "AIDGPMS9RO4H3FEXAMPLE",
          "Arn": "arn:aws:iam::123456789012:group/Admins",
          "GroupName": "Admins"
      }
  }

For more information, see `Creating IAM Groups`_ in the *Using IAM* guide.

.. _`Creating IAM Groups`: http://docs.aws.amazon.com/IAM/latest/UserGuide/Using_CreatingAndListingGroups.html

Output
------

Group -> (structure)

  A structure containing details about the new group.

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

