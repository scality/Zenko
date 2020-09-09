.. _get-object-acl:

get-object-acl
==============

Returns the access control list (ACL) of an object.

See also: :ref:`GET Object ACL`.

See `aws help <https://docs.aws.amazon.com/cli/latest/reference/index.html>`_
for descriptions of global parameters.

Synopsis
--------

::

  get-object-acl
    --bucket <value>
    --key <value>
    [--version-id <value>]
    [--cli-input-json <value>]

Options
-------

``--bucket`` (string)

``--key`` (string)

``--version-id`` (string)

  VersionId used to reference a specific version of the object.

  Possible values:
  
  *   ``requester``

``--cli-input-json`` (string)

  Performs service operation based on the JSON string provided. 
  If other arguments
  are provided on the command line, the CLI values will override the
  JSON-provided values. It is not possible to pass arbitrary binary values using
  a JSON-provided value as the string will be taken literally.

See `aws help <https://docs.aws.amazon.com/cli/latest/reference/index.html>`_ for descriptions of global parameters.

Examples
--------

The following command retrieves the access control list for an object in a
bucket named ``my-bucket``::

  aws s3api get-object-acl --bucket my-bucket --key index.html

Output::

  {
      "Owner": {
          "DisplayName": "my-username",
          "ID": "7009a8971cd538e11f6b6606438875e7c86c5b672f46db45460ddcd087d36c32"
      },
      "Grants": [
          {
              "Grantee": {
                  "DisplayName": "my-username",
                  "ID": "7009a8971cd538e11f6b6606438875e7c86c5b672f46db45460ddcd087d36c32"
              },
              "Permission": "FULL_CONTROL"
          },
          {
              "Grantee": {
                  "URI": "http://acs.amazonaws.com/groups/global/AllUsers"
              },
              "Permission": "READ"
          }
      ]
  }

Output
------

Owner -> (structure)

  DisplayName -> (string)

  ID -> (string)

Grants -> (list)

  A list of grants.

  (structure)

    Grantee -> (structure)

      DisplayName -> (string)
      
        Screen name of the grantee.

      EmailAddress -> (string)

        Email address of the grantee.

      ID -> (string)

        The canonical user ID of the grantee.

      Type -> (string)

        Type of grantee

      URI -> (string)

        URI of the grantee group.

    Permission -> (string)

      Specifies the permission given to the grantee.
