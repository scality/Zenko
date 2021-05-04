.. _GenerateAccountAccessKey:

GenerateAccountAccessKey
========================

Creates a new account access key. This is a super admin route.

Method and Path
---------------

.. code::

  POST /

Request Parameters
------------------

.. tabularcolumns:: lllll
.. table::
   :widths: auto

   +---------+-------------------+--------+---------+------------------------------+
   | Name    | Description       | Type   | Default | Value                        |
   +=========+===================+========+=========+==============================+
   | Action  | Action to execute | string |         | ``GenerateAccountAccessKey`` |
   +---------+-------------------+--------+---------+------------------------------+
   | Version | Protocol version  | string |         | ``2010-05-08``               |
   +---------+-------------------+--------+---------+------------------------------+
   | name    | Name of account   | string |         |                              |
   +---------+-------------------+--------+---------+------------------------------+

Output Format

.. code::

   {
       "arn": "arn:aws:iam::257673864942:/6UQZ3FQGNICTC8ZHTOLU/",
       "id": "6UQZ3FQGNICTC8ZHTOLU",
       "value": "0n=A2XPgUz=aXoO8hQ0dO4Lh1DlVzd3krnjvg8ll",
       "createDate": "2016-09-07T15:17:48Z",
       "lastUsedDate": "2016-09-07T15:17:48Z",
       "status": "Active",
       "userId": "257673864942"
   }

Success Code
------------

.. tabularcolumns:: ll
.. table::
   :widths: auto

   +------+---------+
   | Code | Message |
   +======+=========+
   | 201  | Created |
   +------+---------+

Error Codes
-----------

.. tabularcolumns:: ll
.. table::
   :widths: auto

   +------+--------------------+
   | Code | Message            |
   +======+====================+
   | 400  | WrongFormat        |
   +------+--------------------+
   | 404  | EntityDoesNotExist |
   +------+--------------------+
   | 500  | ServiceFailure     |
   +------+--------------------+
