.. _GetGroup:

GetGroup
========

Gets a group and the users in it.

Method and Path
---------------

.. code::

  POST /

Request Parameters
------------------

.. tabularcolumns:: lllll
.. table::
   :widths: auto

   +-----------+-----------------------+--------+---------+--------------+
   | Name      | Description           | Type   | Default | Value        |
   +===========+=======================+========+=========+==============+
   | Action    | Action to execute     | string |         | 'GetGroup'   |
   +-----------+-----------------------+--------+---------+--------------+
   | Version   | Protocol version      | string |         | '2010-05-08' |
   +-----------+-----------------------+--------+---------+--------------+
   | GroupName | Name of group         | string |         |              |
   +-----------+-----------------------+--------+---------+--------------+
   | Marker    | Marker for pagination | string | '0'     |              |
   +-----------+-----------------------+--------+---------+--------------+
   | MaxItems  | Max users to return   | number | 100     |              |
   +-----------+-----------------------+--------+---------+--------------+

Refer to http://docs.aws.amazon.com/IAM/latest/APIReference/API_GetGroup.html

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
