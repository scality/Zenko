.. _UpdateAccessKey:

UpdateAccessKey
===============

Changes the status of the specified access key from "active" to "inactive", or
vice-versa. This operation can be used to disable a user's key as part of a key
rotation workflow.

If the UserName is not specified, the user name is assumed from the AWS access
key ID used to sign the request. This operation works for access keys under the
AWS account. Consequently, you can use this operation to manage AWS account root
user credentials even if the AWS account has no associated users.

For information about rotating keys, see `Managing Keys and Certificates
<https://docs.aws.amazon.com/IAM/latest/UserGuide/ManagingCredentials.html>`_
in the *IAM User Guide*.

Request Parameters
------------------

**AccessKeyId**

    The access key ID of the secret access key you want to update.

    This parameter allows (through its regex pattern) a string of characters
    that can consist of any upper- or lower-cased letter or digit.

    Type: String

    Length Constraints: Minimum length of 16. Maximum length of 128.

    Pattern: [\w]+

    Required: Yes
    
**Status**

    The status you want to assign to the secret access key. Active means that
    the key can be used for API calls to AWS, while Inactive means that the key
    cannot be used.

    Type: String

    Valid Values: Active | Inactive

    Required: Yes

**UserName**

    The user name of the key you want to update.

    This parameter allows (through its regex pattern) a string of characters
    consisting of upper- and lower-case alphanumeric characters with no
    spaces. You can also include any of the following characters: "_", "+", "=",
    ",", ".", "@", and "-"

    Type: String

    Length Constraints: Minimum length of 1. Maximum length of 128.

    Pattern: [\w+=,.@-]+

    Required: No

Errors
------

For errors that are common to all actions, see `Common Errors
<https://docs.aws.amazon.com/IAM/latest/APIReference/CommonErrors.html>`_.

**LimitExceeded**

    The request was rejected because it attempted to create resources beyond
    current account limits. The error message describes the limit exceeded.

    HTTP Status Code: 409

**NoSuchEntity**

    The request was rejected for referencing a nonexistent resource entity.
    The error message describes the resource.

    HTTP Status Code: 404
    
**ServiceFailure**

    The request processing failed because of an unknown error, exception or
    failure.

    HTTP Status Code: 500

Example
-------

Sample Request
~~~~~~~~~~~~~~

.. code::
   
   https://iam.amazonaws.com/?Action=UpdateAccessKey
   &UserName=Bob
   &AccessKeyId=AKIAIOSFODNN7EXAMPLE
   &Status=Inactive
   &Version=2010-05-08
   &AUTHPARAMS

Sample Response
~~~~~~~~~~~~~~~

.. code::
   
   <UpdateAccessKeyResponse>
     <ResponseMetadata>
       <RequestId>7a62c49f-347e-4fc4-9331-6e8eEXAMPLE</RequestId>
     </ResponseMetadata>
   </UpdateAccessKeyResponse>

