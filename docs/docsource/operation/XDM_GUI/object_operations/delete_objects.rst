.. _Delete Objects:

Delete Objects
==============

**Prerequisites:** An account with at least one bucket, containing at least one
object.

To delete objects from a bucket:

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

#. Check the boxes next to the object or objects you want to delete. To select all,
   click the box next to **Name** above the object list.

   .. image:: ../../Graphics/xdm_ui_object_delete_select.png
      :width: 75%

   The red **Delete** button brightens and becomes functional.	      

#. |product| requests confirmation of the deletion.

   .. image:: ../../Graphics/xdm_ui_object_delete_confirm.png
      :width: 50%

#. The object is deleted from the bucket.

.. _Delete Versioned Objects:

Delete Versioned Objects
------------------------

To delete a bucket, it must be completely empty. In a non-versioned bucket this
task is straightforward, but for versioned buckets it can be difficult, because
previous versions of the objects may remain in the bucket. Follow this procedure
to delete all versions of an object.

**Prerequisites:** An account with at least one bucket, created with versioning
enabled, containing at least one object.

To delete a versioned object:

#. Follow the steps in :ref:`Delete Objects`. When you reach the bucket view,
   slide the **List Versions** toggle.

   .. image:: ../../Graphics/xdm_ui_object_delete_versioned.png
      :width: 75%

   Objects that existed before the current version show multiple versions.
   Versioned objects that were deleted conventionally in :ref:`Delete Objects`
   show that only the most recent version of the object has been deleted.

   .. tip::

      If you have deleted an object in error, you can still retrieve a previous
      version from this view.

#. Select all versions of the object or objects you want to delete, and click
   **Delete**.

   .. image:: ../../Graphics/xdm_ui_object_delete_versioned_selected.png
      :width: 75%

#. Confirm the deletion.

   .. image:: ../../Graphics/xdm_ui_object_delete_versioned_confirm.png
      :width: 50%

   All selected versions are deleted. 	      
   
