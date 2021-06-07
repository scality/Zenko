File Operations
===============

**Prerequisites:** You must have at least one account, containing at
least one bucket.

For each file stored in a Zenko bucket, you can view info, manipulate
tags and metadata, download the file to your local machine, or delete
the file from the bucket.

To access these operations:

#. Click **Browser** in the sidebar to open the Multicloud Browser.

   .. image:: ../../Graphics/sidebar_browser_button.png
      :width: 50%

#. Double-click the bucket you want to access.

   .. image:: ../../Graphics/multicloud_browser_1_bucket.png
      :width: 100%

   -  If the bucket is empty, Zenko asks you to **Drag and Drop
      Objects**:

      .. image:: ../../Graphics/Orbit_upload_objects.png
         :width: 100%

      Clicking the **Upload Objects** button takes you to your local machine’s
      file system to pick files to upload. Clicking **skip** takes you to the
      empty bucket.

   -  Otherwise, the Multicloud Browser displays the bucket’s contents:

      .. image:: ../../Graphics/Orbit_file_operations.png
         :width: 100%

For each uploaded file, you can :ref:`Download<Download a File>`, :ref:`View Info<View
File Info>`, or :ref:`Delete<deleting-objects>`.

.. toctree::
   :maxdepth: 1

    Upload Files <upload_files_to_buckets>
    View Files <view_file_info>
    Download Files <download_a_file>
    Delete Files <delete_files>
