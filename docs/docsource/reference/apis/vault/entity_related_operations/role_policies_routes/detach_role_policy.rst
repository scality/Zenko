.. _DetachRolePolicy:

DetachRolePolicy
================

Detaches a managed policy from a role.

Method and Path
---------------

.. code::

  POST /

Request Parameters
------------------

.. tabularcolumns:: lllll
.. table::
   :widths: auto

   +-----------+---------------------------+--------+---------+--------------------+
   | Name      | Description               | Type   | Default | Value              |
   +===========+===========================+========+=========+====================+
   | Action    | Action to execute         | string |         | 'DetachRolePolicy' |
   +-----------+---------------------------+--------+---------+--------------------+
   | Version   | Protocol version          | string |         | '2010-05-08'       |
   +-----------+---------------------------+--------+---------+--------------------+
   | PolicyArn | ARN of the managed policy | string |         |                    |
   +-----------+---------------------------+--------+---------+--------------------+
   | RoleName  | Name of the role          | string |         |                    |
   +-----------+---------------------------+--------+---------+--------------------+

Refer to
http://docs.aws.amazon.com/IAM/latest/APIReference/API_DetachRolePolicy.html

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
   | 404  | NoSuchEntity          |
   +------+-----------------------+
   | 500  | AccessDenied          |
   +------+-----------------------+
   | 500  | ServiceFailure        |
   +------+-----------------------+
