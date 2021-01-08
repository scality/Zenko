.. _Delete a Storage Location:

Delete a Storage Location
=========================

To delete a storage location:

#. From the **Accounts** view, select an account name to expose account
   information.

   .. image:: ../../Graphics/xdm_ui_account_view.png
      :width: 100%

   .. tip::

      If there are many accounts, you can use the field marked *Filter by
      Account Name* to reduce the number of visible accounts to a manageable                                            
      level.                                                                                                            

#. Click the **Locations** tab to expose existing storage locations.

   .. image:: ../../Graphics/xdm_ui_locations_tab.png
      :width: 75%

#. Find the storage location you will delete.

   .. tip::

      If there are many locations, you can use the field marked *Filter by
      Location Name* to reduce the number of visible accounts to a manageable                                            
      level.

   Click the Delete icon.

   .. image:: ../../Graphics/xdm_ui_icon_delete.png
      :width: 10%

   .. note::

      You may not be able to delete a location (the delete icon is grayed
      out). This usually is because the location contains data. You cannot
      delete a location until all data within it is deleted. For locations
      containing versioned buckets, this includes :ref:`previous versions of
      objects in any buckets<Delete Versioned Objects>` that may not be readily
      visible. If you cannot delete a location, make sure it contains no data by
      deleting all objects and :ref:`deleting all buckets<Delete a Bucket>` in
      that location.

#. You are prompted to confirm the deletion. 

   .. image:: ../../Graphics/xdm_ui_location_delete_confirm.png
      :width: 50%
