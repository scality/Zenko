.. _create_a_bucket:

Create a Bucket
===============

To create a bucket:

#. Click **Browser** in the sidebar to open the **Multicloud Browser**:

   |image0|

   Click the **Create Bucket** button.

#. The **Create Bucket** dialog displays:

   |image1|

   Enter the bucket name and location constraint, and click the
   **Create** button.

#. The bucket appears in the **Buckets** list:

   |image2|

#. For buckets associated with AWS S3 or Scality RING endpoints, click
   **View Info**. Bucket information displays:

   |image3|

   Toggle **Versioning** ON.

   |image4|

   .. important:: You *must* turn versioning on for cloud-hosted buckets before
      assigning them a location. Assigning a bucket to a location with
      versioning off will result in errors.

.. |image0| image:: ../../Resources/Images/Orbit_Screencaps/Orbit_bucket_create_multicloud_browser.png
.. |image1| image:: ../../Resources/Images/Orbit_Screencaps/Orbit_bucket_create_dialog.png
.. |image2| image:: ../../Resources/Images/Orbit_Screencaps/Orbit_bucket_create_multicloud_success.png
.. |image3| image:: ../../Resources/Images/Orbit_Screencaps/Orbit_View_Bucket_Info.png
   :class: FiftyPercent
.. |image4| image:: ../../Resources/Images/Orbit_Screencaps/Orbit_Versioning_ON.png
   :class: FiftyPercent