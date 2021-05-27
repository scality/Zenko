Object Lifecycle Management: Expiration
=======================================

Object lifecycle expiration policies enable you to delete an object or 
object type based on its age.

Establishing an Object Expiration Policy
----------------------------------------

**Prerequisite:** You must have established at least one bucket.

#. From anywhere in Orbit, click the **Bucket Lifecycle** tab in 
   the left navbar.

   .. image:: ../../../Graphics/Orbit_lifecycle_select.png

#. The **Bucket Lifecycle** screen displays.

   .. image:: ../../../Graphics/Orbit_lifecycle_bucket_select.png
      :width: 100%

#. Choose a bucket and pick **Add New Rule > Expiration**

   .. image:: ../../../Graphics/Orbit_lifecycle_add_new_rule.png
      :scale: 100 %

#. The **Add New Expiration Rule** dialog displays:

   .. image:: ../../../Graphics/Orbit_lifecycle_add_expiration_rule.png
      :scale: 50 %

   You may enter a distinct directory or subdirectory to which the rule applies.
   Enter an expiration time span and a deletion time span.
   These follow the bucket and enforce expiration and deletion.
   You may also add a comment about this expiration rule.

   Click **Save**.

#. The new rule is displayed:

   .. image:: ../../../Graphics/Orbit_lifecycle_expiration_rule_success.png
      :width: 100%

   Zenko will enforce these rules on this bucket. 

Versioning logic precludes simply deleting an object: that day’s object
is deleted, but earlier versions remain. See warning at 
:ref:`Deleting Objects<deleting-objects>`.
