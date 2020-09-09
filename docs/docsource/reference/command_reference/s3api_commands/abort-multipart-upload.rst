.. _abort-multipart-upload:

abort-multipart-upload
======================

Aborts a multipart upload.

To verify that all parts have been removed, call the List Parts operation to
ensure the parts list is empty.

See also: :ref:`Abort Multipart Upload` in the CloudServer API documentation.

See `aws help <https://docs.aws.amazon.com/cli/latest/reference/index.html>`_
for descriptions of global parameters.

Synopsis
--------

::

  abort-multipart-upload
    --bucket <value>
    --key <value>
    --upload-id <value>
    [--cli-input-json <value>]

Options
-------

``--bucket`` (string)

  Name of the bucket to which the multipart upload was initiated.

``--key`` (string)

  Key of the object for which the multipart upload was initiated.

``--upload-id`` (string)

  Upload ID that identifies the multipart upload.

Possible values:
 
  *   ``requester``

``--cli-input-json`` (string)

  Performs service operation based on the JSON string provided. 
  If other arguments
  are provided on the command line, the CLI values will override the
  JSON-provided values. It is not possible to pass arbitrary binary values using
  a JSON-provided value as the string will be taken literally.

See `aws help <https://docs.aws.amazon.com/cli/latest/reference/index.html>`_
for descriptions of global parameters.

Examples
--------

The following command aborts a multipart upload for the key ``multipart/01`` in
the bucket ``my-bucket``::

  aws s3api abort-multipart-upload --bucket my-bucket --key 'multipart/01'\
  --upload-id dfRtDYU0WWCCcH43C3WFbkRONycyCpTJJvxu2i5GYkZljF.Yxwh6XG7WfS2vC4to6\
  HiV6Yjlx.cph0gtNBtJ8P3URCSbB7rjxI5iEwVDmgaXZOGgkk5nVTW16HOQ5l0R

The upload ID required by this command is output by ``create-multipart-upload``
and can also be retrieved with ``list-multipart-uploads``.

Output
------

None
