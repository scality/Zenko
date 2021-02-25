Inspect a Bucket
================

|product| offers the ability to view bucket details, and to toggle versioning.

**Prerequisite:** To inspect a bucket, you must already have created at least
one bucket.

To inspect a bucket: 

#. Click the **Data Browser** tab to change to the data browser view..

   .. image:: ../../Graphics/xdm_ui_data_browser.png

#. Select an account from the pull-down menu.

   .. image:: ../../Graphics/xdm_ui_data_browser_account_select.png

#. Select a bucket from the bucket list.

   .. image:: ../../Graphics/xdm_ui_bucket_select.png

#. The **Overview** tab displays bucket information.

   .. image:: ../../Graphics/xdm_ui_bucket_overview.png

   From this panel, you can:

   -  :ref:`Delete the bucket<Delete a Bucket>`
   -  Toggle the **Versioning** feature
   -  Review the location and bucket type
   -  Review the bucket's permissions, consisting of its:
      - Owner
      - Access Control List (ACL)
      - CORS configuration status (yes or no)
      - Whether the bucket is visible to the public (yes or no)

   For more information on versioning, review the `Amazon S3 documentation
   <https://docs.aws.amazon.com/AmazonS3/latest/dev/Versioning.html>`__.
   |product| implements S3 logic for versioning.
