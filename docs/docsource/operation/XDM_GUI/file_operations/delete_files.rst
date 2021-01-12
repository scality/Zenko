.. _Delete Files:

Delete Files
============

**Prerequisites:** An account with at least one bucket, containing at least one
file.

To delete files from a bucket:

#. Click the **Data Browser** tab to open the bucket view.

   .. image:: ../../Graphics/xdm_ui_data_browser.png
      :width: 100%

#. Select an account from the account pull-down menu.

   .. image:: ../../Graphics/xdm_ui_data_browser_account_select.png
      :width: 75%

#. Click the link of the bucket you will delete from. 

   .. image:: ../../Graphics/xdm_ui_bucket_select.png
      :width: 75%

#. The bucket's contents are displayed.

   .. image:: ../../Graphics/xdm_ui_bucket_contents.png
      :width: 75%

#. Check the boxes next to the file or files you want to delete. To select all,
   click the box next to **Name** above the file list.

   .. image:: ../../Graphics/xdm_ui_file_delete_select.png
      :width: 75%

   The red **Delete** button brightens and becomes functional.	      

#. |product| requests confirmation of the deletion.

   .. image:: ../../Graphics/xdm_ui_file_delete_confirm.png
      :width: 50%

#. The file is deleted from the bucket.

.. _Delete Versioned Files:

Delete Versioned Files
----------------------

To delete a bucket, it must be completely empty. In a non-versioned bucket this
task is straightforward, but for versioned buckets it can be difficult, because
previous versions of the files may remain in the bucket. Follow this procedure
to delete all versions of a file.

**Prerequisites:** An account with at least one bucket, created with versioning
enabled, containing at least one file.

To delete a versioned file:

#. Follow the steps in :ref:`Delete Files`. When you reach the bucket view,
   slide the **List Versions** toggle.

   .. image:: ../../Graphics/xdm_ui_file_delete_versioned.png
      :width: 75%

   Files that existed before the current version show multiple versions.
   Versioned files that were deleted conventionally in :ref:`Delete Files`
   show that only the most recent version of the file has been deleted.

   .. tip::

      If you have deleted a file in error, you can still retrieve a previous
      version from this view.

#. Select all versions of the file or files you want to delete, and click
   **Delete**.

   .. image:: ../../Graphics/xdm_ui_file_delete_versioned_selected.png
      :width: 75%

#. Confirm the deletion.

   .. image:: ../../Graphics/xdm_ui_file_delete_versioned_confirm.png
      :width: 50%

   All selected versions are deleted. 	      
   
