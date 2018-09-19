Adding a Storage Location
=========================

Clicking the **Storage Locations** item in the navigation pane opens the
Storage Locations dialog:

|image0|

#. To add a storage location, click **Add New Storage Location**.
#. The **Add New Storage Location** dialog displays: 

   |image1|  

#.

   a. Enter a location name in the **Location Name** field using
      lowercase letters, numbers, and dashes.

      .. note::

       Capital letters, spaces, and punctuation and diacritical
       marks will result in an error message.

   b. Select a location type from the **Location Type** pull-down menu.
      You can choose Amazon S3, DigitalOcean Spaces, Google Cloud
      Storage, Microsoft Azure Blob Storage, Scality RING with S3
      Connector, Scality RING with sproxyd Connector, Wasabi, or a Zenko
      Instance Local Filesystem.

#. Each storage location type has its own requirements. No security is
   required for a local file system, but all clouds require
   authentication information.

  .. note::

    For release GA 1.0, Zenko has been capped at 1024 objects. Upward revision of
    this cap is planned for subsequent product revisions.

`Go back`_

.. _`Go back`: Location_Management.html

.. |image0| image:: ../../Resources/Images/Orbit_Screencaps/Orbit_Storage_Locations.png
.. |image1| image:: ../../Resources/Images/Orbit_Screencaps/Orbit_Add_New_Storage_Location.png
   :class: FiftyPercent
