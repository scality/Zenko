.. _Update Account Quota:

Update Account Quota
====================

Updates the quota of an account.

Method and Path
---------------

``POST /``

Request Parameters
------------------

.. tabularcolumns:: lLlll
.. table::
   :widths: auto

   +--------------+-----------------------+--------+---------+--------------------+
   | Name         | Description           | Type   | Default | Value              |
   +==============+=======================+========+=========+====================+
   | Action       | Action to execute     | string |         | UpdateAccountQuota |
   +--------------+-----------------------+--------+---------+--------------------+
   | Version      | Protocol version      | string |         | 2010-05-08         |
   +--------------+-----------------------+--------+---------+--------------------+
   | AccountName  | Name of the account   | string |         |                    |
   +--------------+-----------------------+--------+---------+--------------------+
   | quotaMax     | Maximum amount of     | number |         |                    |
   |              | bytes storable by the |        |         |                    |
   |              | Account (quota)       |        |         |                    |
   +--------------+-----------------------+--------+---------+--------------------+
