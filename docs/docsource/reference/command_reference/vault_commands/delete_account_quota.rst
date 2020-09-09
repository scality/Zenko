.. _delete-account-quota:

delete-account-quota
====================

Account quotas impose an upper limit on the amount of data that can be written
for an account. Quotas can be set at account creation as an option to the
create-account command, or added or changed using the update-account-quota
command. 

Once such a quota is introduced, it can be removed from the account either by
setting the quota to zero or with an invocation of delete-account-quota, which
eliminates the quota for that account altogether and has the same functional
effect. The response contains no quota information. The logic for quotas is that
a zero-value quota is the same as a null quota, meaning no quota limit is set on
the account.

Request Syntax
--------------

.. code::

   ./bin/vaultclient delete-account-quota --account-name <account-name>

Response
--------

On a successful request, Vault returns a JSON object containing the account's
ARN, ID, and 64-byte canonical ID hash.

.. code::

   {
    "arn": "arn:aws:iam::<12-byteID>:/<account-name>/",
    "id": "<12-byte ID>",
    "canonicalId": "<64-byte canonical ID>"
   }
   
Example
-------

*Request:*

.. code:: 

   $ ./bin/vaultclient delete-account-quota --account-name test

*Response:*

.. code::
   
   {
    "arn": "arn:aws:iam::425387641315:/test/",
    "id": "425387641315",
    "canonicalId": "3bde038ab73eb0e04a30ae7a6a5c9593314ada35e29f7b2f7761fdb9082d99e9"
   }

