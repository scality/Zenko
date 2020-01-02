.. _Set Up Replication:

Set Up Replication
==================

**Prerequisites:** To set up bucket-level CRR using the Orbit UI, you
must have:

-  One pre-configured source bucket
-  At least one pre-configured destination bucket

To set up a replication configuration:

#. Click **Replication** in the sidebar:

   .. image:: ../../Graphics/sidebar_replication_button.png

#. Orbit raises the Replication window:

   |image0|

   If no locations are configured, Orbit displays this message:

   .. image:: ../../Graphics/replication_no_target_message.png
      :align: center

   Click the link text to create a :ref:`suitable replication target<orbit_add_location>`.

#. Click **New**. The **Set up bucket replication** dialog displays.

   .. image:: ../../Graphics/Orbit_set_up_bucket_replication.png
      :align: center

   Name the new replication configuration, and enter source and destination
   bucket information. The replication configuration name is free-form, and not
   constrained by Amazon’s naming schema. Click **Save**.

#. The named configuration and specified destination(s) display on successful
   implementation.

   |image2|

With one or more replication instances configured, the Replication window lets
you add a new replication configuration, or edit, suspend, or delete an existing
one.

Replication is not retroactive. In other words, if you have files stored in a
bucket and you configure that bucket to be replicated, replication only occurs
to files written to that bucket after you have configured and set the
replication.

.. |image0| image:: ../../Graphics/Orbit_Replication_New.png
   :class: OneHundredPercent
.. |image2| image:: ../../Graphics/Orbit_replication_success.png
   :class: OneHundredPercent
