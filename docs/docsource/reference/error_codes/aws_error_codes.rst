AWS Error Codes
===============

AWS error codes may be returned following a request failure.

.. tabularcolumns:: lX{0.40\textwidth}l
.. table::
   :widths: auto

   +-----------------------------------+--------------------------------------------------------+---------+
   | Error Code                        | Error Description                                      | Error   |
   +===================================+========================================================+=========+
   | AccessDenied                      | Access denied                                          | 403     |
   +-----------------------------------+--------------------------------------------------------+---------+
   | AccountNotFound                   | No account was found in. Please contact the system     | 404     |
   |                                   | administrator.                                         |         |
   +-----------------------------------+--------------------------------------------------------+---------+
   | AccountProblem                    | There is a problem with the account that prevents      | 403     |
   |                                   | the operation from completing successfully. Please use |         |
   |                                   | Contact Us.                                            |         |
   +-----------------------------------+--------------------------------------------------------+---------+
   | AmbiguousGrantByEmailAddress      | The email address provided is associated with more     | 400     |
   |                                   | than one account.                                      |         |
   +-----------------------------------+--------------------------------------------------------+---------+
   | BadDigest                         | The Content-MD5 specified did not match what was       | 400     |
   |                                   | received                                               |         |
   +-----------------------------------+--------------------------------------------------------+---------+
   | BucketAlreadyExists               | The requested bucket name is not available. The bucket | 409     |
   |                                   | namespace is shared by all users of the system. Please |         |
   |                                   | select a different name and try again.                 |         |
   +-----------------------------------+--------------------------------------------------------+---------+
   | BucketAlreadyOwnedByYou           | The previous request to create the named bucket        | 409     |
   |                                   | succeeded and the user already own it. This error is   |         |
   |                                   | received in all AWS regions except US Standard,        |         |
   |                                   | us-east-1. In the us-east-1 region, the user will get  |         |
   |                                   | 200 OK, but it is no-op (if bucket exists S3 will not  |         |
   |                                   | do anything).                                          |         |
   +-----------------------------------+--------------------------------------------------------+---------+
   | BucketNotEmpty                    | The bucket the user tried to delete is not empty       | 409     |
   +-----------------------------------+--------------------------------------------------------+---------+
   | CredentialsNotSupported           | This request does not support credentials              | 400     |
   +-----------------------------------+--------------------------------------------------------+---------+
   | CrossLocationLoggingProhibited    | Cross-location logging not allowed. Buckets in one     | 403     |
   |                                   | geographic location cannot log information to a bucket |         |
   |                                   | in another location                                    |         |
   +-----------------------------------+--------------------------------------------------------+---------+
   | DeleteConflict                    | The request was rejected because it attempted to       | 409     |
   |                                   | delete a resource that has attached subordinate        |         |
   |                                   | entities. The error message describes these entities   |         |
   +-----------------------------------+--------------------------------------------------------+---------+
   | EntityAlreadyExists               | The request was rejected because it attempted to       | 409     |
   |                                   | create a resource that already exists                  |         |
   +-----------------------------------+--------------------------------------------------------+---------+
   | EntityDoesNotExist                | Not found                                              | 404     |
   +-----------------------------------+--------------------------------------------------------+---------+
   | EntityTooSmall                    | The proposed upload is smaller than the minimum        | 400     |
   |                                   | allowed object size                                    |         |
   +-----------------------------------+--------------------------------------------------------+---------+
   | EntityTooLarge                    | The proposed upload exceeds the maximum allowed object | 400     |
   |                                   | size                                                   |         |
   +-----------------------------------+--------------------------------------------------------+---------+
   | ExpiredToken                      | The provided token has expired                         | 400     |
   +-----------------------------------+--------------------------------------------------------+---------+
   | Forbidden                         | Authentication failed                                  | 403     |
   +-----------------------------------+--------------------------------------------------------+---------+
   | IllegalVersioningConfigurationEx\ | Indicates that the versioning configuration specified  | 400     |
   | ception                           | in the request is invalid                              |         |
   +-----------------------------------+--------------------------------------------------------+---------+
   | IncompleteBody                    | User did not provide the number of bytes specified by  | 400     |
   |                                   | the Content-Length HTTP header                         |         |
   +-----------------------------------+--------------------------------------------------------+---------+
   | IncompleteSignature               | Request signature is incomplete                        | 400     |
   +-----------------------------------+--------------------------------------------------------+---------+
   | IncorrectNumberOfFilesInPostRe\   | POST requires exactly one file upload per request      | 400     |
   | quest                             |                                                        |         |
   +-----------------------------------+--------------------------------------------------------+---------+
   | InlineDataTooLarge                | Inline data exceeds the maximum allowed size           | 400     |
   +-----------------------------------+--------------------------------------------------------+---------+
   | InternalError                     | Internal error encountered. Please try again           | 500     |
   +-----------------------------------+--------------------------------------------------------+---------+
   | InternalFailure                   | The request processing has failed because of an        | 500     |
   |                                   | unknown error, exception or failure                    |         | 
   +-----------------------------------+--------------------------------------------------------+---------+
   | InvalidAccessKeyId                | The AWS access key ID provided does not exist in our   | 403     |
   |                                   | records                                                |         |
   +-----------------------------------+--------------------------------------------------------+---------+
   | InvalidAction                     | The action or operation requested is invalid. Verify   | 400     |
   |                                   | that the action is typed correctly                     |         |
   +-----------------------------------+--------------------------------------------------------+---------+
   | InvalidAddressingHeader           | The Anonymous role must be specified                   | 400     |
   +-----------------------------------+--------------------------------------------------------+---------+
   | InvalidArgument                   | Invalid argument provided                              | 400     |
   +-----------------------------------+--------------------------------------------------------+---------+
   | InvalidBucketName                 | Specified bucket is not valid                          | 400     |
   +-----------------------------------+--------------------------------------------------------+---------+
   | InvalidBucketState                | The request is not valid with the current state of the | 409     |
   |                                   | bucket                                                 |         |
   +-----------------------------------+--------------------------------------------------------+---------+
   | InvalidClientTokenId              | The X.509 certificate or AWS access key ID provided    | 403     |
   |                                   | does not exist in our records                          |         |
   +-----------------------------------+--------------------------------------------------------+---------+
   | InvalidDigest                     | The Content-MD5 specified is not valid                 | 400     |
   +-----------------------------------+--------------------------------------------------------+---------+
   | InvalidEncryptionAlgorithmError   | The encryption request specified is not valid (the     | 400     |
   |                                   | valid value is AES256)                                 |         |
   +-----------------------------------+--------------------------------------------------------+---------+
   | InvalidInput                      | The request was rejected because an invalid or         | 400     |
   |                                   | out-of-range value was supplied for an input parameter |         |
   +-----------------------------------+--------------------------------------------------------+---------+
   | InvalidLocationConstraint         | The specified location constraint is not valid         | 400     |
   +-----------------------------------+--------------------------------------------------------+---------+
   | InvalidObjectState                | The operation is not valid for the current state of    | 403     |
   |                                   | the object                                             |         |
   +-----------------------------------+--------------------------------------------------------+---------+
   | InvalidParameterCombination       | Parameters that must not be used together were used    | 400     |
   |                                   | together                                               |         |
   +-----------------------------------+--------------------------------------------------------+---------+
   | InvalidParameterValue             | An invalid or out-of-range value was supplied for the  | 400     |
   |                                   | input parameter                                        |         |
   +-----------------------------------+--------------------------------------------------------+---------+
   | InvalidPart                       | One or more of the specified parts could not be found. | 400     |
   |                                   | The part might not have been uploaded, or the          |         |
   |                                   | specified entity tag might not have matched the part's |         |
   |                                   | entity tag                                             |         |
   +-----------------------------------+--------------------------------------------------------+---------+
   | InvalidPartOrder                  | The list of parts was not in ascending order. The      | 400     |
   |                                   | parts list must specified in order by part number      |         |
   +-----------------------------------+--------------------------------------------------------+---------+
   | InvalidPayer                      | All access to this object has been disabled            | 403     |
   +-----------------------------------+--------------------------------------------------------+---------+
   | InvalidPolicyDocument             | The content of the form does not meet the conditions   | 400     |
   |                                   | specified in the policy document                       |         |
   +-----------------------------------+--------------------------------------------------------+---------+
   | InvalidQueryParameter             | The AWS query string is malformed or does not adhere   | 400     |
   |                                   | to AWS standards                                       |         |
   +-----------------------------------+--------------------------------------------------------+---------+
   | InvalidRange                      | The requested range cannot be satisfied                | 416     |
   +-----------------------------------+--------------------------------------------------------+---------+
   | InvalidRequest                    | SOAP requests must be made over an HTTPS connection    | 400     |
   +-----------------------------------+--------------------------------------------------------+---------+
   | InvalidSecurity                   | The provided security credentials are not valid        | 403     |
   +-----------------------------------+--------------------------------------------------------+---------+
   | InvalidSOAPRequest                | The SOAP request body is invalid                       | 400     |
   +-----------------------------------+--------------------------------------------------------+---------+
   | InvalidStorageClass               | The storage class specified is not valid               | 400     |
   +-----------------------------------+--------------------------------------------------------+---------+
   | InvalidTargetBucketForLogging     | The target bucket for logging does not exist, is not   | 400     |
   |                                   | owned by the user, or does not have the appropriate    |         |
   |                                   | grants for the log-delivery group                      |         |
   +-----------------------------------+--------------------------------------------------------+---------+
   | InvalidToken                      | The provided token is malformed or otherwise invalid   | 400     |
   +-----------------------------------+--------------------------------------------------------+---------+
   | InvalidURI                        | Could not parse the specified URI                      | 400     |
   +-----------------------------------+--------------------------------------------------------+---------+
   | KeyTooLong                        | User's key is too long                                 | 400     |
   +-----------------------------------+--------------------------------------------------------+---------+
   | LimitExceeded                     | Request was rejected because it attempted to create    | 409     |
   |                                   | resources beyond the current AWS account limit. The    |         |
   |                                   | error message describes the limit exceeded             |         |
   +-----------------------------------+--------------------------------------------------------+---------+
   | MalformedACLError                 | The XML provided was not well-formed or did not        | 400     |
   |                                   | validate against the published schema                  |         |
   +-----------------------------------+--------------------------------------------------------+---------+
   | MalformedPolicyDocument           | Syntax errors in policy                                | 400     |
   +-----------------------------------+--------------------------------------------------------+---------+
   | MalformedPOSTRequest              | The body of the POST request is not well formed        | 400     |
   |                                   | multipart/form data.                                   |         |
   +-----------------------------------+--------------------------------------------------------+---------+
   | MalformedQueryString              | The query string contains a syntax error               | 404     |
   +-----------------------------------+--------------------------------------------------------+---------+
   | MalformedXML                      | The XML provided was not well formed or did not        | 400     |
   |                                   | validate against the published schema                  |         |
   +-----------------------------------+--------------------------------------------------------+---------+
   | MaxMessageLengthExceeded          | Request is too big                                     | 400     |
   +-----------------------------------+--------------------------------------------------------+---------+
   | MaxPostPreDataLengthExceededError | The POST request fields preceding the upload file were | 400     |
   |                                   | too large                                              |         |
   +-----------------------------------+--------------------------------------------------------+---------+
   | MetadataTooLarge                  | The metadata headers exceed the maximum allowed        | 400     |
   |                                   | metadata size                                          |         |
   +-----------------------------------+--------------------------------------------------------+---------+
   | MethodNotAllowed                  | The specified method is not allowed against this       | 405     |
   |                                   | resource                                               |         |
   +-----------------------------------+--------------------------------------------------------+---------+
   | MissingAction                     | The request is missing an action or a required         | 400     |
   |                                   | parameter                                              |         |
   +-----------------------------------+--------------------------------------------------------+---------+
   | MissingAttachment                 | A SOAP attachment was expected, but none were found    | 400     |
   +-----------------------------------+--------------------------------------------------------+---------+
   | MissingAuthenticationToken        | The request must contain either a valid (registered)   | 403     |
   |                                   | access key ID or X.509 certificate                     |         |
   +-----------------------------------+--------------------------------------------------------+---------+
   | MissingContentLength              | User must provide the Content-Length HTTP header       | 411     |
   +-----------------------------------+--------------------------------------------------------+---------+
   | MissingParameter                  | A required parameter for the specified action is not   | 400     |
   |                                   | supplied                                               |         |
   +-----------------------------------+--------------------------------------------------------+---------+
   | MissingRequestBodyError           | Request body is empty                                  | 400     |
   +-----------------------------------+--------------------------------------------------------+---------+
   | MissingSecurityElement            | The SOAP 1.1 request is missing a security element     | 400     |
   +-----------------------------------+--------------------------------------------------------+---------+
   | MissingSecurityHeader             | The request is missing a required header               | 400     |
   +-----------------------------------+--------------------------------------------------------+---------+
   | NoLoggingStatusForKey             | There is no such thing as a logging status subresource | 400     |
   |                                   | for a key                                              |         |
   +-----------------------------------+--------------------------------------------------------+---------+
   | NoSuchBucket                      | The specified bucket does not exist                    | 404     |
   +-----------------------------------+--------------------------------------------------------+---------+
   | NoSuchEntity                      | The request was rejected because it referenced an      | 404     |
   |                                   | entity that does not exist. The error message          |         |
   |                                   | describes the entity                                   |         |
   +-----------------------------------+--------------------------------------------------------+---------+
   | NoSuchKey                         | The specified key does not exist                       | 404     |
   +-----------------------------------+--------------------------------------------------------+---------+
   | NoSuchUpload                      | The specified multipart upload does not exis. The      | 404     |
   |                                   | upload ID might be invalid, or the multipart upload    |         |
   |                                   | might have been aborted or completed                   |         |
   +-----------------------------------+--------------------------------------------------------+---------+
   | NoSuchVersion                     | The version ID specified in the request does not match | 404     |
   |                                   | an existing version                                    |         |
   +-----------------------------------+--------------------------------------------------------+---------+
   | NotImplemented                    | A header provided implies functionality that is not    | 501     |
   |                                   | implemented                                            |         |
   +-----------------------------------+--------------------------------------------------------+---------+
   | NotModified                       | Not modified                                           | 304     |
   +-----------------------------------+--------------------------------------------------------+---------+
   | NotSignedUp                       | User's account is not signed up for the S3 service.    | 403     |
   |                                   | User must sign up before using S3                      |         |
   +-----------------------------------+--------------------------------------------------------+---------+
   | NoSuchBucketPolicy                | The specified bucket does not have a bucket policy     | 404     |
   +-----------------------------------+--------------------------------------------------------+---------+
   | OperationAborted                  | A conflicting conditional operation is currently in    | 409     |
   |                                   | progress against this resource. Try again              |         |
   +-----------------------------------+--------------------------------------------------------+---------+
   | OptInRequired                     | The AWS access key ID needs a subscription for the     | 403     |
   |                                   | service                                                |         |
   +-----------------------------------+--------------------------------------------------------+---------+
   | PermanentRedirect                 | The bucket the user is attempting to access must be    | 301     |
   |                                   | addressed using the specified endpoint. Send all       |         |
   |                                   | future requests to this endpoint                       |         |   
   +-----------------------------------+--------------------------------------------------------+---------+
   | PreconditionFailed                | At least one of the preconditions specified did not    | 412     |
   |                                   | hold                                                   |         |
   +-----------------------------------+--------------------------------------------------------+---------+
   | Redirect                          | Temporary redirect                                     | 307     |
   +-----------------------------------+--------------------------------------------------------+---------+
   | RestoreAlreadyInProgress          | Object restore is already in progress                  | 409     |
   +-----------------------------------+--------------------------------------------------------+---------+
   | RequestExpired                    | The request reached the service more than 15 minutes   | 400     |
   |                                   | after the date stamp on the request or after the       |         |
   |                                   | request expiration date (such as for pre-signed URLs), |         |
   |                                   | or the date stamp on the request is more than 15       |         |
   |                                   | minutes in the future                                  |         |
   +-----------------------------------+--------------------------------------------------------+---------+
   | RequestIsNotMultiPartContent      | Bucket POST must be of the enclosure-type multipart/   | 400     |
   |                                   | form data                                              |         |
   +-----------------------------------+--------------------------------------------------------+---------+
   | RequestTimeout                    | The socket connection to the server was not read from  | 400     |
   |                                   | or written to within the timeout period                |         |
   +-----------------------------------+--------------------------------------------------------+---------+
   | RequestTimeTooSkewed              | The difference between the request time and the        | 403     |
   |                                   | server's time is too large                             |         |
   +-----------------------------------+--------------------------------------------------------+---------+
   | RequestTorrentOfBucketError       | Requesting the torrent file of a bucket is not         | 400     |
   |                                   | permitted                                              |         |
   +-----------------------------------+--------------------------------------------------------+---------+
   | ServiceFailure                    | Server error: the request processing failed because of | 500     |
   |                                   | an unknown error, exception or failure                 |         |
   +-----------------------------------+--------------------------------------------------------+---------+
   | ServiceUnavailable                | The request failed due to a temporary failure of the   | 503     |
   |                                   | server                                                 |         |
   +-----------------------------------+--------------------------------------------------------+---------+
   | SignatureDoesNotMatch             | The request signature calculated does not match the    | 403     |
   |                                   | signature provided                                     |         |
   +-----------------------------------+--------------------------------------------------------+---------+
   | SlowDown                          | Reduce the request rate                                | 503     |
   +-----------------------------------+--------------------------------------------------------+---------+
   | TemporaryRedirect                 | The user is being redirected to the bucket while DNS   | 307     |
   |                                   | updates                                                |         | 
   +-----------------------------------+--------------------------------------------------------+---------+
   | Throttling                        | The request was denied due to request throttling       | 400     |
   +-----------------------------------+--------------------------------------------------------+---------+
   | TokenRefreshRequired              | The provided token must be refreshed                   | 400     |
   +-----------------------------------+--------------------------------------------------------+---------+
   | TooManyBuckets                    | The user attempted to create more buckets than allowed | 400     |
   +-----------------------------------+--------------------------------------------------------+---------+
   | TooManyParts                      | The user attempted to upload more parts than allowed   | 400     |
   +-----------------------------------+--------------------------------------------------------+---------+
   | UnexpectedContent                 | The request does not support content                   | 400     |
   +-----------------------------------+--------------------------------------------------------+---------+
   | UnresolvableGrantByEmailAddress   | The email address provided does not match any account  | 400     |
   |                                   | on record                                              |         |   
   +-----------------------------------+--------------------------------------------------------+---------+
   | UserKeyMustBeSpecified            | The bucket POST must contain the specified field name. | 400     |
   |                                   | If it is specified, check the order of the fields      |         |
   +-----------------------------------+--------------------------------------------------------+---------+
   | ValidationError                   | The specified value is invalid                         | 400     |
   +-----------------------------------+--------------------------------------------------------+---------+
   | WrongFormat                       | Data entered by the user has a wrong format            | 400     |
   +-----------------------------------+--------------------------------------------------------+---------+
