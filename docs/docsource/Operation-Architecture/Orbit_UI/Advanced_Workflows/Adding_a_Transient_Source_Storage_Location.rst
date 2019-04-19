.. _transient-source:

Adding a Transient Source Storage Location
==========================================

Adding a transient source storage location is quite similar to adding
any other storage location, but for a few particulars.

A transient source location is a temporary buffer to which data is
stored and from which data is replicated. Scality RING with sproxyd is
the only production-ready environment that supports transient source
replication feature (the Zenko Local environment also supports this
feature, but is suitable for testing purposes only). Data written to
the transient source location can be replicated to any cloud service
Zenko supports.

To deploy a transient source storage location:

#. Open Orbit to a registered Zenko instance:

   |image0|

#. Click **Add New Storage Location**.

#. Enter the **Location Name** and from the **Location Type** drop-down
   list, select **Scality RING with Sproxyd Connector**.

   .. image:: ../../Resources/Images/Orbit_Screencaps/Add_New_Storage_Location_RING_sproxyd.png
      :width: 50%
      :align: center


#. Enter the Location Details (Bootstrap List, Proxy Path, and
   Replication Factor for Small Objects). Click **Advanced Options**,
   raising the Advanced Options pane.

   .. image:: ../../Resources/Images/Orbit_Screencaps/Add_New_Storage_Location_RING_advanced_options.png
      :width: 50%
      :align: center

#. To create a transient source, check the **Delete objects after
   successful replication** option. You can also set the **Limit total
   size in this location to** parameter to a reasonable size that
   conforms to the anticipated size of files, peak demand, and
   estimated throughput of the slowest cloud to which you intend to
   replicate data.

#. Click **Save**. The transient source location is established.

#. Go to `Setting Up Replication`_, setting
   the transient source as the source bucket.

Do not update metadata in a transient source object. Changing metadata
of an object in a transient source bucket will fail. You cannot change
metadata in the S3 protocol.

`Go back to Location Management`_

`Go back to Advanced Workflows`_

.. _`Go back to Location Management`: ../Location_Management/Location_Management.html
.. _`Go back to Advanced Workflows`: Advanced_Workflows.html
.. _`Setting Up Replication`: Setting_Up_CRR.html

.. |image0| image:: ../../Resources/Images/Orbit_Screencaps/Orbit_Storage_Locations.png
   :class: OneHundredPercent
