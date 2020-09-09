.. _Creating a Quota-Restricted Account:

Creating a Quota-Restricted Account
===================================

Setting a quota on an account is optional. If no quota is set, zero (no quota) 
is assumed.

Request Syntax
--------------

- Using Vaultclient:

  .. code::
  
     ./bin/vaultclient create-account --name <account name> --email <email address> --quota <*n* bytes>

- Using the playbook:

  ::

     ./ansible-playbook -i <inventory> \
       tooling-playbooks/generate-account-access-key.yml \
       -e account_name=<Account name> \
       -e account_email=<Account email> \
       -e account_quota=<Account quota>

Response
--------

The response to a vaultclient ``create-account`` request with the ``--quota``
option invoked is a JSON object corresponding to the following schema:

.. code::

   {
     "account": {
       "arn": "{{account ARN}}",
       "canonicalId": "{{account canonical identifier}}",
       "id": "{{account identifier}}",
       "emailAddress": "{{associated email address}}",
       "name": "{{account name}}",
       "createDate": "{{account creation date}}"
       "aliasList": [{{array listing aliases}}],
       "oidcpList": [{{array listing OIDC identity providers}}],
       "quotaMax": {{quota size, in bytes}}
     }
   }

The aliasList and oidcpList fields may be empty.

.. tip:: 

   For more information on OIDC identity providers, see 
   https://docs.aws.amazon.com/IAM/latest/UserGuide/id_roles_providers_create_oidc.html 

Example
-------

*Create Account Request*

.. code::

   ./bin/vaultclient create-account --name test --email account@test.com --quota 1000000

*Create Account Response*

.. code::

   {
     "account": {
        "arn": "arn:aws:iam::425387641315:/test/",
        "canonicalId": "3bde038ab73eb0e04a30ae7a6a5c9593314ada35e29f7b2f7761fdb9082d99e9",
        "id": "425387641315",
        "emailAddress": "test@test.com",
        "name": "test",
        "createDate": "2019-02-26T19:08:02Z",
        "aliasList": [],
        "oidcpList": [],
        "quotaMax": 1000000
      }
   }

