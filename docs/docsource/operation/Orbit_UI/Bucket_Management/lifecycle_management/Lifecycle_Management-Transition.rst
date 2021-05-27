Object Lifecycle Management: Transition
=======================================

Object lifecycle transition policies enable you to change the location of an
object or object type based on its age.

Establishing a Lifecycle Transition Policy
------------------------------------------

**Prerequisite:** You must have established a bucket to transition data from,
and a location to send transitioned data to.

To establish a lifecycle transition rule:

#. Click the **Bucket Lifecycle** tab in the sidebar.

   .. image:: ../../../Graphics/Orbit_lifecycle_select.png
      :scale: 75%

#. The **Bucket Lifecycle** screen displays.

   .. image:: ../../../Graphics/Orbit_lifecycle_bucket_select.png

#. Choose a bucket and pick **Add New Rule > Transition**

   .. image:: ../../../Graphics/Orbit_lifecycle_add_new_rule.png
      :scale: 100 %

#. The **Add New Transition Rule** dialog displays:

   .. image:: ../../../Graphics/Orbit_lifecycle_add_transition_rule.png
      :width: 75 %

   You may specify an prefix to identify objects to which the rule applies. Enter
   a time span after the object's current version was last modified and specify
   a location to which it shall be moved. You can also add a comment about the
   transition rule.

   Click **Save**.

#. The new rule is displayed:

   .. image:: ../../../Graphics/Orbit_lifecycle_transition_rule_success.png
      :width: 75%

   Zenko will enforce these rules on this bucket. If replication is configured, 
   any change of state to objects in this bucket can be replicated to buckets 
   on other clouds.
