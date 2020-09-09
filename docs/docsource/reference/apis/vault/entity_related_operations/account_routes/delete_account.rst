.. _DeleteAccount:

DeleteAccount
=============

Deletes an account.

.. warning::
   
   Delete all data before deleting an account.
        
   This route deletes an account only, even if it still holds
   S3 buckets and data. Deleting the account before its contents can "strand" data.

Method and Path
---------------

``POST /``

Request Parameters
------------------

.. tabularcolumns:: lllll
.. table::
   :widths: auto

   +-------------+-------------------+--------+---------+-----------------+
   | Name        | Description       | Type   | Default | Value           |
   +=============+===================+========+=========+=================+
   | Action      | Action to execute | string |         | 'DeleteAccount' |
   +-------------+-------------------+--------+---------+-----------------+
   | Version     | Protocol version  | string |         | '2010-05-08'    |
   +-------------+-------------------+--------+---------+-----------------+
   | AccountName | Name of account   | string |         |                 |
   +-------------+-------------------+--------+---------+-----------------+

Output Format
-------------

.. code::

   {}

Success Code
------------

.. tabularcolumns:: ll
.. table::
   :widths: auto

   +------+---------+
   | Code | Message |
   +======+=========+
   | 200  | OK      |
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

