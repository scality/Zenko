.. _Searching Metadata from |product|:

Searching Metadata from |product|
=================================

Every object stored in an object storage system is associated with metadata. 
Understanding the metadata tags associated with these objects
provides a powerful method for rapid object search and retrieval.

The |product| UI provides a graphical tool for performing metadata searches, the
syntax for which is hinted under the search bar itself, but also
described explicitly in :ref:`Searching Metadata with |product|`.

To search the metadata of objects stored in clouds managed by |product|,

#. Click the **Data Browser** tab.

   .. image:: ../../../graphics/xdm_ui_data_browser.png
      :width: 100 %

#. Select an account from the **Account Name** column.

   .. image:: ../../../graphics/xdm_ui_data_browser_account_select.png   
      :width: 75 %

#. Select a bucket to search. Either pick one directly from the **Bucket Name**
   column or narrow your options using the filter field.

   .. image:: ../../../graphics/xdm_ui_bucket_select.png
      :width: 75 %

#. Enter metadata search terms in the modified NoSQL format described in
   :ref:`Searching Metadata with |product|`. Suggested search terms appear in
   this field. Click **Search**.

   .. image::  ../../../graphics/xdm_ui_metadata_search_entry.png
      :width: 50 %

#. The |product| UI returns the search results.

   .. image::  ../../../graphics/xdm_ui_metadata_search_results.png
      :width: 75 %

   You have full object-level control (delete, inspect, download) of the
   returned results. See :ref:`Object Operations` for more.
      
