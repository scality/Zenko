.. _ListAccounts:

ListAccounts
============

Lists all accounts.

Method and Path
---------------

.. code::

  POST /

Request Parameters
------------------

.. tabularcolumns:: lllll
.. table::
   :widths: auto

   +----------+-----------------------+--------+---------+----------------+
   | Name     | Description           | Type   | Default | Value          |
   +==========+=======================+========+=========+================+
   | Action   | Action to execute     | string |         | 'ListAccounts' |
   +----------+-----------------------+--------+---------+----------------+
   | Version  | Protocol version      | string |         | '2010-05-08'   |
   +----------+-----------------------+--------+---------+----------------+
   | Marker   | Marker for pagination | string | '0'     |                |
   +----------+-----------------------+--------+---------+----------------+
   | MaxItems | Max items to list     | number | 100     |                |
   +----------+-----------------------+--------+---------+----------------+

Output Format
-------------

.. code::

   {
       isTruncated: false | true // whether the list end was reached
       accounts: array // accounts info
       [ marker: string ] // marker for next pagination ]
   }

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

   +------+----------------+
   | Code | Message        |
   +======+================+
   | 400  | WrongFormat    |
   +------+----------------+
   | 500  | ServiceFailure |
   +------+----------------+
