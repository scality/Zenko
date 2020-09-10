.. _update-account-uota:

update-account-quota
====================

Each account may take a quota as an added property. If a quota was established
when an account was created, this property can be modified with the
update-account-quota command. If the account was created without a quota (for
example, an account that predates Zenko release 7.5), a quota can be
imposed on the account using this command, modifying the quota value from the
existing no-quota value (zero) to the quota value. The quota value is a number
corresponding to the maximum number of bytes. Abbreviations such as KB, M, or
GiB are not accepted. On an update, the requested quota value is returned in the
``quotaMax`` field.

Request Syntax
--------------

.. code::

   $ ./bin/vaultclient update-account-quota --account-name <account-name> --quota <numeric>

Response
--------

On a successful request, Vault returns ID strings and the quota value entered in the request,
indicating that the quota value has been successfully applied to the account.

.. code::

   {
      "arn": "arn:aws:iam::<12-byteID>:/<account-name>/",
      "id": "<12-byte ID>",
      "canonicalId": "<64-byte canonical ID>",
      "quota": <numeric>
   }

Example
-------

*Request:*

.. code::

   $ ./bin/vaultclient update-account-quota --account-name test --quota 10000000000

*Response:*   

.. code::

   {
      "arn": "arn:aws:iam::425387641315:/test/",
      "id": "425387641315",
      "canonicalId": "3bde038ab73eb0e04a30ae7a6a5c9593314ada35e29f7b2f7761fdb9082d99e9",
      "quota": 10000000000
   }

.. note::

   Setting the quota value to zero is the same as not setting the quota value at
   all. The value is assumed unset and no quota is imposed on the account.
