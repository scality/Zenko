.. _get-bucket-website:

get-bucket-website
==================

Returns the website configuration for a bucket.

See also: :ref:`GET Bucket Website`.

See `aws help <https://docs.aws.amazon.com/cli/latest/reference/index.html>`_
for descriptions of global parameters.

Synopsis
--------

::

  get-bucket-website
    --bucket <value>
    [--cli-input-json <value>]

Options
-------

``--bucket`` (string)

``--cli-input-json`` (string)

  Performs service operation based on the JSON string provided. If other
  arguments are provided on the command line, the CLI values will override the
  JSON-provided values. It is not possible to pass arbitrary binary values using
  a JSON-provided value as the string will be taken literally.

See `aws help <https://docs.aws.amazon.com/cli/latest/reference/index.html>`_
for descriptions of global parameters.

Examples
--------

The following command retrieves the static website configuration for a bucket
named ``my-bucket``::

  aws s3api get-bucket-website --bucket my-bucket

Output::

  {
      "IndexDocument": {
          "Suffix": "index.html"
      },
      "ErrorDocument": {
          "Key": "error.html"
      }
  }

Output
------

RedirectAllRequestsTo -> (structure)

  HostName -> (string)
  
    Name of the host where requests are redirected.

  Protocol -> (string)

    Protocol to use when redirecting requests. The default is the protocol that
    is used in the original request.

IndexDocument -> (structure)

  Suffix -> (string)

    A suffix that is appended to a request that is for a directory on the
    website endpoint (e.g. if the suffix is index.html and you make a request to
    samplebucket/images/ the data that is returned will be for the object with
    the key name images/index.html) The suffix must not be empty and must not
    include a slash character.

ErrorDocument -> (structure)

  Key -> (string)

    The object key name to use when a 4XX class error occurs.

RoutingRules -> (list)

  (structure)
  
    Specifies the redirect behavior and when a redirect is applied.

    Condition -> (structure)

      A container for describing a condition that must be met for the specified
      redirect to apply. For example, 1. If request is for pages in the
      ``/docs`` folder, redirect to the ``/documents`` folder. 2. If request
      results in HTTP error 4xx, redirect request to another host where you
      might process the error.

      HttpErrorCodeReturnedEquals -> (string)

        The HTTP error code when the redirect is applied. In the event of an
        error, if the error code equals this value, then the specified redirect
        is applied. Required when parent element ``Condition`` is specified and
        sibling ``KeyPrefixEquals`` is not specified. If both are specified,
        then both must be true for the redirect to be applied.

      KeyPrefixEquals -> (string)

        The object key name prefix when the redirect is applied. For example, to
        redirect requests for ``ExamplePage.html``, the key prefix will be
        ``ExamplePage.html``. To redirect request for all pages with the prefix
        ``docs/``, the key prefix will be ``/docs``, which identifies all
        objects in the docs/ folder. Required when the parent element
        ``Condition`` is specified and sibling ``HttpErrorCodeReturnedEquals``
        is not specified. If both conditions are specified, both must be true
        for the redirect to be applied.

    Redirect -> (structure)

      Container for redirect information. You can redirect requests to another
      host, to another page, or with another protocol. In the event of an error,
      you can specify a different error code to return.

      HostName -> (string)

        The host name to use in the redirect request.
	
      HttpRedirectCode -> (string)

        The HTTP redirect code to use on the response. Not required if one of the siblings is present.

      Protocol -> (string)

        Protocol to use when redirecting requests. The default is the protocol that is used in the original request.

      ReplaceKeyPrefixWith -> (string)

        The object key prefix to use in the redirect request. For example, to
        redirect requests for all pages with prefix ``docs/`` (objects in the
        ``docs/`` folder) to ``documents/``, you can set a condition block with
        ``KeyPrefixEquals`` set to ``docs/`` and in the Redirect set
        ``ReplaceKeyPrefixWith`` to ``/documents``. Not required if one of the
        siblings is present. Can be present only if ``ReplaceKeyWith`` is not
        provided.

      ReplaceKeyWith -> (string)

        The specific object key to use in the redirect request. For example,
        redirect request to ``error.html``. Not required if one of the siblings
        is present. Can be present only if ``ReplaceKeyPrefixWith`` is not
        provided.
