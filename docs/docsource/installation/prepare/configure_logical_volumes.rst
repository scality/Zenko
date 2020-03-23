.. _configure_logical_volumes:

Configuring Logical Volumes
===========================

Set up a cluster of nodes conforming to the specifications described in 
:ref:`sizing`. If you are using MetalK8s, do this by downloading
`the latest release <latest-release_>`_, and
following the `installation instructions <mk8s-install_>`_.

.. note::

   It is a best practice to install Zenko on a fresh cluster.

When building your cluster, you must take sizing into account. It's easiest to
use the MetalK8s GUI to set volume sizes. If you are deploying non-default
sizing, make sure your volume sizing is sufficient.

For MetalK8s, you *must* size the volumes during setup. The easiest way to do
this is to set the volume sizes when creating them, then to assign them
using `the MetalK8s GUI <mk8s_volume_create_>`_.

You can also control this from the command line by editing
metalk8s/inventory/group_vars/kube-node.yml as described in :ref:`Setting Volume
Sizes from the Command Line`.

Minimum Volume Size for Cluster Deployments
-------------------------------------------

The following volume sizes are known good for a five-node cluster.

For each node, one volume of each of the following sizes:

- 6 GB
- 10 GB
- 12 GB
- 22 GB
- 54 GB

One additional 100 GB volume for S3 data, which can be bound to any of the
nodes, is also required.

Custom Sizing
~~~~~~~~~~~~~

For custom sizing for a cluster or a "cluster of one" (single-server) deployment,
increase these base numbers.

For non-MetalK8s deployments, follow your vendor or community’s instructions for
configuring persistent volumes at 500 GB/node.

.. _Setting Volume Sizes from the Command Line:

Setting Volume Sizes from the Command Line
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

To configure the volume size from the command line, paste the following into
kube-node.yml, with the sizes changed to suit your volumes:

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

.. _latest-release: https://github.com/scality/metalk8s/releases
.. _mk8s-install: https://metal-k8s.readthedocs.io/en/stable/installation/index.html
.. _mk8s_volume_create: https://metal-k8s.readthedocs.io/en/stable/operation/volume_management/volume_creation_deletion_gui.html#volume-creation

