.. _Delete Account Quota:

Delete Account Quota
====================

Disables an account's quota.

Method and Path
---------------

``POST /``

Request Parameters
------------------

.. tabularcolumns:: lllll
.. table::
   :widths: auto

   +--------------+-----------------------+--------+---------+--------------------+
   | Name         | Description           | Type   | Default | Value              |
   +==============+=======================+========+=========+====================+
   | Action       | Action to execute     | string |         | DeleteAccountQuota |
   +--------------+-----------------------+--------+---------+--------------------+
   | Version      | Protocol version      | string |         | 2010-05-08         |
   +--------------+-----------------------+--------+---------+--------------------+
   | AccountName  | Name of the account   | string |         |                    |
   +--------------+-----------------------+--------+---------+--------------------+

