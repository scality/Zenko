.. _get_canonical_id_by_account_id:

Get canonicalIds Using accountIds (AccountsCanonicalIds)
========================================================

Obtains a list of account canonicalIds corresponding to the provided
list of account ids. An error will be returned in case of invalid
account id

Method and Path
---------------

.. code::

  GET /

Request Parameters
------------------

.. tabularcolumns:: lllll
.. table::
   :widths: auto

   +------------+-------------------+-----------------+---------+------------------------+
   | Name       | Description       | Type            | Default | Value                  |
   +============+===================+=================+=========+========================+
   | Action     | Action to execute | string          |         | 'AccountsCanonicalIds' |
   +------------+-------------------+-----------------+---------+------------------------+
   | accountIds | Account ids       | Array of string |         |                        |
   +------------+-------------------+-----------------+---------+------------------------+

Output Format
-------------

.. code::

   Response upon success: [
       {
           accountId, // id of the account
           canonicalId, // canonical id of the account
           name, // Name of the account
       },
       ...
   ]

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
   | 404  | NoSuchEntity   |
   +------+----------------+
   | 500  | ServiceFailure |
   +------+----------------+
