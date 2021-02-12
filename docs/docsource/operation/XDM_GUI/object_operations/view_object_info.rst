.. _View Object Info:

View Object Information, Metadata, and Tags
===========================================

An object consists of a file and its attendant metadata. Some of this metadata,
such as date stamps, cannot be edited. Other types of metadata can be edited and
can be customized. This section describes viewing object information (immutable
metadata), and viewing and editing metadata and tags. 

To view information about an object:

#. Click the **Data Browser** tab to open the Data Browser view.

   .. image:: ../../Graphics/xdm_ui_data_browser.png
      :width: 75%	      

#. Select a bucket by clicking its name.

   .. image:: ../../Graphics/xdm_ui_bucket_select.png
      :width: 75%

#. Select the object by clicking in its row.

   .. image:: ../../Graphics/xdm_ui_object_select.png
      :width: 75%

   .. note::

      Clicking the object name downloads the object.

#. Summary data about the object is displayed in the right column.

   .. image:: ../../Graphics/xdm_ui_object_info_summary.png
      :width: 75%

#. To review or change the object's metadata, click the **Metadata** tab.

   .. image:: ../../Graphics/xdm_ui_object_info_metadata.png
      :width: 75%

   Available metadata options are **cache-control**, **content disposition**,
   **content-encoding**, **content-type**, **website-redirect-location**, and
   **x-amz-meta**. Most of these are HTTP header field definitions, documented
   at https://www.w3.org/Protocols/rfc2616/rfc2616-sec14.html and
   https://www.w3.org/Protocols/rfc2616/rfc2616-sec19.html). The x-amz-meta tag
   acts as a wrapper that indicates that the subsequent information is specific
   to the Amazon S3 protocol. When you pick this, an extra field displays to
   permit entry of this “nested” key information.

   This name space must conform to `Amazon’s bucket naming rules
   <https://docs.aws.amazon.com/AmazonS3/latest/dev/BucketRestrictions.html#bucketnamingrules>`__:
   numbers, hyphens, and upper- and lower-case letters only.

#. To review or edit the object's custom tags, click the **Tags** tab.

   .. image:: ../../Graphics/xdm_ui_object_info_tags.png
      :width: 75%

   These are S3-supported tags (see
   https://docs.aws.amazon.com/AmazonS3/latest/dev/object-tagging.html).
   Because other backends may not support the S3 tagging structure,
   operations that use these tags must be performed using |product|.

