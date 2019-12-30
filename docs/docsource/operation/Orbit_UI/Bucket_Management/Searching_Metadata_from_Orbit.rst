.. _Searching Metadata from Orbit:

Searching Metadata from Orbit
=============================

Every file stored in an object storage system is associated with a set
of metadata. Understanding the metadata tags associated with these files
provides a powerful method for extremely fast search and retrieval of
files.

Orbit provides a graphical tool for performing metadata searches, the
syntax for which is hinted under the search bar itself, but also
described explicitly in :ref:`Searching Metadata with Zenko`.

To search the metadata of files stored in clouds managed by Zenko,

#. Click **Search** in the sidebar to raise the **Multicloud Search** window.

   |image0|

#. Pick a bucket to search.

   |image1|

#. Enter metadata search terms in the modified NoSQL format described in
   :ref:`Searching Metadata with Zenko`. Click the magnifying glass icon.

   .. image::  ../../Resources/Images/Orbit_Screencaps/metadata_search_results.png

   Orbit returns the search results.

   Clicking the arrow icon next to the search result takes you to the
   item’s location (directory) in the bucket.

.. |image0| image:: ../../Resources/Images/Orbit_Screencaps/Orbit_multicloud_search.png
   :class: OneHundredPercent
.. |image1| image:: ../../Resources/Images/Orbit_Screencaps/Orbit_multicloud_search_bucket_select.png
   :class: FiftyPercent
