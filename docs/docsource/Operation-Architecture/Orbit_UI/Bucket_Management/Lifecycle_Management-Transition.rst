Object Lifecycle Management: Transition
=======================================

**Prerequisite:** You must have established a bucket with at least one object
in it to transition data from, and another bucket to send transitioned data to.

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

   You may name a directory or subdirectory to which the rule applies. Enter
   a time span after the object's current version was last changed and specify
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
