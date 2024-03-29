.. _Delete a Replication Workflow:

Delete a Replication Workflow
=============================

To delete a replication workflow rule:

#. Click the **Workflows** tab. The Workflow panel displays.

   .. image:: ../../graphics/xdm_ui_workflow_panel.png

#. Select a workflow to delete. Click the **Delete Workflow** button.

#. The workflow is removed from the menu. If no workflows remain, you are
   prompted to create a new worflow.

Deleting a Replication Workflow Using the AWS CLI
-------------------------------------------------

The following command deletes a replication configuration from a bucket named
"my-bucket"::

  $ aws s3api delete-bucket-replication --bucket my-bucket


For API operation, see :ref:`DELETE Bucket Replication`.
