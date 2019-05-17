Object Lifecycle Management: Transition
=======================================

Object lifecycle transition policies enable you to change the location of an
object or object type based on its age.

Transition policies do not fully transition non-versioned sources. For such 
sources, the object is copied to the destination, but it is not removed from 
the source. For example, if a user sets a policy to transition an object from
Azure (source) to AWS S3, the object is copied from Azure to AWS S3, but not
removed from Azure.

This affects Azure, and--if the source is non-versioned--AWS S3, GCP, and 
S3C-RING. RING with sproxyd is supported, whether the Zenko bucket is 
versioned or not.

Establishing a Lifecycle Transition Policy
------------------------------------------

**Prerequisite:** You must have established a bucket to transition data from,
and a location to send transitioned data to.

To establish a lifecycle transition rule:

#. From anywhere in Orbit, click the **WORKFLOWS > Bucket
   Lifecycle** tab in the left navbar.

   .. image:: ../../Resources/Images/Orbit_Screencaps/Orbit_lifecycle_select.png
      :scale: 80%

#. The **Bucket Lifecycle** screen displays.

   |image1|

#. Choose a bucket and pick **Add New Rule > Transition**

   .. image:: ../../Resources/Images/Orbit_Screencaps/Orbit_lifecycle_add_new_rule.png
      :scale: 75 %
      :align: center

#. The **Add New Transition Rule** dialog displays:

   .. image:: ../../Resources/Images/Orbit_Screencaps/Orbit_lifecycle_add_transition_rule.png
      :scale: 75 %
      :align: center

   You may specify an prefix to identify objects to which the rule applies. Enter
   a time span after the object's current version was last modified and specify
   a location to which it shall be moved. You can also add a comment about the
   transition rule.

   Click **Save**.

#. The new rule is displayed:

   .. image:: ../../Resources/Images/Orbit_Screencaps/Orbit_lifecycle_transition_rule_success.png
      :align: center

   Zenko will enforce these rules on this bucket. If replication is configured, 
   any change of state to objects in this bucket can be replicated to buckets 
   on other clouds.

.. |image1| image:: ../../Resources/Images/Orbit_Screencaps/Orbit_lifecycle_bucket_select.png
