.. _rb:

rb
==

Deletes an empty S3 bucket. A bucket must be completely empty of objects and
versioned objects before it can be deleted. However, the ``--force`` parameter
can be used to delete the non-versioned objects in the bucket before the bucket
is deleted.

Synopsis
--------

::

  rb <S3Uri>
    [--force]

Options
-------

``path`` (string)

``--force`` (Boolean)

Deletes all objects in the bucket including the bucket itself. Note that
versioned objects will not be deleted in this process which would cause the
bucket deletion to fail because the bucket would not be empty. To delete
versioned objects use the ``s3api delete-object`` command with the
``--version-id`` parameter.

Examples
--------

The following ``rb`` command removes a bucket.  In this example, the user's
bucket is ``mybucket``.  Note that the bucket must be empty in order to remove::

    aws s3 rb s3://mybucket

Output::

    remove_bucket: mybucket

The following ``rb`` command uses the ``--force`` parameter to first remove all
of the objects in the bucket and then remove the bucket itself.  In this
example, the user's bucket is ``mybucket`` and the objects in ``mybucket`` are
``test1.txt`` and ``test2.txt``::

    aws s3 rb s3://mybucket --force

Output::

    delete: s3://mybucket/test1.txt
    delete: s3://mybucket/test2.txt
    remove_bucket: mybucket
