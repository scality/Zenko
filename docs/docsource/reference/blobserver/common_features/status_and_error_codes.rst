.. _Status and Error Codes:

Status and Error Codes
======================
On any uninterrupted transaction, Blobserver returns one of the following status or error codes.

.. _Success Codes:

Status Codes
------------

On a successful transaction, Blobserver returns one of the following status codes. 

.. tabularcolumns:: lll
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
   | Partial Content | 206  |Successful operation to read a specified range                    |
   +-----------------+------+------------------------------------------------------------------+

.. _Error Codes:

Error Codes
-----------

The error messages and codes Blobserver may return are described in the
following table.

.. tabularcolumns:: lll
.. table::

   +----------------------------------------+------+-------------------------------------------------+
   | Error                                  | Code | Description                                     |
   +========================================+======+=================================================+
   | AccountAlreadyExists                   | 409  | The specified account already exists.           |
   +----------------------------------------+------+-------------------------------------------------+
   | AccountBeingCreated                    | 409  | The specified account is in the process of      |
   |                                        |      | being created.                                  |
   +----------------------------------------+------+-------------------------------------------------+
   | AccountIsDisabled                      | 403  | The specified account is disabled.              |
   +----------------------------------------+------+-------------------------------------------------+
   | AuthenticationFailed                   | 403  | Server failed to authenticate the request. Make |
   |                                        |      | sure the value of the Authorization header is   |
   |                                        |      | formed correctly including the signature.       |
   +----------------------------------------+------+-------------------------------------------------+
   | BadRequest                             | 400  | BadRequest                                      |
   +----------------------------------------+------+-------------------------------------------------+
   | ConditionHeadersNotSupported           | 400  | Condition headers are not supported.            |
   +----------------------------------------+------+-------------------------------------------------+
   | ConditionNotMet                        | 412  | The condition specified in the conditional      |
   |                                        |      | header(s) was not met for a write operation.    |
   +----------------------------------------+------+-------------------------------------------------+
   | EmptyMetadataKey                       | 400  | The key for one of the metadata key-value pairs | 
   |                                        |      | is empty.                                       |
   +----------------------------------------+------+-------------------------------------------------+
   | InsufficientAccountPermissions         | 403  | The account being accessed does not have        |
   |                                        |      | sufficient permissions to execute this          |
   |                                        |      | operation.                                      |
   +----------------------------------------+------+-------------------------------------------------+
   | InternalError                          | 500  | The server encountered an internal error.       |
   |                                        |      | Please retry the request.                       |
   +----------------------------------------+------+-------------------------------------------------+
   | InvalidAuthenticationInfo              | 400  | The authentication information was not provided |
   |                                        |      | in the correct format. Verify the value of      |
   |                                        |      | Authorization header.                           |
   +----------------------------------------+------+-------------------------------------------------+
   | InvalidHeaderValue                     | 400  | The value provided for one of the HTTP headers  |
   |                                        |      | was not in the correct format.                  |
   +----------------------------------------+------+-------------------------------------------------+
   | InvalidHttpVerb                        | 400  | The HTTP verb specified was not recognized by   |
   |                                        |      | the server.                                     |
   +----------------------------------------+------+-------------------------------------------------+
   | InvalidInput                           | 400  | One of the request inputs is not valid.         |
   +----------------------------------------+------+-------------------------------------------------+
   | InvalidMd5                             | 400  | The MD5 value specified in the request is       |
   |                                        |      | invalid. The MD5 value must be 128 bits and     |
   |                                        |      | Base64-encoded.                                 |
   +----------------------------------------+------+-------------------------------------------------+
   | InvalidMetadata                        | 400  | The specified metadata is invalid. It includes  |
   |                                        |      | characters that are not permitted.              |
   +----------------------------------------+------+-------------------------------------------------+
   | InvalidQueryParameterValue             | 400  | An invalid value was specified for one of the   |
   |                                        |      | query parameters in the request URI.            |
   +----------------------------------------+------+-------------------------------------------------+
   | InvalidRange                           | 416  | The rangze specified is invalid for the current |
   |                                        |      | size of the resource.                           |
   +----------------------------------------+------+-------------------------------------------------+
   | InvalidResourceName                    | 400  | The specifed resource name contains invalid     |
   |                                        |      | characters.                                     |
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
   | MetadataTooLarge                       | 400  | The size of the specified metadata exceeds the  |
   |                                        |      | maximum size permitted.                         |
   +----------------------------------------+------+-------------------------------------------------+
   | MissingContentLengthHeader             | 411  | The Content-Length header was not specified.    |
   +----------------------------------------+------+-------------------------------------------------+
   | MissingRequiredQueryParameter          | 400  | A required query parameter was not specified    |
   |                                        |      | for this request.                               |
   +----------------------------------------+------+-------------------------------------------------+
   | MissingRequiredHeader                  | 400  | A required HTTP header was not specified.       |
   +----------------------------------------+------+-------------------------------------------------+
   | MissingRequiredXmlNode                 | 400  | A required XML node was not specified in the    |
   |                                        |      | request body.                                   |
   +----------------------------------------+------+-------------------------------------------------+
   | MultipleConditionHeadersNotSupported   | 400  | Multiple condition headers are not supported.   |
   +----------------------------------------+------+-------------------------------------------------+
   | OperationTimedOut                      | 500  | The operation could not be completed within the |
   |                                        |      | permitted time.                                 |
   +----------------------------------------+------+-------------------------------------------------+
   | OutOfRangeInput                        | 400  | One of the request inputs is out of range.      |
   +----------------------------------------+------+-------------------------------------------------+
   | OutOfRangeQueryParameterValue          | 400  | A query parameter specified in the request URI  |
   |                                        |      | is outside the permissible range.               |
   +----------------------------------------+------+-------------------------------------------------+
   | RequestBodyTooLarge                    | 413  | The size of the request body exceeds the        |
   |                                        |      | maximum size permitted.                         |
   +----------------------------------------+------+-------------------------------------------------+
   | ResourceTypeMismatch                   | 409  | The specified resource type does not match the  |
   |                                        |      | type of the existing resource.                  |
   +----------------------------------------+------+-------------------------------------------------+
   | RequestUrlFailedToParse                | 400  | The url in the request could not be parsed.     |
   +----------------------------------------+------+-------------------------------------------------+
   | ResourceAlreadyExists                  | 409  | The specified resource already exists.          |
   +----------------------------------------+------+-------------------------------------------------+
   | ResourceNotFound                       | 404  | The specified resource does not exist.          |
   +----------------------------------------+------+-------------------------------------------------+
   | ServerBusy                             | 503  | Operations per second is over the account       |
   |                                        |      | limit.                                          |
   +----------------------------------------+------+-------------------------------------------------+
   | UnsupportedHeader                      | 400  | One of the headers specified in the request is  |
   |                                        |      | not supported.                                  |
   +----------------------------------------+------+-------------------------------------------------+
   | UnsupportedXmlNode                     | 400  | One of the XML nodes specified in the request   |
   |                                        |      | body is not supported.                          |
   +----------------------------------------+------+-------------------------------------------------+
   | UnsupportedQueryParameter              | 400  | One of the query parameters specified in the    |
   |                                        |      | request URI is not supported.                   |
   +----------------------------------------+------+-------------------------------------------------+
   | UnsupportedHttpVerb                    | 405  | The resource doesn't support the specified HTTP |
   |                                        |      | verb.                                           |
   +----------------------------------------+------+-------------------------------------------------+
   | AppendPositionConditionNotMet          | 412  | The append position condition specified was not |
   |                                        |      | met.                                            |
   +----------------------------------------+------+-------------------------------------------------+
   | BlobAlreadyExists                      | 409  | The specified blob already exists.              |
   +----------------------------------------+------+-------------------------------------------------+
   | BlobNotFound                           | 404  | The specified blob does not exist.              |
   +----------------------------------------+------+-------------------------------------------------+
   | BlobOverwritten                        | 409  | The blob has been recreated since the previous  |
   |                                        |      | snapshot was taken.                             |
   +----------------------------------------+------+-------------------------------------------------+
   | BlobTierInadequateForContentLength     | 409  | The specified blob tier size limit cannot be    |
   |                                        |      | less than content length.                       |
   +----------------------------------------+------+-------------------------------------------------+
   | BlockCountExceedsLimit                 | 409  | The uncommitted block count cannot exceed the   |
   |                                        |      | maximum limit of 100,000 blocks.                |
   +----------------------------------------+------+-------------------------------------------------+
   | BlockListTooLong                       | 400  | The block list may not contain more than 50,000 |
   |                                        |      | blocks.                                         |
   +----------------------------------------+------+-------------------------------------------------+
   | CannotChangeToLowerTier                | 409  | A higher blob tier has already been explicitly  |
   |                                        |      | set.                                            |
   +----------------------------------------+------+-------------------------------------------------+
   | CannotVerifyCopySource                 | 500  | Could not verify the copy source within the     |
   |                                        |      | specified time. Examine the HTTP status code    |
   |                                        |      | and message for more information about the      |
   |                                        |      | failure.                                        |
   +----------------------------------------+------+-------------------------------------------------+
   | ContainerAlreadyExists                 | 409  | The specified container already exists.         |
   +----------------------------------------+------+-------------------------------------------------+
   | ContainerBeingDeleted                  | 409  | The specified container is being deleted.       |
   +----------------------------------------+------+-------------------------------------------------+
   | ContainerDisabled                      | 409  | The specified container has been disabled by    |
   |                                        |      | the administrator.                              |
   +----------------------------------------+------+-------------------------------------------------+
   | ContainerNotFound                      | 404  | The specified container does not exist.         |
   +----------------------------------------+------+-------------------------------------------------+
   | ContentLengthLargerThanTierLimit       | 409  | The blob's content length cannot exceed its     |
   |                                        |      | tier limit.                                     |
   +----------------------------------------+------+-------------------------------------------------+
   | CopyAcrossAccountsNotSupported         | 400  | The copy source account and destination account |
   |                                        |      | must be the same.                               |
   +----------------------------------------+------+-------------------------------------------------+
   | CopyIdMismatch                         | 409  | The specified copy ID did not match the copy ID |
   |                                        |      | for the pending copy operation.                 |
   +----------------------------------------+------+-------------------------------------------------+
   | FeatureVersionMismatch                 | 409  | The type of blob in the container is            |
   |                                        |      | unrecognized by this version.                   |
   +----------------------------------------+------+-------------------------------------------------+
   | IncrementalCopyBlobMismatch            | 409  | The specified source blob is different than the |
   |                                        |      | copy source of the existing incremental copy    |
   |                                        |      | blob.                                           |
   +----------------------------------------+------+-------------------------------------------------+
   | IncrementalCopyOfEarlier\              | 409  | The specified snapshot is earlier than the last |
   | VersionSnapshotNotAllowed              |      | snapshot copied into the incremental copy blob. |
   +----------------------------------------+------+-------------------------------------------------+
   | IncrementalCopySourceMustBeSnapshot    | 409  | The source for incremental copy request must be |
   |                                        |      | a snapshot.                                     |
   +----------------------------------------+------+-------------------------------------------------+
   | InfiniteLeaseDurationRequired          | 412  | The lease ID matched, but the specified lease   |
   |                                        |      | must be an infinite-duration lease.             |
   +----------------------------------------+------+-------------------------------------------------+
   | InvalidBlobOrBlock                     | 400  | The specified blob or block content is invalid. |
   +----------------------------------------+------+-------------------------------------------------+
   | InvalidBlobTier                        | 400  | The specified blob tier is invalid.             |
   +----------------------------------------+------+-------------------------------------------------+
   | InvalidBlobType                        | 409  | The blob type is invalid for this operation.    |
   +----------------------------------------+------+-------------------------------------------------+
   | InvalidBlockId                         | 400  | The specified block ID is invalid. The block ID |
   |                                        |      | must be Base64-encoded.                         |
   +----------------------------------------+------+-------------------------------------------------+
   | InvalidBlockList                       | 400  | The specified block list is invalid.            |
   +----------------------------------------+------+-------------------------------------------------+
   | InvalidOperation                       | 400  | Invalid operation against a blob snapshot.      |
   +----------------------------------------+------+-------------------------------------------------+
   | InvalidPageRange                       | 416  | The page range specified is invalid.            |
   +----------------------------------------+------+-------------------------------------------------+
   | InvalidSourceBlobType                  | 409  | The copy source blob type is invalid for this   |
   |                                        |      | operation.                                      |
   +----------------------------------------+------+-------------------------------------------------+
   | InvalidSourceBlobUrl                   | 409  | The source URL for incremental copy request     |
   |                                        |      | must be valid Azure Storage blob URL.           |
   +----------------------------------------+------+-------------------------------------------------+
   | InvalidVersionForPageBlobOperation     | 400  | All operations on page blobs require at least   |
   |                                        |      | version 2009-09-19.                             |
   +----------------------------------------+------+-------------------------------------------------+
   | LeaseAlreadyPresent                    | 409  | There is already a lease present.               |
   +----------------------------------------+------+-------------------------------------------------+
   | LeaseAlreadyBroken                     | 409  | The lease has already been broken and cannot be |
   |                                        |      | broken again.                                   |
   +----------------------------------------+------+-------------------------------------------------+
   | LeaseIdMismatchWithBlobOperation       | 412  | The lease ID specified did not match the lease  |
   |                                        |      | ID for the blob.                                |
   +----------------------------------------+------+-------------------------------------------------+
   | LeaseIdMismatchWithContainerOperation  | 412  | The lease ID specified did not match the lease  |
   |                                        |      | ID for the container.                           |
   +----------------------------------------+------+-------------------------------------------------+
   | LeaseIdMismatchWithLeaseOperation      | 409  | The lease ID specified did not match the lease  |
   |                                        |      | ID for the blob/container.                      |
   +----------------------------------------+------+-------------------------------------------------+
   | LeaseIdMissing                         | 412  | There is currently a lease on the blob/\        |
   |                                        |      | container and no lease ID was specified in the  |
   |                                        |      | request.                                        |
   +----------------------------------------+------+-------------------------------------------------+
   | LeaseIsBreakingAndCannotBeAcquired     | 409  | The lease ID matched, but the lease is          |
   |                                        |      | currently in breaking state and cannot be       |
   |                                        |      | acquired until it is broken.                    |   
   +----------------------------------------+------+-------------------------------------------------+
   | LeaseIsBreakingAndCannotBeChanged      | 409  | The lease ID matched, but the lease is          |
   |                                        |      | currently in breaking state and cannot be       |
   |                                        |      | changed.                                        |
   +----------------------------------------+------+-------------------------------------------------+
   | LeaseIsBrokenAndCannotBeRenewed        | 409  | The lease ID matched, but the lease has been    |
   |                                        |      | broken explicitly and cannot be renewed.        |
   +----------------------------------------+------+-------------------------------------------------+
   | LeaseLost                              | 412  | A lease ID was specified, but the lease for the |
   |                                        |      | blob/container has expired.                     |
   +----------------------------------------+------+-------------------------------------------------+
   | LeaseNotPresentWithBlobOperation       | 412  | There is currently no lease on the blob.        |
   +----------------------------------------+------+-------------------------------------------------+
   | LeaseNotPresentWithContainerOperation  | 412  | There is currently no lease on the container.   |
   +----------------------------------------+------+-------------------------------------------------+
   | LeaseNotPresentWithLeaseOperation      | 409  | There is currently no lease on the blob/\       |
   |                                        |      | container.                                      |
   +----------------------------------------+------+-------------------------------------------------+
   | MaxBlobSizeConditionNotMet             | 412  | The max blob size condition specified was not   |
   |                                        |      | met.                                            |
   +----------------------------------------+------+-------------------------------------------------+
   | NoPendingCopyOperation                 | 409  | There is currently no pending copy operation.   |
   +----------------------------------------+------+-------------------------------------------------+
   | NotModified                            | 304  | The condition specified in the conditional      |
   |                                        |      | header(s) was not met for a read operation.     |
   +----------------------------------------+------+-------------------------------------------------+
   | OperationNotAllowedOn\                 | 409  | The specified operation is not allowed on an    |
   | IncrementalCopyBlob                    |      | incremental copy blob.                          |
   +----------------------------------------+------+-------------------------------------------------+
   | PendingCopyOperation                   | 409  | There is currently a pending copy operation.    |
   +----------------------------------------+------+-------------------------------------------------+
   | PreviousSnapshotCannotBeNewer          | 400  | The prevsnapshot query parameter value cannot   |
   |                                        |      | be newer than snapshot query parameter value.   |
   +----------------------------------------+------+-------------------------------------------------+
   | PreviousSnapshotNotFound               | 409  | The previous snapshot is not found.             |
   +----------------------------------------+------+-------------------------------------------------+
   | PreviousSnapshotOperationNotSupported  | 409  | Differential Get Page Ranges is not supported   |
   |                                        |      | on the previous snapshot.                       |
   +----------------------------------------+------+-------------------------------------------------+
   | SequenceNumberConditionNotMet          | 412  | The sequence number condition specified was not |
   |                                        |      | met.                                            |
   +----------------------------------------+------+-------------------------------------------------+
   | SequenceNumberIncrementTooLarge        | 409  | The sequence number increment cannot be         |
   |                                        |      | performed because it would result in overflow   |
   |                                        |      | of the sequence number.                         |
   +----------------------------------------+------+-------------------------------------------------+
   | SnapshotCountExceeded                  | 409  | The snapshot count against this blob has been   |
   |                                        |      | exceeded.                                       |
   +----------------------------------------+------+-------------------------------------------------+
   | SnaphotOperationRateExceeded           | 409  | The rate of snapshot operations against this    |
   |                                        |      | blob has been exceeded.                         |
   +----------------------------------------+------+-------------------------------------------------+
   | SnapshotsPresent                       | 409  | This operation is not permitted while the blob  |
   |                                        |      | has snapshots.                                  |
   +----------------------------------------+------+-------------------------------------------------+
   | SourceConditionNotMet                  | 412  | The source condition specified using HTTP       |
   |                                        |      | conditional header(s) is not met.               |
   +----------------------------------------+------+-------------------------------------------------+
   | SystemInUse                            | 409  | This blob is in use by the system.              |
   +----------------------------------------+------+-------------------------------------------------+
   | TargetConditionNotMet                  | 412  | The target condition specified using HTTP       |
   |                                        |      | conditional header(s) is not met.               |
   +----------------------------------------+------+-------------------------------------------------+
   | UnauthorizedBlobOverwrite              | 403  | This request is not authorized to perform blob  |
   |                                        |      | overwrites.                                     |
   +----------------------------------------+------+-------------------------------------------------+
   | BlobBeingRehydrated                    | 409  | This operation is not permitted because the     |
   |                                        |      | blob is being rehydrated.                       |
   +----------------------------------------+------+-------------------------------------------------+
   | BlobArchived                           | 409  | This operation is not permitted on an archived  |
   |                                        |      | blob.                                           |
   +----------------------------------------+------+-------------------------------------------------+
   | BlobNotArchived                        | 409  | This blob is currently not in the archived      |
   |                                        |      | state.                                          |
   +----------------------------------------+------+-------------------------------------------------+
   | NotImplemented                         | 501  | The server does not support the functionality   |
   |                                        |      | required to fulfill the request.                |
   +----------------------------------------+------+-------------------------------------------------+
