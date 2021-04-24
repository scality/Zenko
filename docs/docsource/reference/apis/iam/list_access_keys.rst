.. _ListAccessKeys:

ListAccessKeys
==============

Lists access keys for an account or a user.

Method and Path
---------------

.. code::

  POST /

Request Parameters
------------------

.. tabularcolumns:: lllll
.. table::
   :widths: auto

   +----------+---------------------------+--------+---------+--------------------+
   | Name     | Description               | Type   | Default | Value              |
   +==========+===========================+========+=========+====================+
   | Action   | Action to execute         | string |         | ``ListAccessKeys`` |
   +----------+---------------------------+--------+---------+--------------------+
   | Version  | Protocol version          | string |         | ``2010-05-08``     |
   +----------+---------------------------+--------+---------+--------------------+
   | UserName | Name of user              | string | ''      |                    |
   +----------+---------------------------+--------+---------+--------------------+
   | Marker   | Marker for pagination     | string | '0'     |                    |
   +----------+---------------------------+--------+---------+--------------------+
   | MaxItems | Max access keys to return | number | 100     |                    |
   +----------+---------------------------+--------+---------+--------------------+

Refer to
http://docs.aws.amazon.com/IAM/latest/APIReference/API_ListAccessKeys.html

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

