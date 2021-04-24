.. _View Object Versions:

View Object Version Information
===============================

Objects can be stored in buckets with versioning enabled. With versioning
enabled, you can view and retrieve previous versions of stored objects.

To view a bucket's versioning status:

#. Click the **Data Browser** tab to open the Data Browser view.

   .. image:: ../../Graphics/xdm_ui_data_browser.png
      :width: 75%

#. Select a bucket by clicking its row. The bucket's versioning status is
   displayed in the **Overview** pane. Possible **Versioning** values are
   **Enabled**, **Disabled**, and **Suspended**.

   .. image:: ../../Graphics/xdm_ui_bucket_overview.png

To view the version status of the objects in a versioned bucket:

#. Click the name of the bucket, raising the bucket view.

   .. image:: ../../Graphics/xdm_ui_bucket_contents.png

#. To review version information for objects in a versioned bucket, slide the
   **List Versions** toggle to the right.

   .. image:: ../../Graphics/xdm_ui_list_versions_toggle.png
      :width: 15%

   .. note::

      For non-versioned buckets, this toggle is inoperative. 

#. The objects' version information appears in the **Version ID** column. Older
   versions appear in gray text. The latest version appears in white text.

   .. image:: ../../Graphics/xdm_ui_object_info_versioned.png
      :width: 75%

