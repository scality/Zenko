.. _Update a Replication Workflow:

Update a Replication Workflow
=============================

Once you've created a replication workflow, you can update it as follows:

#. Click the **Workflows** tab, exposing the Workflows panel.

   .. image:: ../../Graphics/xdm_ui_workflow_panel.png

#. Select the workflow rule to edit.

#. You can change the replication destination, edit the prefix, and toggle the
   active state of the workflow.

#. When you have made all desired changes, click **Save Changes**.

Updating a Replication Workflow Using the AWS CLI
-------------------------------------------------

Updating a replication workflow follows the same logic as :ref:`creating
one<Create a Replication Workflow>`. Use the :ref:`put-bucket-replication` S3
command to create or update replication workflows from the command line.

.. code::
   
   aws s3api put-bucket-replication --bucket source-bucket --replication-configuration <configuration>

Where ``configuration`` is a JSON object including the following syntax:

.. code::

   ...
     "Rules": [
       {
         "Destination": {
               "Bucket": "arn-bucket-source",
                 "StorageClass": "storage-location"
         }
       }
     ],
     "Role": "arn:aws:iam::root:role/s3-replication-role",  
   ...
   
For API operation, see :ref:`PUT Bucket Replication`.
