Deleting Files
==============

To delete files from a selected bucket:

#. Click the check box next to each file to be deleted. The number of
   files to be deleted is indicated in the top bar of the file list.

   |image0|

#. Click the **Delete** button.
   |image1|
#. Orbit requests confirmation of the deletion.

   |image2|

#. The file is deleted from the bucket.

   .. important::

      If versioning is enabled (the recommended configuration for
      AWS nodes) deleting from the Orbit UI deletes the most
      recent version of the object only. This results in a condition
      where the bucket appears empty, but continues to contain
      previous versions of the deleted object. This prevents the
      bucket from being deleted, because it is not empty. To completely
      delete an object and its version history requires entering
      the CLI commands described below.

`Go back`_

.. _`Go back`: File_Operations.html


.. |image0| image:: ../../Resources/Images/Orbit_Screencaps/Orbit_file_delete.png
.. |image1| image:: ../../Resources/Images/Orbit_Screencaps/Orbit_file_delete_button.png
.. |image2| image:: ../../Resources/Images/Orbit_Screencaps/Orbit_file_delete_confirm.png
