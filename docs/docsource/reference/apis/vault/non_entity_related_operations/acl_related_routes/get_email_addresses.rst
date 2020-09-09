.. _Get Email Addresses:

Get Email Addresses (AclEmailAddresses)
=======================================

Obtains a list of account email addresses corresponding to the provided
list of account canonicalIDs. Error strings will be included in the
returned list for those invalid or non-existent email addresses in the
input.

Method and Path
---------------

.. code::

  GET /

Request Parameters
------------------

.. tabularcolumns:: lLlll
.. table::
   :widths: auto

   +-------------+-------------+-------------+-------------+--------------------+
   | Name        | Description | Type        | Default     | Value              |
   +=============+=============+=============+=============+====================+
   | Action      | Action to   | string      |             | 'AclEmailAddresses'|
   |             | execute     |             |             |                    |
   +-------------+-------------+-------------+-------------+--------------------+
   | canonicalIds| Canonical   | Array of    |             |                    |
   |             | id of       | string      |             |                    |
   |             | accounts    |             |             |                    |
   +-------------+-------------+-------------+-------------+--------------------+

Output Format
-------------

.. code::

   Response upon success: {
       <canonicalId>: <emailAddress> | 'WrongFormat' | 'NotFound',
       ...
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

