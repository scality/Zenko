.. _Accessing the vaultclient API:

Accessing the vaultclient API
=============================

If you need access to a command not available in the Supervisor, you can make
changes to the Vault with direct shell commands in the scality-s3 Docker
container. To open a bash session in the scality-s3 Docker container, ssh into
the S3 Connector host and enter the following command:

.. code::

   $ docker exec -it scality-s3 /bin/bash

Expect a prompt resembling:

.. code::
   
   scality@app1:~/S3$

Enter vaultclient commands directly, by invoking /bin/vaultclient.

Using this method, you can issue direct vaultcient commands for the following APIs:

:ref:`Create Account`
:ref:`Generate Account Access Key`
:ref:`List Accounts`
:ref:`Delete Account`


