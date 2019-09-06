.. _error messages:

Error Messages
==============

AWS Error Messages
------------------

Zenko may return the following AWS error messages, which are available to the
AWS-emulating CloudServer module:

.. table::
   :class: longtable

   +-----------------------------------+------+---------------------------------------------------+
   | Error                             | Code | Description                                       |
   +===================================+======+===================================================+
   | AccessDenied                      | 403  | Access Denied                                     |
   +-----------------------------------+------+---------------------------------------------------+
   | AccessForbidden                   | 403  | Access Forbidden                                  |
   +-----------------------------------+------+---------------------------------------------------+
   | AccountProblem                    | 403  | There is a problem with your AWS account that     |
   |                                   |      | prevents the operation from completing            |
   |                                   |      | successfully. Please use Contact Us.              |
   +-----------------------------------+------+---------------------------------------------------+
   | AmbiguousGrantByEmailAddress      | 400  | The email address you provided is associated with |
   |                                   |      | more than one account.                            |
   +-----------------------------------+------+---------------------------------------------------+
   | BadDigest                         | 400  | The Content-MD5 you specified did not match what  |
   |                                   |      | we received.                                      |
   +-----------------------------------+------+---------------------------------------------------+
   | BucketAlreadyExists               | 409  | The requested bucket name is not available.       |
   |                                   |      | The bucket namespace is shared by all users of    |
   |                                   |      | the system. Please select a different name and    |
   |                                   |      | try again.                                        |
   +-----------------------------------+------+---------------------------------------------------+
   | BucketAlreadyOwnedByYou           | 409  | Your previous request to create the named bucket  |
   |                                   |      | succeeded and you already own it. You get this    |
   |                                   |      | error in all AWS regions except US Standard,      |
   |                                   |      | us-east-1. In us-east-1 region, you will get 200  |
   |                                   |      | OK, but it is no-op (if bucket exists S3 will not |
   |                                   |      | do anything).                                     |
   +-----------------------------------+------+---------------------------------------------------+
   | BucketNotEmpty                    | 409  | The bucket you tried to delete is not empty.      |
   +-----------------------------------+------+---------------------------------------------------+
   | CredentialsNotSupported           | 400  | This request does not support credentials.        |
   +-----------------------------------+------+---------------------------------------------------+
   | CrossLocationLoggingProhibited    | 403  | Cross-location logging not allowed. Buckets in    |
   |                                   |      | one geographic location cannot log information to |
   |                                   |      | a bucket in another location.                     |
   +-----------------------------------+------+---------------------------------------------------+
   | DeleteConflict                    | 409  | The request was rejected because it attempted to  |
   |                                   |      | delete a resource that has attached subordinate   |
   |                                   |      | entities. The error message describes these       |
   |                                   |      | entities.                                         |
   +-----------------------------------+------+---------------------------------------------------+
   | EntityTooSmall                    | 400  | Your proposed upload is smaller than the minimum  |
   |                                   |      | allowed object size.                              |
   +-----------------------------------+------+---------------------------------------------------+
   | EntityTooLarge                    | 400  | Your proposed upload exceeds the maximum allowed  |
   |                                   |      | object size.                                      |
   +-----------------------------------+------+---------------------------------------------------+
   | ExpiredToken                      | 400  | The provided token has expired.                   |
   +-----------------------------------+------+---------------------------------------------------+
   | IllegalVersioningConfiguration\   | 400  | Indicates that the versioning configuration       |
   | Exception                         |      | specified in the request is invalid.              |
   +-----------------------------------+------+---------------------------------------------------+
   | IncompleteBody                    | 400  | You did not provide the number of bytes specified |
   |                                   |      | by the Content-Length HTTP header.                |
   +-----------------------------------+------+---------------------------------------------------+
   | IncorrectNumberOfFilesInPost\     | 400  | POST requires exactly one file upload per         |
   | Request                           |      | request.                                          |
   +-----------------------------------+------+---------------------------------------------------+
   | InlineDataTooLarge                | 400  | Inline data exceeds the maximum allowed size.     |
   +-----------------------------------+------+---------------------------------------------------+
   | InternalError                     | 500  | We encountered an internal error. Please try      |
   |                                   |      | again.                                            |
   +-----------------------------------+------+---------------------------------------------------+
   | InvalidAccessKeyId                | 403  | The AWS access key Id you provided does not exist |
   |                                   |      | in our records.                                   |
   +-----------------------------------+------+---------------------------------------------------+
   | InvalidAddressingHeader           | 400  | You must specify the Anonymous role.              |
   +-----------------------------------+------+---------------------------------------------------+
   | InvalidArgument                   | 400  | Invalid Argument                                  |
   +-----------------------------------+------+---------------------------------------------------+
   | InvalidBucketName                 | 400  | The specified bucket is not valid.                |
   +-----------------------------------+------+---------------------------------------------------+
   | InvalidBucketState                | 409  | The request is not valid with the current state   |
   |                                   |      | of the bucket.                                    |
   +-----------------------------------+------+---------------------------------------------------+
   | InvalidDigest                     | 400  | The Content-MD5 you specified is not valid.       |
   +-----------------------------------+------+---------------------------------------------------+
   | InvalidEncryptionAlgorithmError   | 400  | The encryption request you specified is not       |
   |                                   |      | valid. The valid value is AES256.                 |
   +-----------------------------------+------+---------------------------------------------------+
   | InvalidLocationConstraint         | 400  | The specified location constraint is not valid.   |
   +-----------------------------------+------+---------------------------------------------------+
   | InvalidObjectState                | 403  | The operation is not valid for the current state  |
   |                                   |      | of the object.                                    |
   +-----------------------------------+------+---------------------------------------------------+
   | InvalidPart                       | 400  | One or more of the specified parts could not be   |
   |                                   |      | found. The part might not have been uploaded, or  |
   |                                   |      | the specified entity tag might not have matched   |
   |                                   |      | the part's entity tag.                            |
   +-----------------------------------+------+---------------------------------------------------+
   | InvalidPartOrder                  | 400  | The list of parts was not in ascending order.     |
   |                                   |      | Parts list must specified in order by part        |
   |                                   |      | number.                                           |
   +-----------------------------------+------+---------------------------------------------------+
   | InvalidPartNumber                 | 416  | The requested partnumber is not satisfiable.      |
   +-----------------------------------+------+---------------------------------------------------+
   | InvalidPayer                      | 403  | All access to this object has been disabled.      |
   +-----------------------------------+------+---------------------------------------------------+
   | InvalidPolicyDocument             | 400  | The content of the form does not meet the         |
   |                                   |      | conditions specified in the policy document.      |
   +-----------------------------------+------+---------------------------------------------------+
   | InvalidRange                      | 416  | The requested range cannot be satisfied.          |
   +-----------------------------------+------+---------------------------------------------------+
   | InvalidRedirectLocation           | 400  | The website redirect location must have a prefix  |
   |                                   |      | of 'http://' or 'https://' or '/'.                |
   +-----------------------------------+------+---------------------------------------------------+
   | InvalidRequest                    | 400  | SOAP requests must be made over an HTTPS          |
   |                                   |      | connection.                                       |
   +-----------------------------------+------+---------------------------------------------------+
   | InvalidSecurity                   | 403  | The provided security credentials are not valid.  |
   +-----------------------------------+------+---------------------------------------------------+
   | InvalidSOAPRequest                | 400  | The SOAP request body is invalid.                 |
   +-----------------------------------+------+---------------------------------------------------+
   | InvalidStorageClass               | 400  | The storage class you specified is not valid.     |
   +-----------------------------------+------+---------------------------------------------------+
   | InvalidTag                        | 400  | The Tag you have provided is invalid.             |
   +-----------------------------------+------+---------------------------------------------------+
   | InvalidTargetBucketForLogging     | 400  | The target bucket for logging does not exist,     |
   |                                   |      | is not owned by you, or does not have the         |
   |                                   |      | appropriate grants for the log-delivery group.    |
   +-----------------------------------+------+---------------------------------------------------+
   | InvalidToken                      | 400  | The provided token is malformed or otherwise      |
   |                                   |      | invalid.                                          |
   +-----------------------------------+------+---------------------------------------------------+
   | InvalidURI                        | 400  | Couldn't parse the specified URI.                 |
   +-----------------------------------+------+---------------------------------------------------+
   | KeyTooLong                        | 400  | Your key is too long.                             |
   +-----------------------------------+------+---------------------------------------------------+
   | LimitExceeded                     | 409  | The request was rejected because it attempted to  |
   |                                   |      | create resources beyond the current AWS account   |
   |                                   |      | limits. The error message describes the limit     |
   |                                   |      | exceeded.                                         |
   +-----------------------------------+------+---------------------------------------------------+
   | MalformedACLError                 | 400  | The XML you provided was not well-formed or did   |
   |                                   |      |  not validate against our published schema.       |
   +-----------------------------------+------+---------------------------------------------------+
   | MalformedPOSTRequest              | 400  | The body of your POST request is not well-formed  |
   |                                   |      | multipart/form-data.                              |
   +-----------------------------------+------+---------------------------------------------------+
   | MalformedXML                      | 400  | The XML you provided was not well-formed or did   |
   |                                   |      | not validate against our published schema.        |
   +-----------------------------------+------+---------------------------------------------------+
   | MaxMessageLengthExceeded          | 400  | Your request was too big.                         |
   +-----------------------------------+------+---------------------------------------------------+
   | MaxPostPreDataLengthExceededError | 400  | Your POST request fields preceding the upload     |
   |                                   |      | file were too large.                              |
   +-----------------------------------+------+---------------------------------------------------+
   | MetadataTooLarge                  | 400  | Your metadata headers exceed the maximum allowed  |
   |                                   |      | metadata size.                                    |
   +-----------------------------------+------+---------------------------------------------------+
   | MethodNotAllowed                  | 405  | The specified method is not allowed against this  |
   |                                   |      | resource.                                         |
   +-----------------------------------+------+---------------------------------------------------+
   | MissingAttachment                 | 400  | A SOAP attachment was expected, but none were     |
   |                                   |      | found.                                            |
   +-----------------------------------+------+---------------------------------------------------+
   | MissingContentLength              | 411  | You must provide the Content-Length HTTP header.  |
   +-----------------------------------+------+---------------------------------------------------+
   | MissingRequestBodyError           | 400  | Request body is empty.                            |
   +-----------------------------------+------+---------------------------------------------------+
   | MissingRequiredParameter          | 400  | Your request is missing a required parameter.     |
   +-----------------------------------+------+---------------------------------------------------+
   | MissingSecurityElement            | 400  | The SOAP 1.1 request is missing a security        |
   |                                   |      | element.                                          |
   +-----------------------------------+------+---------------------------------------------------+
   | MissingSecurityHeader             | 400  | Your request is missing a required header.        |
   +-----------------------------------+------+---------------------------------------------------+
   | NoLoggingStatusForKey             | 400  | There is no such thing as a logging status        |
   |                                   |      | subresource for a key.                            |
   +-----------------------------------+------+---------------------------------------------------+
   | NoSuchBucket                      | 404  | The specified bucket does not exist.              |
   +-----------------------------------+------+---------------------------------------------------+
   | NoSuchCORSConfiguration           | 404  | The CORS configuration does not exist             |
   +-----------------------------------+------+---------------------------------------------------+
   | NoSuchKey                         | 404  | The specified key does not exist.                 |
   +-----------------------------------+------+---------------------------------------------------+
   | NoSuchLifecycleConfiguration      | 404  | The lifecycle configuration does not exist.       |
   +-----------------------------------+------+---------------------------------------------------+
   | NoSuchWebsiteConfiguration        | 404  | The specified bucket does not have a website      |
   |                                   |      | configuration                                     |
   +-----------------------------------+------+---------------------------------------------------+
   | NoSuchUpload                      | 404  | The specified multipart upload does not exist.    |
   |                                   |      | The upload ID might be invalid, or the multipart  |
   |                                   |      | upload might have been aborted or completed.      |
   +-----------------------------------+------+---------------------------------------------------+
   | NoSuchVersion                     | 404  | Indicates that the version ID specified in the    |
   |                                   |      | request does not match an existing version.       |
   +-----------------------------------+------+---------------------------------------------------+
   | ReplicationConfigurationNotFound\ | 404  | The replication configuration was not found       |
   | Error                             |      |                                                   |
   +-----------------------------------+------+---------------------------------------------------+
   | NotImplemented                    | 501  | A header you provided implies functionality that  |
   |                                   |      | is not implemented.                               |
   +-----------------------------------+------+---------------------------------------------------+
   | NotModified                       | 304  | Not Modified.                                     |
   +-----------------------------------+------+---------------------------------------------------+
   | NotSignedUp                       | 403  | Your account is not signed up for the S3 service. |
   |                                   |      | You must sign up before you can use S3.           |
   +-----------------------------------+------+---------------------------------------------------+
   | NoSuchBucketPolicy                | 404  | The specified bucket does not have a bucket       |
   |                                   |      |  policy.                                          |
   +-----------------------------------+------+---------------------------------------------------+
   | OperationAborted                  | 409  | A conflicting conditional operation is currently  |
   |                                   |      | in progress against this resource. Try again.     |
   +-----------------------------------+------+---------------------------------------------------+
   | PermanentRedirect                 | 301  | The bucket you are attempting to access must be   |
   |                                   |      | addressed using the specified endpoint. Send all  |
   |                                   |      | future requests to this endpoint.                 |
   +-----------------------------------+------+---------------------------------------------------+
   | PreconditionFailed                | 412  | At least one of the preconditions you specified   |
   |                                   |      | did not hold.                                     |
   +-----------------------------------+------+---------------------------------------------------+
   | Redirect                          | 307  | Temporary redirect.                               |
   +-----------------------------------+------+---------------------------------------------------+
   | RestoreAlreadyInProgress          | 409  | Object restore is already in progress.            |
   +-----------------------------------+------+---------------------------------------------------+
   | RequestIsNotMultiPartContent      | 400  | Bucket POST must be of the enclosure-type         |
   |                                   |      | multipart/form-data.                              |
   +-----------------------------------+------+---------------------------------------------------+
   | RequestTimeout                    | 400  | Your socket connection to the server was not read |
   |                                   |      | from or written to within the timeout period.     |
   +-----------------------------------+------+---------------------------------------------------+
   | RequestTimeTooSkewed              | 403  | The difference between the request time and the   |
   |                                   |      | server's time is too large.                       |
   +-----------------------------------+------+---------------------------------------------------+
   | RequestTorrentOfBucketError       | 400  | Requesting the torrent file of a bucket is not    |
   |                                   |      | permitted.                                        |
   +-----------------------------------+------+---------------------------------------------------+
   | SignatureDoesNotMatch             | 403  | The request signature we calculated does not      |
   |                                   |      | match the signature you provided.                 |
   +-----------------------------------+------+---------------------------------------------------+
   | ServiceUnavailable                | 503  | Reduce your request rate.                         |
   +-----------------------------------+------+---------------------------------------------------+
   | ServiceUnavailable                | 503  | The request has failed due to a temporary failure |
   |                                   |      | of the server.                                    |
   +-----------------------------------+------+---------------------------------------------------+
   | SlowDown                          | 503  | Reduce your request rate.                         |
   +-----------------------------------+------+---------------------------------------------------+
   | TemporaryRedirect                 | 307  | You are being redirected to the bucket while DNS  |
   |                                   |      | updates.                                          |
   +-----------------------------------+------+---------------------------------------------------+
   | TokenRefreshRequired              | 400  | The provided token must be refreshed.             |
   +-----------------------------------+------+---------------------------------------------------+
   | TooManyBuckets                    | 400  | You have attempted to create more buckets than    |
   |                                   |      | allowed.                                          |
   +-----------------------------------+------+---------------------------------------------------+
   | TooManyParts                      | 400  | You have attempted to upload more parts than      |
   |                                   |      | allowed.                                          |
   +-----------------------------------+------+---------------------------------------------------+
   | UnexpectedContent                 | 400  | This request does not support content.            |
   +-----------------------------------+------+---------------------------------------------------+
   | UnresolvableGrantByEmailAddress   | 400  | The email address you provided does not match any |
   |                                   |      | account on record.                                |
   +-----------------------------------+------+---------------------------------------------------+
   | UserKeyMustBeSpecified            | 400  | The bucket POST must contain the specified field  |
   |                                   |      | name. If it is specified, check the order of the  |
   |                                   |      | fields.                                           |
   +-----------------------------------+------+---------------------------------------------------+
   | NoSuchEntity                      | 404  | The request was rejected because it referenced an |
   |                                   |      | entity that does not exist. The error message     |
   |                                   |      | describes the entity.                             |
   +-----------------------------------+------+---------------------------------------------------+
   | WrongFormat                       | 400  | Data entered by the user has a wrong format.      |
   +-----------------------------------+------+---------------------------------------------------+
   | Forbidden                         | 403  | Authentication failed.                            |
   +-----------------------------------+------+---------------------------------------------------+
   | EntityDoesNotExist                | 404  | Not found.                                        |
   +-----------------------------------+------+---------------------------------------------------+
   | EntityAlreadyExists               | 409  | The request was rejected because it attempted to  |
   |                                   |      | create a resource that already exists.            |
   +-----------------------------------+------+---------------------------------------------------+
   | KeyAlreadyExists                  | 409  | The request was rejected because it attempted to  |
   |                                   |      | create a resource that already exists.            |
   +-----------------------------------+------+---------------------------------------------------+
   | ServiceFailure                    | 500  | Server error: the request processing has failed   |
   |                                   |      | because of an unknown error, exception or         |
   |                                   |      | failure.                                          |
   +-----------------------------------+------+---------------------------------------------------+
   | IncompleteSignature               | 400  | The request signature does not conform to AWS     |
   |                                   |      | standards.                                        |
   +-----------------------------------+------+---------------------------------------------------+
   | InternalFailure                   | 500  | The request processing has failed because of an   |
   |                                   |      | unknown error, exception or failure.              |
   +-----------------------------------+------+---------------------------------------------------+
   | InvalidAction                     | 400  | The action or operation requested is invalid.     |
   |                                   |      | Verify that the action is typed correctly.        |
   +-----------------------------------+------+---------------------------------------------------+
   | InvalidClientTokenId              | 403  | The X.509 certificate or AWS access key ID        |
   |                                   |      | provided does not exist in our records.           |
   +-----------------------------------+------+---------------------------------------------------+
   | InvalidParameterCombination       | 400  | Parameters that must not be used together were    |
   |                                   |      | used together.                                    |
   +-----------------------------------+------+---------------------------------------------------+
   | InvalidParameterValue             | 400  | An invalid or out-of-range value was supplied for |
   |                                   |      | the input parameter.                              |
   +-----------------------------------+------+---------------------------------------------------+
   | InvalidQueryParameter             | 400  | The AWS query string is malformed or does not     |
   |                                   |      | adhere to AWS standards.                          |
   +-----------------------------------+------+---------------------------------------------------+
   | MalformedQueryString              | 404  | The query string contains a syntax error.         |
   +-----------------------------------+------+---------------------------------------------------+
   | MissingAction                     | 400  | The request is missing an action or a required    |
   |                                   |      | parameter.                                        |
   +-----------------------------------+------+---------------------------------------------------+
   | MissingAuthenticationToken        | 403  | The request must contain either a valid           |
   |                                   |      | (registered) AWS access key ID or X.509           |
   |                                   |      | certificate.                                      |
   +-----------------------------------+------+---------------------------------------------------+
   | MissingParameter                  | 400  | A required parameter for the specified action is  |
   |                                   |      | not supplied.                                     |
   +-----------------------------------+------+---------------------------------------------------+
   | OptInRequired                     | 403  | The AWS access key ID needs a subscription for    |
   |                                   |      | the service.                                      |
   +-----------------------------------+------+---------------------------------------------------+
   | RequestExpired                    | 400  | The request reached the service more than 15      |
   |                                   |      | minutes after the date stamp on the request or    |
   |                                   |      | more than 15 minutes after the request expiration |
   |                                   |      | date (such as for pre-signed URLs), or the date   |
   |                                   |      | stamp on the request is more than 15 minutes in   |
   |                                   |      | the future.                                       |
   +-----------------------------------+------+---------------------------------------------------+
   | Throttling                        | 400  | The request was denied due to request throttling. |
   +-----------------------------------+------+---------------------------------------------------+
   | AccountNotFound                   | 404  | No account was found in Vault, please contact     |
   |                                   |      | your system administrator.                        |
   +-----------------------------------+------+---------------------------------------------------+
   | ValidationError                   | 400  | The specified value is invalid.                   |
   +-----------------------------------+------+---------------------------------------------------+
   | MalformedPolicyDocument           | 400  | Syntax errors in policy.                          |
   +-----------------------------------+------+---------------------------------------------------+
   | InvalidInput                      | 400  | The request was rejected because an invalid or    |
   |                                   |      | out-of-range value was supplied for an input      |
   |                                   |      | parameter.                                        |
   +-----------------------------------+------+---------------------------------------------------+
   | MalformedPolicy                   | 400  | This policy contains invalid Json                 |
   +-----------------------------------+------+---------------------------------------------------+

Non-AWS S3 Errors
-----------------

Zenko also may return the following non-AWS S3 error message during a multipart
upload:

.. table::

   +----------------+------+---------------------------------------------------+
   | Error          | Code | Description                                       |
   +================+======+===================================================+
   | MPUinProgress  | 409  | The bucket you tried to delete has an ongoing     |
   |                |      | multipart upload.                                 |
   +----------------+------+---------------------------------------------------+
