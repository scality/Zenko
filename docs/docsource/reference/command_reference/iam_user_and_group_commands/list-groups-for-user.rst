.. _list-groups-for-user:

list-groups-for-user
====================

Lists the IAM groups that the specified IAM user belongs to.

You can paginate the results using the ``MaxItems`` and ``Marker`` parameters.

See also: `AWS API Documentation
<https://docs.aws.amazon.com/goto/WebAPI/iam-2010-05-08/ListGroupsForUser>`_.

See `aws help <https://docs.aws.amazon.com/cli/latest/reference/index.html>`_
for descriptions of global parameters.

``list-groups-for-user`` is a paginated operation. Multiple API calls may be
issued in order to retrieve the entire data set of results. You can disable
pagination by providing the ``--no-paginate`` argument.  When using ``--output
text`` and the ``--query`` argument on a paginated response, the ``--query``
argument must extract data from the results of the ``Groups`` query expression.


Synopsis
--------

::

  list-groups-for-user
    --user-name <value>
    [--max-items <value>]
    [--cli-input-json <value>]
    [--starting-token <value>]
    [--page-size <value>]

Options
-------

``--user-name`` (string)

  The name of the user to list groups for.

  This parameter allows (through its regex pattern)
  a string of characters consisting of
  upper and lowercase alphanumeric characters with no spaces. You can also
  include any of the following characters: ``_``, ``+``, ``=``, ``,``, ``.``,
  ``@``, and ``-``.

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

See `aws help <https://docs.aws.amazon.com/cli/latest/reference/index.html>`_
for descriptions of global parameters.

Examples
--------

**To list the groups that an IAM user belongs to**

The following ``list-groups-for-user`` command displays the groups that the IAM
user named ``Bob`` belongs to::

  aws iam list-groups-for-user --user-name Bob

Output::

  "Groups": [
      {
          "Path": "/",
          "CreateDate": "2013-05-06T01:18:08Z",
          "GroupId": "AKIAIOSFODNN7EXAMPLE",
          "Arn": "arn:aws:iam::123456789012:group/Admin",
          "GroupName": "Admin"
      },
      {
          "Path": "/",
          "CreateDate": "2013-05-06T01:37:28Z",
          "GroupId": "AKIAI44QH8DHBEXAMPLE",
          "Arn": "arn:aws:iam::123456789012:group/s3-Users",
          "GroupName": "s3-Users"
      }
  ]

For more information, see `Creating and Listing Groups`_ in the *Using IAM*
guide.

.. _`Creating and Listing Groups`: http://docs.aws.amazon.com/IAM/latest/UserGuide/Using_CreatingAndListingGroups.html

Output
------

Groups -> (list)

  A list of groups.

  (structure)

    Contains information about an IAM group entity.

    This data type is used as a response element in the following operations:

    *  CreateGroup   

    *  GetGroup   

    *  ListGroups   

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
