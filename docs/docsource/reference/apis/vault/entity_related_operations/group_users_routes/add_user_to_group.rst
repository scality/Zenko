.. _AddUserToGroup:

AddUserToGroup
==============

Adds a user to a group.

Method and Path
---------------

.. code::

  POST /

Request Parameters
------------------

.. tabularcolumns:: lllll
.. table::
   :widths: auto

   +-----------+-------------------+--------+---------+------------------+
   | Name      | Description       | Type   | Default | Value            |
   +===========+===================+========+=========+==================+
   | Action    | Action to execute | string |         | 'AddUserToGroup' |
   +-----------+-------------------+--------+---------+------------------+
   | Version   | Protocol version  | string |         | '2010-05-08'     |
   +-----------+-------------------+--------+---------+------------------+
   | GroupName | Name of group     | string |         |                  |
   +-----------+-------------------+--------+---------+------------------+
   | UserName  | Name of user      | string |         |                  |
   +-----------+-------------------+--------+---------+------------------+

See also: `<https://docs.aws.amazon.com/IAM/latest/APIReference/API_AddUserToGroup.html>`_

and `<https://docs.aws.amazon.com/goto/WebAPI/iam-2010-05-08/AddUserToGroup>`_

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

