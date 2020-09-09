.. _Get canonicalIds:

Get canonicalIds (AclCanonicalIds)
==================================

Obtains a list of account canonicalIds corresponding to the provided
list of account email addresses. Error strings will be included in the
returned list for those invalid or non-existent canonicalIds in the
input.

Method and Path
---------------

.. code::

  GET /

Request Parameters
------------------

Action = AclCanonicalIds

.. tabularcolumns:: lLlll
.. table::
   :widths: auto

   +---------------+-------------+-------------+-------------+------------------+
   | Name          | Description | Type        | Default     | Value            |
   +===============+=============+=============+=============+==================+
   | Action        | Action to   | string      |             | 'AclCanonicalIds'|
   |               | execute     |             |             |                  |
   +---------------+-------------+-------------+-------------+------------------+
   | emailAddresses| Email       | Array of    |             |                  |
   |               | addresses   | string      |             |                  |
   |               | of accounts |             |             |                  |
   +---------------+-------------+-------------+-------------+------------------+

Output Format
-------------

.. code::

   Response upon success: {
       <emailAddress>: <canonicalId> | 'WrongFormat' | 'NotFound',
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

