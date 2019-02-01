Object Lifecycle Management
===========================

**Prerequisite:** You must have established at least one bucket.

#. From anywhere in Orbit, click the **WORKFLOWS > Bucket
   Lifecycle** tab in the left navbar.

   |image0|

#. The **Bucket Lifecycle** screen displays.

   |image1|

#. Choose a bucket and pick **Add New Rule**
#. The **Add New Rule** dialog appears:

   |image2|

   Enter a name for the rule. You may enter a distinct directory or
   subdirectory to which the rule applies. Enter an expiration time span
   and a deletion time span. These follow the bucket and enforce
   expiration and deletion.

   Click **Save**.

#. The new rule is displayed:

   |image3|

   Zenko will enforce these rules on this bucket. If replication is
   configured, any change of state to objects in this bucket can be
   replicated to buckets on other clouds.

Versioning logic precludes simply deleting an object: that day’s object
is deleted, but all others remain. See warning at “Deleting Files,” on
page 1.

.. |image0| image:: ../../Resources/Images/Orbit_Screencaps/Orbit_lifecycle_select.png
.. |image1| image:: ../../Resources/Images/Orbit_Screencaps/Orbit_lifecycle_bucket_select.png
   :class: OneHundredPercent
.. |image2| image:: ../../Resources/Images/Orbit_Screencaps/Orbit_lifecycle_add_rule.png
   :class: FiftyPercent
.. |image3| image:: ../../Resources/Images/Orbit_Screencaps/Orbit_lifecycle_rule_success.png
   :class: OneHundredPercent

