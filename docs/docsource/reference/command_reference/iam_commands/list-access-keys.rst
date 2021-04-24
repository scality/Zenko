.. _list-access-keys:

list-access-keys
================

Returns information about the access key IDs associated with the specified
user. If there are none, the operation returns an empty list.

Although each user is limited to a small number of keys, you can still paginate
the results using the ``MaxItems`` and ``Marker`` parameters.

If the ``UserName`` field is not specified, the user name is determined based on
the access key ID used to sign the request. This operation works for access keys
under the account. Consequently, you can use this operation to manage AWS
account root user credentials even if the AWS account has no associated users.

.. note::

  To ensure your account's security, the secret access key is accessible only
  during key and user creation.

See also: :ref:`ListAccessKeys`

``list-access-keys`` is a paginated operation. Multiple API calls may be issued
to retrieve the entire data set of results. You can disable pagination with the
``--no-paginate`` argument. When using ``--output text`` and the ``--query``
argument on a paginated response, the ``--query`` argument must extract data
from the results of the ``AccessKeyMetadata`` query expression.

Synopsis
--------

::

  list-access-keys
    [--user-name <value>]
    [--max-items <value>]
    [--cli-input-json <value>]
    [--starting-token <value>]
    [--page-size <value>]
    [--generate-cli-skeleton <value>]

Options
-------

``--user-name`` (string)

  The name of the user associated with the key.

  This parameter allows a string of characters consisting of upper and lowercase
  alphanumeric characters with no spaces. You can also include any of the
  characters "_", "+", "=", ",", ".", "@", and "-".

``--max-items`` (integer)

  The total number of items to return in the command's output. If the total
  number of items available is more than the value specified, a ``NextToken`` is
  provided in the command's output. To resume pagination, provide the
  ``NextToken`` value in the ``starting-token`` argument of a subsequent
  command. **Do not** use the ``NextToken`` response element outside of the
  AWS CLI.

  For usage examples, see `Pagination
  <https://docs.aws.amazon.com/cli/latest/userguide/pagination.html>`__ in the
  *AWS Command Line Interface User Guide*.

``--cli-input-json`` (string)

  Performs service operation based on the JSON string provided. If ot1her
  arguments are provided on the command line, the CLI values override the
  JSON-provided values. You cannot pass arbitrary binary values using a
  JSON-provided value, becaus the string is taken literally.

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

Examples
--------

**To list the access key IDs for a user**

The following ``list-access-keys`` command lists the access keys IDs for a user named ``Bob``::

  aws iam list-access-keys --user-name Bob

Output::

  "AccessKeyMetadata": [
      {
          "UserName": "Bob",
          "Status": "Active",
          "CreateDate": "2013-06-04T18:17:34Z",
          "AccessKeyId": "AKIAIOSFODNN7EXAMPLE"
      },
      {
          "UserName": "Bob",
          "Status": "Inactive",
          "CreateDate": "2013-06-06T20:42:26Z",
          "AccessKeyId": "AKIAI44QH8DHBEXAMPLE"
      }
  ]

You cannot list the secret access keys for IAM users. If the secret access keys
are lost, you must create new access keys using the ``create-access-keys``
command.

For more information, see `Creating, Modifying, and Viewing User Security
Credentials`_ in the *Using IAM* guide.

.. _`Creating, Modifying, and Viewing User Security Credentials`: http://docs.aws.amazon.com/IAM/latest/UserGuide/Using_CreateAccessKey.html

Output
------

AccessKeyMetadata -> (list)

  A list of objects containing metadata about the access keys.

(structure)

  Contains information about an AWS access key, without its secret key.

  This data type is used as a response element in the ListAccessKeys operation.
    
UserName -> (string)

  The name of the user associated with the key.

AccessKeyId -> (string)

  The ID for this access key.

Status -> (string)

  The status of the access key. ``Active`` means the key is valid for API
  calls; ``Inactive`` means it is not.

CreateDate -> (timestamp)

  The date the access key was created.

IsTruncated -> (Boolean)

  This flag indicates whether there are more items to return. If the results
  were truncated, you can make a subsequent pagination request using the
  ``Marker`` request parameter to retrieve more items. IAM may return fewer than
  the ``MaxItems`` number of results even if more results are available. Check
  ``IsTruncated`` after every call to ensure that you receive all your results.

Marker -> (string)

  When ``IsTruncated`` is ``true``, this element is present and contains the
  value to use for the ``Marker`` parameter in a subsequent pagination request.
