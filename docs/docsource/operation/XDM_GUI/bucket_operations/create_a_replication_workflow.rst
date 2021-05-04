.. _Create a Replication Workflow:

Create a Replication Workflow
=============================

Before creating a replication workflow, you must have a source bucket and a
destination deployed.

.. important::
   
   *Both the source and the destination must have versioning enabled.*

.. note::

   Only one-to-one bucket replication is supported. One-to-many replication is
   not supported.
   
To set up replication:

#. Click the **Workflows** tab. The first time you do this, you are prompted to
   create your first workflow rule:

   .. image:: ../../Graphics/xdm_ui_create_workflow_first.png

   Click **Create Rule**	      

   If you have already established your first rule, the workflow panel appears:

   .. image:: ../../Graphics/xdm_ui_workflow_panel.png
   
#. The **Create New Workflow** panel displays:

   .. image:: ../../Graphics/xdm_ui_workflow_create.png

#. Select a source bucket name and a destination location name.

   You can specify a prefix. This filters only for objects with this prefix; for
   example, all items prepended with "accounting/", "evidence/", or
   "imaging/". This is useful for replication selectivity.

   You can also toggle the state from inactive to active. This controls whether
   the workflow is in effect (active replication) or idle (rule exists, but is
   not in effect).

#. When you've entered all desired information, click **Create**. The new
   workflow rule appears in the workflow panel.

   .. image:: ../../Graphics/xdm_ui_workflow_panel.png

.. important::

   Replication is not retroactive. In other words, if you configure a bucket to
   be replicated, only files written to, or changed in that bucket *after you
   have activated the workflow rule* are replicated.

Creating a Replication Workflow Using the AWS CLI
-------------------------------------------------

Use the :ref:`put-bucket-replication` S3 command to create or update replication
workflows from the command line.

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
