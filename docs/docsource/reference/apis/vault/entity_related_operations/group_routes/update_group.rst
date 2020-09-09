.. _UpdateGroup:

UpdateGroup
===========

Updates the name and path of a specified IAM group.

.. important::

   Changing a group's path or name can carry unforeseen consequences. Study
   Amazon's description of `Identities (Users, Groups, and Roles)
   <https://docs.aws.amazon.com/IAM/latest/UserGuide/Using_WorkingWithGroupsAndUsers.html>`_
   in the *IAM User Guide* before changing a group's path or name.

.. Note::

   The person making the request (the principal), must have permission to change
   the role group with the old name and the new name. For example, to change the
   group named "Managers" to "MGRs", the principal must have a policy that
   allows them to update both groups. If the principal has permission to update
   the "Managers" group, but not the "MGRs" group, the update fails. For more on
   permissions, see `Access Management
   <https://docs.aws.amazon.com/IAM/latest/UserGuide/access.html>`_.

Request Parameters
------------------

**GroupName**

    Name of the IAM group to update. If you are changing the group name, this is
    the original name.

    This parameter allows (through its regex pattern) a string of characters
    consisting of upper- and lower-case alphanumeric characters with no
    spaces. You can also include any of the following characters: "_", "+", "=",
    ",", ".", "@", and "-".

    Type: String

    Length Constraints: Minimum length of 1. Maximum length of 128.

    Pattern: [\w+=,.@-]+

    Required: Yes

**NewGroupName**

    New name for the IAM group. Only include this if changing the group's name.

    IAM user, group, role, and policy names must be unique within the
    account. Names are not distinguished by case. For example, you cannot create
    resources named both "MyResource" and "myresource".

    Type: String

    Length Constraints: Minimum length of 1. Maximum length of 128.

    Pattern: [\w+=,.@-]+

    Required: No

**NewPath**

    New path for the IAM group. Only include this if changing the group's path.

    This parameter allows (through its regex pattern) a string of characters
    consisting of either a forward slash (/) by itself or a string that must
    begin and end with forward slashes. In addition, it can contain any ASCII
    character from "!" (\u0021) through the DEL character (\u007F), including
    most punctuation characters, digits, and upper- and lower-cased letters.

    Type: String

    Length Constraints: Minimum length of 1. Maximum length of 512.

    Pattern: (\u002F)|(\u002F[\u0021-\u007F]+\u002F)

    Required: No

Errors
------

For errors that are common to all actions, see `Common Errors
<https://docs.aws.amazon.com/IAM/latest/APIReference/CommonErrors.html>`_.

**EntityAlreadyExists**

    The request was rejected because it attempted to create a resource that already exists.

    HTTP Status Code: 409
    
**LimitExceeded**

    The request was rejected because it attempted to create resources beyond the
    current AWS account limits. The error message describes the limit exceeded.

    HTTP Status Code: 409
    
**NoSuchEntity**

    The request was rejected because it referenced a resource entity that does
    not exist. The error message describes the resource.

    HTTP Status Code: 404

**ServiceFailure**

    The request processing has failed because of an unknown error, exception or
    failure.

    HTTP Status Code: 500

Example
-------

Sample Request
~~~~~~~~~~~~~~

.. code::
   
   https://iam.amazonaws.com/?Action=UpdateGroup
   &GroupName=Test
   &NewGroupName=Test_1
   &Version=2010-05-08
   &AUTHPARAMS

Sample Response
~~~~~~~~~~~~~~~

..code::

   <UpdateGroupResponse xmlns="https://iam.amazonaws.com/doc/2010-05-08/">
     <ResponseMetadata>
       <RequestId>7a62c49f-347e-4fc4-9331-6e8eEXAMPLE</RequestId>
     </ResponseMetadata>
   </UpdateGroupResponse>
