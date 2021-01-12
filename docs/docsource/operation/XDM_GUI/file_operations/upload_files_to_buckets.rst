Uploading Files to Buckets
==========================

**Prerequisites:** Before uploading data to a bucket, you must have a storage
account associated with a user, and you must have created at least one bucket.

#. Click the **Data Browser** tab to open the bucket view.

   .. image:: ../../Graphics/xdm_ui_data_browser.png

#. Select an account from the account pull-down menu.

   .. image:: ../../Graphics/xdm_ui_account_selected.png

#. Click the link of the bucket you will upload data to. 

   .. image:: ../../Graphics/xdm_ui_bucket_select.png
      :width: 75% 

#. The bucket's contents (if any) are displayed.

   .. image:: ../../Graphics/xdm_ui_bucket_contents.png
      :width: 50%	      

#. Click **Upload** to raise the **Upload** window.
  
   .. image:: ../../Graphics/xdm_ui_file_upload.png
      :width: 50%	

#. You can upload files either by dragging and dropping from the local desktop
   (Windows Explorer, OS X, Linux desktop, for example) or by clicking the
   **Add Files** button and selecting files for upload using your local
   operating system's file manager.

   .. note::

      Browsers may limit the ability to upload directories. Uploading a
      directory may require that you recursively zip the directory and upload it
      as a single file, or access |product| through a cloud storage browser such as
      Cyberduck.

   .. note::

      Object key name lengths are limited to 915 single-byte characters (109
      fewer than the 1024 one-byte characters permitted in the AWS
      specification).

   For multiple files, continue dragging and dropping or click **Add more files**.

#. When you've added all files to upload into the upload window, click
   **Upload**. Selected files are uploaded to the bucket. 
