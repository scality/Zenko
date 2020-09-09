.. _CreateAccount:

CreateAccount
-------------

Creates a new account.

Method and Path
---------------

``POST /``

Request Parameters
------------------

.. tabularcolumns:: lLlll
.. table::
   :widths: auto

   +--------------+-----------------------+--------+---------+-----------------+
   | Name         | Description           | Type   | Default | Value           |
   +==============+=======================+========+=========+=================+
   | Action       | Action to execute     | string |         | 'CreateAccount' |
   +--------------+-----------------------+--------+---------+-----------------+
   | Version      | Protocol version      | string |         | '2010-05-08'    |
   +--------------+-----------------------+--------+---------+-----------------+
   | name         | Name of account       | string |         |                 |
   +--------------+-----------------------+--------+---------+-----------------+
   | emailAddress | Account email address | string |         |                 |
   +--------------+-----------------------+--------+---------+-----------------+
   | quotaMax     | Maximum amount of     | number |         |                 |
   |              | bytes storable by the |        |         |                 |
   |              | Account (quota)       |        |         |                 |
   +--------------+-----------------------+--------+---------+-----------------+

Output Format
-------------

.. code::

   {
        " " : {
           "arn": "string", // account arn
           "email": "string", // account email
           "id": "string", // account identifier
           "canonicalId": "string" // account canonical identifier
       }
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

   +------+---------------------+
   | Code | Message             |
   +======+=====================+
   | 400  | WrongFormat         |
   +------+---------------------+
   | 409  | EntityAlreadyExists |
   +------+---------------------+
   | 500  | ServiceFailure      |
   +------+---------------------+

