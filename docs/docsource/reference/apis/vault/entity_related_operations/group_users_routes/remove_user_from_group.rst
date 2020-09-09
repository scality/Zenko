.. _RemoveUserFromGroup:

RemoveUserFromGroup
===================

Removes a user from a group.

Method and Path
---------------

.. code::

  POST /

Request Parameters
------------------

.. tabularcolumns:: lllll
.. table::
   :widths: auto

   +-----------+-------------------+--------+---------+-----------------------+
   | Name      | Description       | Type   | Default | Value                 |
   +===========+===================+========+=========+=======================+
   | Action    | Action to execute | string |         | 'RemoveUserFromGroup' |
   +-----------+-------------------+--------+---------+-----------------------+
   | Version   | Protocol version  | string |         | '2010-05-08'          |
   +-----------+-------------------+--------+---------+-----------------------+
   | GroupName | Name of group     | string |         |                       |
   +-----------+-------------------+--------+---------+-----------------------+
   | UserName  | Name of user      | string |         |                       |
   +-----------+-------------------+--------+---------+-----------------------+

Refer to
http://docs.aws.amazon.com/IAM/latest/APIReference/API_RemoveUserFromGroup.html

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
