.. _Delete a Bucket:

Delete a Bucket
===============

**Prerequisite:** The bucket must be empty.

   .. note::

      If the bucket has versioning enabled, and if it contains any versioned
      objects, you will have to run scripts to empty the bucket of all
      objects. See :ref:`Deleting Versioned Objects`.

To delete a bucket:

#. Click **Browser** in the sidebar to open the **Multicloud Browser**:

   .. image:: ../../Graphics/Orbit_bucket_create_multicloud_browser.png

#. Pick the bucket to delete from the **Buckets** list:

   .. image:: ../../Graphics/multicloud_browser_select_bucket.png
      :width: 100%

#. Click the **Delete** button.

   .. image:: ../../Graphics/delete_button.png
      :width: 50%

#. Orbit requests confirmation:

   .. image:: ../../Graphics/bucket_delete_verify.png
      :width: 75%
	      
#. If you are sure, click **Delete**

   .. image:: ../../Graphics/bucket_delete_verify_selected.png
      :width: 75%

#. The Multicloud Browser refreshes, and the bucket is deleted.
