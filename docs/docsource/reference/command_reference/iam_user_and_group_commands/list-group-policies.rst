.. _list-group-policies:

list-group-policies
===================

Lists the names of the inline policies that are embedded in the specified IAM
group.

An IAM group can also have managed policies attached to it. To list the managed
policies that are attached to a group, use ListAttachedGroupPolicies. For more
information about policies, see `Managed Policies and Inline Policies
<https://docs.aws.amazon.com/IAM/latest/UserGuide/policies-managed-vs-inline.html>`__
in the *IAM User Guide*.

You can paginate the results using the ``MaxItems`` and ``Marker``
parameters. If there are no inline policies embedded with the specified group,
the operation returns an empty list.

See also: `AWS API Documentation
<https://docs.aws.amazon.com/goto/WebAPI/iam-2010-05-08/ListGroupPolicies>`_.

See `aws help <https://docs.aws.amazon.com/cli/latest/reference/index.html>`_
for descriptions of global parameters.

``list-group-policies`` is a paginated operation. Multiple API calls may be
issued in order to retrieve the entire data set of results. You can disable
pagination by providing the ``--no-paginate`` argument.  When using ``--output
text`` and the ``--query`` argument on a paginated response, the ``--query``
argument must extract data from the results of the following query expressions:
``PolicyNames``

Synopsis
--------

::

  list-group-policies
    --group-name <value>
    [--max-items <value>]
    [--cli-input-json <value>]
    [--starting-token <value>]
    [--page-size <value>]

Options
-------

``--group-name`` (string)

  The name of the group to list policies for.

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

**To list all inline policies that are attached to the specified group**

The following ``list-group-policies`` command lists the names of inline policies
that are attached to the IAM group named ``Admins`` in the current account::

  aws iam list-group-policies --group-name Admins

Output::

  {
      "PolicyNames": [
          "AdminRoot",
          "ExamplePolicy"
      ]
  }

For more information, see `Managing IAM Policies`_ in the *Using IAM* guide.

.. _`Managing IAM Policies`: http://docs.aws.amazon.com/IAM/latest/UserGuide/ManagingPolicies.html

Output
------

PolicyNames -> (list)

  A list of policy names.

  This parameter allows (through its regex pattern)
  a string of characters consisting of
  upper and lowercase alphanumeric characters with no spaces. You can also
  include any of the following characters: ``_``, ``+``, ``=``, ``,``, ``.``,
  ``@``, and ``-``.

  (string)

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
