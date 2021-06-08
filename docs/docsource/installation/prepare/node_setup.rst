Configure the Nodes
===================

Follow these steps to set up the node structure using MetalK8s.

#. Open MetalK8s.

   .. image:: ../Graphics/MK8s_clean.png
      :width: 100%

#. Click **Create a New Node**.

   .. image:: ../Graphics/MK8s_new_node.png
      :width: 75%
	      
#. Enter the hostname, roles, and SSH information for the node.

   .. image:: ../Graphics/MK8s_new_node_filled_in.png
      :width: 75%
	      
   .. tip::

      If you aren't certain about the node's hostname, open the node in SSH and
      enter ``hostname``. This is the correct value to enter here. 

#. Click **Create**. If everything is correctly configured, you'll see a success
   banner.

   .. image:: ../Graphics/MK8s_node_created_green.png
      :width: 100%
      
Troubleshooting
---------------

Failures at this point are usually caused by one of the following misconfigurations:

* hostname

  Make sure you enter the hostname that's returned by the node when you enter
  "hostname" in its command line. Some hypervisors allow you to use a "friendly"
  name to refer to the host, which can lead to confusion.
  
* SSH authentication

  The easiest test to validate your SSH configuration is to log in to the
  bootstrap node, change to root (with ``$ sudo su``, for example), then try to
  access the nodes using SSH. If the root user on the bootstrap node cannot
  access the nodes, the MetalK8s platform cannot create the node.
  
* Incorrect sudo setting

  In production and in most setups, it's best to enable **Sudo Required** in
  the checkbox.
