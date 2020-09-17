.. _cp:

cp
==

Description
-----------

Copies a local file or S3 object to another location locally or in S3.




Synopsis
--------

::

  cp <LocalPath> <S3Uri> or <S3Uri> <LocalPath> or <S3Uri> <S3Uri>
    [--dryrun]
    [--quiet]
    [--include <value>]
    [--exclude <value>]
    [--acl <value>]
    [--follow-symlinks | --no-follow-symlinks]
    [--no-guess-mime-type]
    [--sse <value>]
    [--sse-c <value>]
    [--sse-c-key <value>]
    [--sse-c-copy-source <value>]
    [--sse-c-copy-source-key <value>]
    [--storage-class <value>]
    [--grants <value> [<value>...]]
    [--website-redirect <value>]
    [--content-type <value>]
    [--cache-control <value>]
    [--content-disposition <value>]
    [--content-encoding <value>]
    [--content-language <value>]
    [--expires <value>]
    [--source-region <value>]
    [--only-show-errors]
    [--no-progress]
    [--page-size <value>]
    [--metadata <value>]
    [--metadata-directive <value>]
    [--expected-size <value>]
    [--recursive]

Options
-------

``paths`` (string)

``--dryrun`` (Boolean)

Displays the operations that would be performed using the
specified command without actually running them.

``--quiet`` (Boolean)

Does not display the operations performed from the
specified command.

``--include`` (string)

Don't exclude files or objects in the command that match
the specified pattern. See `Use of Exclude and Include Filters
<http://docs.aws.amazon.com/cli/latest/reference/s3/index.html#use-of-exclude-and-include-filters>`__
for details.

``--exclude`` (string)

Exclude all files or objects from the command that matches the specified pattern.

``--acl`` (string)

Sets the ACL for the object when the command is performed. If
you use this parameter you must have the "s3:PutObjectAcl" permission included
in the list of actions for your IAM policy. Only accepts values of ``private``,
``public-read``, ``public-read-write``, ``authenticated-read``,
``aws-exec-read``, ``bucket-owner-read``, ``bucket-owner-full-control`` and
``log-delivery-write``. See `Canned ACL
<http://docs.aws.amazon.com/AmazonS3/latest/dev/acl-overview.html#canned-acl>`__
for details.

``--follow-symlinks`` | ``--no-follow-symlinks`` (Boolean)

Symbolic links are followed only when uploading to S3 from the local
filesystem. Note that S3 does not support symbolic links, so the contents of the
link target are uploaded under the name of the link. When neither
``--follow-symlinks`` nor ``--no-follow-symlinks`` is specified, the default is
to follow symlinks.

``--no-guess-mime-type`` (Boolean)

Do not try to guess the mime type for uploaded files. By default the mime type
of a file is guessed when it is uploaded.

``--sse`` (string)

Specifies server-side encryption of the object in S3. Valid values are
``AES256`` and ``aws:kms``. If the parameter is specified but no value is
provided, ``AES256`` is used.

``--sse-c`` (string)

Specifies server-side encryption using customer provided keys of the the object
in S3. ``AES256`` is the only valid value. If the parameter is specified but no
value is provided, ``AES256`` is used. If you provide this value,
``--sse-c-key`` must be specified as well.

``--sse-c-key`` (blob)

The customer-provided encryption key to use to server-side encrypt the object in
S3. If you provide this value, ``--sse-c`` must be specified as well. The key
provided should *not* be base64 encoded.

``--sse-c-copy-source`` (string)

This parameter should only be specified when copying an S3 object that was
encrypted server-side with a customer-provided key. It specifies the algorithm
to use when decrypting the source object. ``AES256`` is the only valid value. If
the parameter is specified but no value is provided, ``AES256`` is used. If you
provide this value, ``--sse-c-copy-source-key`` must be specified as well.

``--sse-c-copy-source-key`` (blob)

This parameter should only be specified when copying an S3 object that was
encrypted server-side with a customer-provided key. Specifies the
customer-provided encryption key for Zenko to use to decrypt the source
object. The encryption key provided must be one that was used when the source
object was created. If you provide this value, ``--sse-c-copy-source`` be
specified as well. The key provided should *not* be base64 encoded.

``--storage-class`` (string)

The type of storage to use for the object.

Valid choices are: ``STANDARD`` 

Defaults to ``STANDARD``.

``--grants`` (string)

  Grant specific permissions to individual users or groups. You can supply a list 
  of grants of the form:

  ::

    --grants Permission=Grantee_Type=Grantee_ID [Permission=Grantee_Type=Grantee_ID ...]

  To specify the same permission type for multiple grantees, specify the permission as:

  ::

    --grants Permission=Grantee_Type=Grantee_ID,Grantee_Type=Grantee_ID,...

  Each value contains the following elements:

  * ``Permission`` - Specifies the granted permissions, and can be set to read,
    readacl, writeacl, or full.
  
  * ``Grantee_Type`` - Specifies how the grantee is to be identified, and can be
    set to uri, emailaddress, or id.
  
  * ``Grantee_ID`` - Specifies the grantee based on Grantee_Type. The
    ``Grantee_ID`` value can be one of:

    * ``uri`` - The group's URI. For more information, see `Who Is a Grantee?
      <http://docs.aws.amazon.com/AmazonS3/latest/dev/ACLOverview.html#SpecifyingGrantee>`__
    
    * ``emailaddress`` - The account's email address.
    
    * ``id`` - The account's canonical ID
    
  For more information on Zenko access control, see `Access Control
  <http://docs.aws.amazon.com/AmazonS3/latest/dev/UsingAuthAccess.html>`__

``--website-redirect`` (string)

If the bucket is configured as a website, redirects requests for this object to
another object in the same bucket or to an external URL. Zenko stores the
value of this header in the object metadata.

``--content-type`` (string)

Specify an explicit content type for this operation. This value overrides any
guessed mime types.

``--cache-control`` (string)

Specifies caching behavior along the request/reply chain.

``--content-disposition`` (string)

Specifies presentational information for the object.

``--content-encoding`` (string)

Specifies what content encodings have been applied to the object and thus what
decoding mechanisms must be applied to obtain the media-type referenced by the
Content-Type header field.

``--content-language`` (string)
The language the content is in.

``--expires`` (string)
The date and time at which the object is no longer cacheable.

``--source-region`` (string)

When transferring objects from an s3 bucket to an s3 bucket, this specifies the
region of the source bucket. Note the region specified by ``--region`` or
through configuration of the CLI refers to the region of the destination
bucket. If ``--source-region`` is not specified the region of the source will be
the same as the region of the destination bucket.

``--only-show-errors`` (Boolean)

Only errors and warnings are displayed. All other output is suppressed.

``--no-progress`` (Boolean)

File transfer progress is not displayed. This flag is only applied when the
quiet and only-show-errors flags are not provided.

``--page-size`` (integer)

The number of results to return in each response to a list operation. The
default value is 1000 (the maximum allowed). Using a lower value may help if an
operation times out.

``--metadata`` (map)

A map of metadata to store with the objects in S3. This will be applied to every
object which is part of this request. In a sync, this means that files which
haven't changed won't receive the new metadata. When copying between two s3
locations, the metadata-directive argument will default to 'REPLACE' unless
otherwise specified.

Shorthand Syntax::

    KeyName1=string,KeyName2=string


JSON Syntax::

  {"string": "string"
    ...}

``--metadata-directive`` (string)

Specifies whether the metadata is copied from the source object or replaced with
metadata provided when copying S3 objects. Note that if the object is copied
over in parts, the source object's metadata will not be copied over, no matter
the value for ``--metadata-directive``, and instead the desired metadata values
must be specified as parameters on the command line. Valid values are ``COPY``
and ``REPLACE``. If this parameter is not specified, ``COPY`` will be used by
default. If ``REPLACE`` is used, the copied object will only have the metadata
values that were specified by the CLI command. Note that if you are using any of
the following parameters: ``--content-type``, ``content-language``,
``--content-encoding``, ``--content-disposition``, ``--cache-control``, or
``--expires``, you will need to specify ``--metadata-directive REPLACE`` for
non-multipart copies if you want the copied objects to have the specified
metadata values.

``--expected-size`` (string)

This argument specifies the expected size of a stream in terms of bytes. Note
that this argument is needed only when a stream is being uploaded to s3 and the
size is larger than 5GB. Failure to include this argument under these conditions
may result in a failed upload due to too many parts in upload.

``--recursive`` (Boolean)

Command is performed on all files or objects under the specified directory or
prefix.

 

Examples
--------

**Copying a local file to S3**

The following ``cp`` command copies a single file to a specified
bucket and key::

    aws s3 cp test.txt s3://mybucket/test2.txt

Output::

    upload: test.txt to s3://mybucket/test2.txt

**Copying a local file to S3 with an expiration date**

The following ``cp`` command copies a single file to a specified
bucket and key that expires at the specified ISO 8601 timestamp::

    aws s3 cp test.txt s3://mybucket/test2.txt --expires 2014-10-01T20:30:00Z

Output::

    upload: test.txt to s3://mybucket/test2.txt


**Copying a file from S3 to S3**

The following ``cp`` command copies a single s3 object to a specified bucket and key::

    aws s3 cp s3://mybucket/test.txt s3://mybucket/test2.txt

Output::

    copy: s3://mybucket/test.txt to s3://mybucket/test2.txt


**Copying an S3 object to a local file**

The following ``cp`` command copies a single object to a specified file locally::

    aws s3 cp s3://mybucket/test.txt test2.txt

Output::

    download: s3://mybucket/test.txt to test2.txt


**Copying an S3 object from one bucket to another**

The following ``cp`` command copies a single object to a specified bucket while
retaining its original name::

    aws s3 cp s3://mybucket/test.txt s3://mybucket2/

Output::

    copy: s3://mybucket/test.txt to s3://mybucket2/test.txt

**Recursively copying S3 objects to a local directory**

When passed with the parameter ``--recursive``, the following ``cp`` command
recursively copies all objects under a specified prefix and bucket to a
specified directory.  In this example, the bucket ``mybucket`` has the objects
``test1.txt`` and ``test2.txt``::

    aws s3 cp s3://mybucket . --recursive

Output::

    download: s3://mybucket/test1.txt to test1.txt
    download: s3://mybucket/test2.txt to test2.txt

**Recursively copying local files to S3**

When passed with the parameter ``--recursive``, the following ``cp`` command
recursively copies all files under a specified directory to a specified bucket
and prefix while excluding some files by using an ``--exclude`` parameter.  In
this example, the directory ``myDir`` has the files ``test1.txt`` and
``test2.jpg``::

    aws s3 cp myDir s3://mybucket/ --recursive --exclude "*.jpg"

Output::

    upload: myDir/test1.txt to s3://mybucket/test1.txt

**Recursively copying S3 objects to another bucket**

When passed with the parameter ``--recursive``, the following ``cp`` command
recursively copies all objects under a specified bucket to another bucket while
excluding some objects by using an ``--exclude`` parameter.  In this example,
the bucket ``mybucket`` has the objects ``test1.txt`` and
``another/test1.txt``::

    aws s3 cp s3://mybucket/ s3://mybucket2/ --recursive --exclude "another/*"

Output::

    copy: s3://mybucket/test1.txt to s3://mybucket2/test1.txt

You can combine ``--exclude`` and ``--include`` options to copy only objects
that match a pattern, excluding all others::

    aws s3 cp s3://mybucket/logs/ s3://mybucket2/logs/ --recursive --exclude "*" --include "*.log"

Output::

    copy: s3://mybucket/logs/test/test.log to s3://mybucket2/logs/test/test.log
    copy: s3://mybucket/logs/test3.log to s3://mybucket2/logs/test3.log

**Setting the Access Control List (ACL) while copying an S3 object**

The following ``cp`` command copies a single object to a specified bucket and key while setting the ACL to
``public-read-write``::

    aws s3 cp s3://mybucket/test.txt s3://mybucket/test2.txt --acl public-read-write

Output::

    copy: s3://mybucket/test.txt to s3://mybucket/test2.txt

If you're using the ``--acl`` option, ensure that any associated IAM policies
include the ``"s3:PutObjectAcl"`` action::

    aws iam get-user-policy --user-name myuser --policy-name mypolicy

Output::

    {
        "UserName": "myuser",
        "PolicyName": "mypolicy",
        "PolicyDocument": {
            "Version": "2012-10-17",
            "Statement": [
                {
                    "Action": [
                        "s3:PutObject",
                        "s3:PutObjectAcl"
                    ],
                    "Resource": [
                        "arn:aws:s3:::mybucket/*"
                    ],
                    "Effect": "Allow",
                    "Sid": "Stmt1234567891234"
                }
            ]
        }
    }

**Granting permissions for an S3 object**

The following ``cp`` command illustrates the use of the ``--grants`` option to
grant read access to all users and full control to a specific user identified by
their email address::

  aws s3 cp file.txt s3://mybucket/ --grants read=uri=http://acs.amazonaws.com/groups/global/AllUsers full=emailaddress=user@example.com

Output::

    upload: file.txt to s3://mybucket/file.txt

**Uploading a local file stream to S3**

.. warning::

  PowerShell may alter the encoding of or add a CRLF to piped input.

The following ``cp`` command uploads a local file stream from standard input to
a specified bucket and key::

    aws s3 cp - s3://mybucket/stream.txt

**Downloading an S3 object as a local file stream**

.. warning::

   PowerShell may alter the encoding of or add a CRLF to piped or redirected output.

The` following ``cp`` command downloads an S3 object locally as a stream to
standard output. Downloading as a stream is not currently compatible with the
``--recursive`` parameter::

    aws s3 cp s3://mybucket/stream.txt -
