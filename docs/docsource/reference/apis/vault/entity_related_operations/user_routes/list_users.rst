.. _ListUsers:

ListUsers
=========

Lists users of an account.

Method and Path
---------------

.. code::

  POST /

Request Parameters
------------------

.. tabularcolumns:: lllll
.. table::
   :widths: auto

   +------------+-----------------------------+--------+---------+-------------+
   | Name       | Description                 | Type   | Default | Value       |
   +============+=============================+========+=========+=============+
   | Action     | Action to execute           | string |         | 'ListUsers' |
   +------------+-----------------------------+--------+---------+-------------+
   | PathPrefix | List users in specific path | string | '/'     |             |
   +------------+-----------------------------+--------+---------+-------------+
   | Marker     | Marker for pagination       | string | '0'     |             |
   +------------+-----------------------------+--------+---------+-------------+
   | MaxItems   | Max users to list           | number | 100     |             |
   +------------+-----------------------------+--------+---------+-------------+

Refer to http://docs.aws.amazon.com/IAM/latest/APIReference/API_ListUsers.html

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
