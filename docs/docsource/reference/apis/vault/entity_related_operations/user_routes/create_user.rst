.. _Create User:

Create User
===========

Creates a new user.

Method and Path
---------------

.. code::

  POST /

Request Parameters
------------------

.. tabularcolumns:: lllll
.. table::
   :widths: auto

   +----------+----------------------+--------+---------+--------------+
   | Name     | Description          | Type   | Default | Value        |
   +==========+======================+========+=========+==============+
   | Action   | Action to execute    | string |         | 'CreateUser' |
   +----------+----------------------+--------+---------+--------------+
   | Version  | Protocol version     | string |         | '2010-05-08' |
   +----------+----------------------+--------+---------+--------------+
   | UserName | Name of user         | string |         |              |
   +----------+----------------------+--------+---------+--------------+
   | Path     | Custom path for user | string | '/'     |              |
   +----------+----------------------+--------+---------+--------------+

Refer to http://docs.aws.amazon.com/IAM/latest/APIReference/API_CreateUser.html

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

   +------+------------------------+
   | Code | Message                |
   +======+========================+
   | 400  | WrongFormat            |
   +------+------------------------+
   | 400  | InvalidParameterValue  |
   +------+------------------------+
   | 404  | EntityDoesNotExist     |
   +------+------------------------+
   | 409  | EntityAlreadyExists    |
   +------+------------------------+
   | 500  | ServiceFailure         |
   +------+------------------------+

