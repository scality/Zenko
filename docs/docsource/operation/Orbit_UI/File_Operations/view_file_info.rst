.. _View File Info:

View File Info
==============

To view information about a file:

#. Click the Browser button to open the Multicloud Browser.

   .. image:: ../../Graphics/sidebar_browser_button.png

#. Double-click the bucket containing the file.

   .. image:: ../../Graphics/Orbit_multicloud_browser_with_values1.png
      :align: center

#. Select the file, and click the **View Info** button. File information
   displays in a pop-up window:

   .. image:: ../../Graphics/Orbit_file_operations_popup.png
      :align: center

#. Click the pencil icon in the **Metadata** field to add or edit
   metadata options.

   .. image:: ../../Graphics/Orbit_add-edit_metadata.png
      :align: center

   Available options are **cache-control**, **content disposition**,
   **content-encoding**, **content-language**, **content-type**, **expires**,
   **website-redirect-location**, and **x-amz-meta**. Most of these are HTTP
   header field definitions, documented at
   https://www.w3.org/Protocols/rfc2616/rfc2616-sec14.html and
   https://www.w3.org/Protocols/rfc2616/rfc2616-sec19.html). The x-amz-meta tag
   acts as a wrapper that indicates that the subsequent information is specific
   to the Amazon S3 protocol. When you pick this, an extra field displays to
   permit entry of this “nested” key information.

   .. image:: ../../Graphics/Orbit_x-amz-meta.png
      :align: center

   This name space must conform to `Amazon’s naming rules
   <https://docs.aws.amazon.com/AmazonS3/latest/dev/BucketRestrictions.html#bucketnamingrules>`__:
   numbers, hyphens, and upper- and lower-case letters only).

#. Click the pencil icon in the **Tags** field to add custom tags.

   .. image:: ../../Graphics/Orbit_add_tags.png
      :align: center

   These are S3-supported tags (see
   https://docs.aws.amazon.com/AmazonS3/latest/dev/object-tagging.html).
   Because other backends may not support the S3 tagging structure,
   operations that use these tags must be performed using Zenko.


