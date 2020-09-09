.. _List Accounts:

list-accounts
=============

Request Syntax
--------------

.. code::

   ./bin/vaultclient list-accounts [--maxItems <maximum number of accounts returned>] [--marker <marker for next pagination>]

Response
--------

The response to a vaultclient ``list-accounts`` request is a JSON object
corresponding to the following schema:

.. code::

   {
     "isTruncated": {{true_or_false}},
     "marker": "[marker for next pagination, included if isTruncated is true]",
     "accounts": [
       {
         "arn": "{{accountarn}}",
         "id": "{{accountIdentifier}}",
         "name": "{{accountName}}",
         "createDate": "{{accountCreationDate}}",
         "emailAddress": "{{emailAddress}}",
         "canonicalId": "{{accountCanonicalIdentifier}}"
       },
       {
         ... //arn, id, name, createDate, emailAddress, cannonicalId
       }
     }
   }

Examples
--------

*List Accounts Request*

.. code::

   ./bin/vaultclient list-accounts --maxItems 30

*List Accounts Response*

.. code::

   {"isTruncated": false,
   "accounts": [
       {
         "arn": "arn:aws:iam::341220772100:/john/",
         "id": "341220772100",
         "name": "john",
         "createDate": "2016-07-02T21:47:53Z",
         "emailAddress": "john@acme.com",
         "canonicalId": "UO62HEUU76W5LYMG41SO3MQZQQN21YGQ1ZSF25B47GNUCC5F1"
       },
       {
         "arn": "arn:aws:iam::148910879031:/jane/",
         "id": "148910879031",
         "name": "jane",
         "createDate": "2016-07-02T21:59:27Z",
         "emailAddress": "jane@acme.com",
         "canonicalId": "ZTMP1J67M0VYI8T1DFB0S60ELIOSWC6VD1W1BQC24JF2VJEPQ"
       },
       {
         "arn": "arn:aws:iam::433602879118:/lisa/",
         "id": "433602879118",
         "name": "lisa",
         "createDate": "2016-07-02T21:59:32Z",
         "emailAddress": "lisa@acme.com",
         "canonicalId": "E81ZJFT0DP5KSUL5ZE8EUT4VYE8EZQAKUGS0VTF1QDD7PGXF0"
       }
     ]
   }
