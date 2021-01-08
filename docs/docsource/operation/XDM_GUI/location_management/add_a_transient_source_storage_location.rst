.. _Add a Transient Source Storage Location:

Add a Transient Source Storage Location
=======================================

A transient source location is a temporary buffer to which data is stored and
from which data is replicated. Scality RING with sproxyd is the only
production-ready environment that supports the transient source replication
feature (the Zenko Local environment also supports this feature, but is suitable
for testing purposes only). Data written to the transient source location can be
replicated to any cloud service Zenko supports.

Adding a transient source storage location is quite similar to adding any other
storage location.

To deploy a transient source storage location:

#. Follow the instructions in :ref:`Add a Storage Location`, selecting an
   account name, clicking the **Locations** tab, and clicking **Create
   Location** to raise the **ADD NEW STORAGE LOCATION** window.

   .. image:: ../../Graphics/xdm_ui_add_new_storage_location.png

#. The **Add New Storage Location** modal appears. Enter the **Location Name**
   (AWS S3 naming rules apply: lowercase alphanumerics and hyphens only) and
   select **Scality RING with Sproxyd Connector** from the **Location Type**
   drop-down list,

   .. image:: ../../Graphics/xdm_ui_add_storage_location_sproxyd.png

#. Enter up to six **Bootstrap List** parameters (or accept the default value),
   **Proxy Path**, and **Replication Factor for Small Objects**, if any. Under
   **Advanced Options**, click **Delete objects after successful replication**.
 
   .. image:: ../../Graphics/xdm_ui_add_sproxyd_selected.png

   You can also set the **Limit total size in this location to** parameter to a
   reasonable size that conforms to the anticipated size of files, peak demand,
   and estimated throughput of the slowest cloud to which you intend to
   replicate data.

#. Click **Create**. The transient source location is established.

#. Follow the instructions in :ref:`Set Up Replication` to set the transient
   source as the source bucket.

   .. warning::

      Do not update metadata in a transient source object. Changing metadata of
      an object in a transient source bucket will fail. You cannot change
      metadata in the S3 protocol.


