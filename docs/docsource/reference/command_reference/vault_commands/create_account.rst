.. _Create Account:

create-account
==============

Request
-------

.. code::

   ./bin/vaultclient create-account --name <account name> \
     --email <email address> \
     --accountid <accountID>

Vault does not accept:

  - Any entity not formatted per AWS guidelines
  - Duplicate account IDs
  - Duplicate access keys

Response
--------

The response to a vaultclient ``create-account`` request is a JSON
object corresponding to the following schema:

.. code::

   {
     "account": {
       "arn": "{{account ARN}}",
       "canonicalId": "{{account canonical identifier}}",
       "id": "{{account identifier}}",
       "emailAddress": "{{associated email address}}",
       "name": "{{account name}}",
       "createDate": "{{account creation date}}"
     }
   }

Examples
--------

Create Account Request
~~~~~~~~~~~~~~~~~~~~~~

.. code::

   ./bin/vaultclient create-account --name test --email account@test.com
   

Create Account Response
~~~~~~~~~~~~~~~~~~~~~~~

.. code::

   {
     "account": {
        "arn": "arn:aws:iam::425387641315:/test/",
        "canonicalId": "3bde038ab73eb0e04a30ae7a6a5c9593314ada35e29f7b2f7761fdb9082d99e9",
        "id": "425387641315",
        "emailAddress": "test@test.com",
        "name": "test",
        "createDate": "2019-02-26T19:08:02Z",
      }
   }
