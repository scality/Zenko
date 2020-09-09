.. _UpdateUser:

Update User
===========

Updates the name and/or the path of the specified IAM user.

.. important::

   Changing an IAM user's path or name can carry unforeseen consequences. Study
   Amazon's description of `Renaming an IAM User
   <https://docs.aws.amazon.com/IAM/latest/UserGuide/id_users_manage.html#id_users_renaming>`_
   and `Renaming an IAM Group
   <https://docs.aws.amazon.com/IAM/latest/UserGuide/id_groups_manage_rename.html>`_
   before changing a user's name.

.. note::

  To change a user name, the requester must have appropriate permissions on both
  the source object and the target object. For example, to change "Bob" to
  "Robert", the entity making the request must have permissions for both Bob and
  Robert, or must have permission on all users (*). For more on permissions, see
  `Policies and Permissions
  <https://docs.aws.amazon.com/IAM/latest/UserGuide/access_policies.html>`_.

Request Parameters
------------------

**NewPath**

    New path for the IAM user. Only include this parameter if changing the user's path.

    This parameter allows (through its regex pattern) a string of characters
    consisting of either a forward slash (/) by itself or a string that must
    begin and end with forward slashes. In addition, it can contain any ASCII
    character from "!" (\u0021) through the DEL character (\u007F), including
    most punctuation characters, digits, and upper- and lower-cased letters.

    Type: String

    Length Constraints: Minimum length of 1. Maximum length of 512.

    Pattern: (\u002F)|(\u002F[\u0021-\u007F]+\u002F)

    Required: No

**NewUserName**

    New name for the user. Include this parameter only when changing the user's
    name.

    IAM user, group, role, and policy names must be unique within the
    account. Names are not distinguished by case. For example, you cannot create
    resources named both "MyResource" and "myresource".

    Type: String

    Length Constraints: Minimum length of 1. Maximum length of 64.

    Pattern: [\w+=,.@-]+

    Required: No

**UserName**

    Name of the user to update. If you are changing the name of the user, this
    is the original user name.

    This parameter allows (through its regex pattern) a string of characters
    consisting of upper- and lower-case alphanumeric characters with no
    spaces. You can also include any of the following characters: "_", "+", "=",
    ",", ".", "@", and "-".

    Type: String

    Length Constraints: Minimum length of 1. Maximum length of 128.

    Pattern: [\w+=,.@-]+

    Required: Yes

Errors
------

For errors that are common to all actions, see `Common Errors
<https://docs.aws.amazon.com/IAM/latest/APIReference/CommonErrors.html>`_.

**ConcurrentModification**

   The request was rejected because multiple concurrent requests were submitted
   to change the object. Wait a few minutes and resubmit the request.

   HTTP Status Code: 409

**EntityAlreadyExists**

   The request was rejected because it attempted to create a resource that
   already exists.

   HTTP Status Code: 409
   
**EntityTemporarilyUnmodifiable**

   The request was rejected because it referenced an entity that is temporarily
   unmodifiable, such as a user name that was deleted and then recreated. The
   request will likely succeed if you retry after several minutes. The error
   message describes the entity.

    HTTP Status Code: 409
    
**LimitExceeded**

   The request was rejected because it attempted to create resources beyond the
   current AWS account limits. The error message describes the limit exceeded.

    HTTP Status Code: 409
    
**NoSuchEntity**

   The request was rejected because it referenced a nonexistent resource
   entity. The error message describes the resource.

   HTTP Status Code: 404
   
**ServiceFailure**

   The request failed because of an unknown error, exception, or failure.

   HTTP Status Code: 500

Example
-------

Sample Request
~~~~~~~~~~~~~~

.. code::

   https://iam.amazonaws.com/?Action=UpdateUser
   &UserName=Bob
   &NewUserName=Robert
   &Version=2010-05-08
   &AUTHPARAMS

Sample Response
~~~~~~~~~~~~~~~

.. code::
   
   <UpdateUserResponse xmlns="https://iam.amazonaws.com/doc/2010-05-08/">
     <UpdateUserResult>
       <User>
         <Path>/division_abc/subdivision_xyz/</Path>
         <UserName>Robert</UserName>
         <UserId>AIDACKCEVSQ6C2EXAMPLE</UserId>
         <Arn>arn:aws::123456789012:user/division_abc/subdivision_xyz/Robert</Arn>
       </User>
     </UpdateUserResult>
     <ResponseMetadata>
       <RequestId>7a62c49f-347e-4fc4-9331-6e8eEXAMPLE</RequestId>
     </ResponseMetadata>
   </UpdateUserResponse>
