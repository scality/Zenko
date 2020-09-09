.. _Generate Account Access Key:

generate-account-access-key
===========================

Request Syntax
--------------

.. code::

   ./bin/vaultclient generate-account-access-key \
      --name <account name> \
      --accesskey <account access key> \
      --secretkey <account secret key>

You can request an account name, an access key, a secret key, or any
combination of these.


Vault does not assign:

  - Account IDs if an account with the same ID already exists in the database
  - Access keys if an account with the same access key already exists in the
    database.
      
Response
--------

The response to a vaultclient ``generate-account-access-key`` request is
a JSON object corresponding to the following schema:

.. code::

   {
     "arn": "{{accountarn}}",
     "id": "{{accessKey}}",
     "value": "{{secretKey}}",
     "createDate": "{{keyCreationDate}}",
     "lastUsedDate": "{{lastUsedDateForAccessKey}}",
     "status": "{{accessKeyStatus}}",
     "userId": "{{accountUserID}}"
   }

Examples
--------

Generate Account Access Key Request
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

.. code::

   ./bin/vaultclient generate-account-access-key --name test2

Generate Account Access Key Response
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

.. code::

   {
     "arn": "arn:aws:iam::142968920705:/CLE4SBNWDFT7AM5NQVUE/",
     "id": "CLE4SBNWDFT7AM5NQVUE",
     "value": "Csya=mVOO+JCnTIK1UTy+vaKFXclXWtyLWrsXV9E",
     "createDate": "2016-08-11T17:06:12Z",
     "lastUsedDate": "2016-08-11T17:06:12Z",
     "status": "Active",
     "userId": "142968920705"
   }
