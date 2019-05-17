.. _configure_logical_volumes:

Configure Logical Volumes
=========================

Set up a cluster of nodes conforming to the specifications described in 
:ref:`sizing`. If you are using MetalK8s, do this by downloading
the latest stable MetalK8s source code from the MetalK8s releases page:
https://github.com/scality/metalk8s/releases. Follow the Quickstart guide
(in docs/usage/quickstart.rst) to install MetalK8s on your cluster,
instantiating the desired number of nodes.

.. note::

   It is a best practice to install Zenko on a fresh cluster.

Volume Sizing
-------------

When building your cluster, take sizing into account. If you are deploying
non-default sizing, make sure your volume sizing is sufficient. For MetalK8s,
you *must* size the volumes in the inventory during setup in
metalk8s/inventory/group_vars/kube-node.yml.

Minimum Volume Size for Cluster Deployments
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

For a default sizing, paste the following into kube-node.yml:

.. code-block:: yaml
		
  metalk8s_lvm_default_vg: False
  metalk8s_lvm_vgs: ['vg_metalk8s']
  metalk8s_lvm_drives_vg_metalk8s: ['/dev/vdb']
  metalk8s_lvm_lvs_vg_metalk8s:
    lv01:
      size: 125G
    lv02:
      size: 125G
    lv03:
      size: 125G
    lv04:
      size: 62G
    lv05:
      size: 62G


Minimum Volume Size for Single-Server Deployments
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

For a default sizing, paste the following into kube-node.yml:

.. code-block:: yaml
		
  metalk8s_lvm_default_vg: False
  metalk8s_lvm_vgs: ['vg_metalk8s']
  metalk8s_lvm_drives_vg_metalk8s: ['/dev/vdb']
  metalk8s_lvm_lvs_vg_metalk8s:
    lv01:
      size: 120G
    lv02:
      size: 120G
    lv03:
      size: 120G
    lv04:
      size: 60G
    lv05:
      size: 60G
    lv06:
      size: 10G

Custom Sizing
~~~~~~~~~~~~~

For custom sizing for a cluster or a "cluster of one" (single-server) deployment,
increase these base numbers.

For non-MetalK8s deployments, follow your vendor or community’s instructions for
configuring persistent volumes at 500 GB/node.