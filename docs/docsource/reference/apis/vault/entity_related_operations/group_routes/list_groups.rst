.. _ListGroups:

ListGroups
==========

Lists groups.

Method and Path
---------------

.. code::

  POST /

Request Parameters
------------------

.. tabularcolumns:: lllll
.. table::
   :widths: auto

   +------------+-------------------------------+--------+---------+--------------+
   | Name       | Description                   | Type   | Default | Value        |
   +============+===============================+========+=========+==============+
   | Action     | Action to execute             | string |         | 'ListGroups' |
   +------------+-------------------------------+--------+---------+--------------+
   | Version    | Protocol version              | string |         | '2010-05-08' |
   +------------+-------------------------------+--------+---------+--------------+
   | PathPrefix | Path prefix of groups to list | string | '/'     |              |
   +------------+-------------------------------+--------+---------+--------------+
   | Marker     | Marker for pagination         | string | '0'     |              |
   +------------+-------------------------------+--------+---------+--------------+
   | MaxItems   | Max groups to return          | number | 100     |              |
   +------------+-------------------------------+--------+---------+--------------+

Refer to
http://docs.aws.amazon.com/IAM/latest/APIReference/API_ListGroups.html

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
