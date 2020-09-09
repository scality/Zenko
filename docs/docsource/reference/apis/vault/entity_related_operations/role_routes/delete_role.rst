.. _DeleteRole:

DeleteRole
==========

Deletes a role

Method and Path
---------------

.. code::

  POST /

Request Parameters
------------------

.. tabularcolumns:: lllll
.. table::
   :widths: auto

   +----------+-------------------+--------+---------+--------------+
   | Name     | Description       | Type   | Default | Value        |
   +==========+===================+========+=========+==============+
   | Action   | Action to execute | string |         | 'DeleteRole' |
   +----------+-------------------+--------+---------+--------------+
   | Version  | Protocol version  | string |         | '2010-05-08' |
   +----------+-------------------+--------+---------+--------------+
   | RoleName | Name of the role  | string |         |              |
   +----------+-------------------+--------+---------+--------------+

Refer to
http://docs.aws.amazon.com/IAM/latest/APIReference/API_DeleteRole.html

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

   +------+-----------------------+
   | Code | Message               |
   +======+=======================+
   | 400  | InvalidParameterValue |
   +------+-----------------------+
   | 409  | DeleteConflict        |
   +------+-----------------------+
   | 404  | NoSuchEntity          |
   +------+-----------------------+
   | 500  | AccessDenied          |
   +------+-----------------------+
   | 500  | ServiceFailure        |
   +------+-----------------------+
