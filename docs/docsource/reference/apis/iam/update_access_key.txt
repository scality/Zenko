.. _UpdateAccessKey:

UpdateAccessKey
===============

Changes the status of the specified access key from Active to Inactive, or vice versa. 

Method and Path
---------------

.. code::

  POST /

Request Parameters
------------------

.. tabularcolumns:: lllll
.. table::
   :widths: auto

   +-------------+-------------------+-------------+---------+---------------------+
   | Name        | Description       | Type        | Default | Value               |
   +=============+===================+=============+=========+=====================+
   | Action      | Action to execute | string      |         | ``UpdateAccessKey`` |
   +-------------+-------------------+-------------+---------+---------------------+
   | Version     | Protocol version  | string      |         | ``2010-05-08``      |
   +-------------+-------------------+-------------+---------+---------------------+
   | AccessKeyId | The access key ID | string (16  |         |                     |
   |             | of the secret     | to 128      |         |                     |
   |             | access key to be  | characters) |         |                     |
   |             | updated.          |             |         |                     |
   +-------------+-------------------+-------------+---------+---------------------+
   | Status      | Status (Active/   | string      |         | ``Active`` \|       |
   |             | Inactive) to      |             |         | ``Inactive``        |  
   |             | assign to the     |             |         |                     |
   |             | key.              |             |         |                     |
   +-------------+-------------------+-------------+---------+---------------------+
   | UserName    | Name of user      | string (1   | ''      |                     |
   |             |                   | to 128      |         |                     |
   |             |                   | characters) |         |                     |
   +-------------+-------------------+-------------+---------+---------------------+

Refer to
http://docs.aws.amazon.com/IAM/latest/APIReference/API_CreateAccessKey.html

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

   +------+--------------------+
   | Code | Message            |
   +======+====================+
   | 409  | LimitExceeded      |
   +------+--------------------+
   | 404  | NoSuchEntity       |
   +------+--------------------+
   | 500  | ServiceFailure     |
   +------+--------------------+

