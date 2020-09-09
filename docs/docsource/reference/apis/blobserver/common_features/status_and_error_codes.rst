.. _Status and Error Codes:

Status and Error Codes
======================
On any uninterrupted transaction, Blobserver returns one of the following status or error codes.

.. _Success Codes:

Status Codes
------------

On a successful transaction, Blobserver returns one of the following status codes.

.. tabularcolumns:: X{0.15\textwidth}X{0.10\textwidth}X{0.70\textwidth}
.. table::

   +-----------------+------+------------------------------------------------------------------+
   | Success         | Code | Description                                                      |
   +=================+======+==================================================================+
   | OK              | 200  | Request successful                                               |
   +-----------------+------+------------------------------------------------------------------+
   | Created         | 201  | Request fulfilled, resulting in new resource(s) being created.   |
   +-----------------+------+------------------------------------------------------------------+
   | Accepted        | 202  | Request accepted for processing, but processing is not complete. |
   +-----------------+------+------------------------------------------------------------------+
   | Partial Content | 206  | Successful operation to read a specified range                   |
   +-----------------+------+------------------------------------------------------------------+

.. _Error Codes:

Error Codes
-----------

The error messages and codes Blobserver may return are described in the
following table.

.. tabularcolumns:: X{0.35\textwidth}X{0.10\textwidth}X{0.50\textwidth}
.. table::
   :class: longtable

   +----------------------------------------+------+-------------------------------------------------+
   | Error                                  | Code | Description                                     |
   +========================================+======+=================================================+
   | AccessForbidden                        |      |                                                 |
   +----------------------------------------+------+-------------------------------------------------+
   | AuthenticationFailed                   | 403  | Server failed to authenticate the request. Make |
   |                                        |      | sure the value of the Authorization header is   |
   |                                        |      | formed correctly including the signature.       |
   +----------------------------------------+------+-------------------------------------------------+
   | BadRequest                             | 400  | BadRequest                                      |
   +----------------------------------------+------+-------------------------------------------------+
   | BlobNotFound                           | 404  | The specified blob does not exist.              |
   +----------------------------------------+------+-------------------------------------------------+
   | BlockListTooLong                       | 400  | The block list may not contain more than 50,000 |
   |                                        |      | blocks.                                         |
   +----------------------------------------+------+-------------------------------------------------+
   | CannotVerifyCopySource                 | 500  | Could not verify the copy source within the     |
   |                                        |      | specified time. Examine the HTTP status code    |
   |                                        |      | and message for more information about the      |
   |                                        |      | failure.                                        |
   +----------------------------------------+------+-------------------------------------------------+
   | ConditionNotMet                        | 412  | The condition specified in the conditional      |
   |                                        |      | header(s) was not met for a write operation.    |
   +----------------------------------------+------+-------------------------------------------------+
   | ContainerAlreadyExists                 | 409  | The specified container already exists.         |
   +----------------------------------------+------+-------------------------------------------------+
   | ContainerBeingDeleted                  | 409  | The specified container is being deleted.       |
   +----------------------------------------+------+-------------------------------------------------+
   | ContainerNotFound                      | 404  | The specified container does not exist.         |
   +----------------------------------------+------+-------------------------------------------------+
   | InternalError                          | 500  | The server encountered an internal error.       |
   |                                        |      | Please retry the request.                       |
   +----------------------------------------+------+-------------------------------------------------+
   | InvalidBlobType                        | 409  | The blob type is invalid for this operation.    |
   +----------------------------------------+------+-------------------------------------------------+
   | InvalidBlockList                       | 400  | The specified block list is invalid.            |
   +----------------------------------------+------+-------------------------------------------------+
   | InvalidMd5                             | 400  | The MD5 value specified in the request is       |
   |                                        |      | invalid. The MD5 value must be 128 bits and     |
   |                                        |      | Base64-encoded.                                 |
   +----------------------------------------+------+-------------------------------------------------+
   | InvalidQueryParameterValue             | 400  | An invalid value was specified for one of the   |
   |                                        |      | query parameters in the request URI.            |
   +----------------------------------------+------+-------------------------------------------------+
   | InvalidRange                           | 416  | The rangze specified is invalid for the current |
   |                                        |      | size of the resource.                           |
   +----------------------------------------+------+-------------------------------------------------+
   | InvalidUri                             | 400  | The requested URI does not represent any        |
   |                                        |      | resource on the server.                         |
   +----------------------------------------+------+-------------------------------------------------+
   | InvalidXmlDocument                     | 400  | The specified XML is not syntactically valid.   |
   +----------------------------------------+------+-------------------------------------------------+
   | InvalidXmlNodeValue                    | 400  | The value provided for one of the XML nodes in  |
   |                                        |      | the request body was not in the correct format. |
   +----------------------------------------+------+-------------------------------------------------+
   | Md5Mismatch                            | 400  | The MD5 value specified in the request did not  |
   |                                        |      | match the MD5 value calculated by the server.   |
   +----------------------------------------+------+-------------------------------------------------+
   | MissingContentLengthHeader             | 411  | The Content-Length header was not specified.    |
   +----------------------------------------+------+-------------------------------------------------+
   | NotImplemented                         | 501  | The server does not support the functionality   |
   |                                        |      | required to fulfill the request.                |
   +----------------------------------------+------+-------------------------------------------------+
   | NotModified                            | 304  | The condition specified in the conditional      |
   |                                        |      | header(s) was not met for a read operation.     |
   +----------------------------------------+------+-------------------------------------------------+
   | RequestBodyTooLarge                    | 413  | The size of the request body exceeds the        |
   |                                        |      | maximum size permitted.                         |
   +----------------------------------------+------+-------------------------------------------------+
   | ResourceNotFound                       | 404  | The specified resource does not exist.          |
   +----------------------------------------+------+-------------------------------------------------+
