` <>`__\ Metadata Pruning
-------------------------

Once a metadata server has successfully backed its local journal up, the
local copy is no longer necessary and can be pruned to reclaim space.

The Metadata pruning feature can be configured through the Federation
environment’s env/<my-env>/group\_vars/all file, through the prune
parameter of the ``env_metadata`` section:

::

    env_metadata:
    # enable / disable prunning
    prune: false

The default value for the pruning feature is disabled (false). To enable
pruning, set this value to true and run the run.yml Ansible playbook to
apply it.
