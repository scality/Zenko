.. _CreateRole:

CreateRole
==========

Creates a role.

Method and Path
---------------

.. code::

  POST /

Request Parameters
------------------

.. tabularcolumns:: lLlll
.. table::
   :widths: auto

   +--------------------------+-------------+-------------+-----------+---------------+
   | Name                     | Description | Type        | Default   | Value         |
   +==========================+=============+=============+===========+===============+
   | Action                   | Action to   | string      |           | 'CreateRole'  |
   |                          | execute     |             |           |               |
   +--------------------------+-------------+-------------+-----------+---------------+
   | Version                  | Protocol    | string      |           | '2010-05-08'  |
   |                          | version     |             |           |               |
   +--------------------------+-------------+-------------+-----------+---------------+
   | AssumeRolePolicyDocument | Trust       | stringified |           |               |
   |                          | policy      | json        |           |               |
   |                          | defining    |             |           |               |
   |                          | the role    |             |           |               |
   +--------------------------+-------------+-------------+-----------+---------------+
   | Path                     | Path of the | string      | '/'       |               |
   |                          | role        |             |           |               |
   +--------------------------+-------------+-------------+-----------+---------------+
   | RoleName                 | Role name   | string      |           |               |
   +--------------------------+-------------+-------------+-----------+---------------+

Refer to http://docs.aws.amazon.com/IAM/latest/APIReference/API_CreateRole.html

Success Code
------------

.. tabularcolumns:: ll
.. table::
   :widths: auto

   +------+---------+
   | Code | Message |
   +======+=========+
   | 201  | Created |
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
   | 409  | EntityAlreadyExists   |
   +------+-----------------------+
   | 500  | AccessDenied          |
   +------+-----------------------+
   | 500  | ServiceFailure        |
   +------+-----------------------+

