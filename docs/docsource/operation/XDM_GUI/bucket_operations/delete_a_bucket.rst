.. _Delete a Bucket:

Delete a Bucket
===============

**Prerequisite:** The bucket must be empty.

   .. important::

      If the bucket has versioning enabled, you must be sure to delete all
      versions of the object.

To delete a bucket:

#. Click the **Data Browser** tab and select an account using the pull-down menu
   at left.

   .. image:: ../../Graphics/xdm_ui_data_browser_account_select.png
      :width: 75%

#. Click the bucket to delete. You can use the filter tool to narrow your
   options.

   .. image:: ../../Graphics/xdm_ui_bucket_select.png
      :width: 75%

#. Click **Delete Bucket**. 	      

   .. image:: ../../Graphics/xdm_ui_bucket_delete_select.png
      :width: 50%

#. Confirm the deletion.

   .. image:: ../../Graphics/xdm_ui_bucket_delete_confirm.png
      :width: 50%

.. important::

   If the bucket is not empty, it cannot be deleted. In a bucket deployed with
   versioning enabled, it is possible to delete an object without deleting earlier
   versions of that object. Earlier versions may remain, and may make deleting the
   bucket impossible. See the instructions to :ref:`Delete Versioned Objects` to
   completely empty a versioned bucket.
