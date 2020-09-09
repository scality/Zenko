.. _General vaultclient Command Line Options:

General vaultclient Command Line Options
========================================

.. tabularcolumns:: X{0.25\textwidth}X{0.20\textwidth}X{0.50\textwidth}
.. table::

   +------------------------+-------------------------+------------------------+
   | Option                 | Argument                | Description            |
   +========================+=========================+========================+
   | ``--cafile``           | <certificate-authority- | Specifies the path to  |
   |                        | path>                   | the certificate        |
   |                        |                         | authority file         |
   |                        |                         | (recommended for       |
   |                        |                         | self-signed            |
   |                        |                         | certificates); in the  |
   |                        |                         | cas of self-signed     |
   |                        |                         | certificates, this     |
   |                        |                         | option will be         |
   |                        |                         | required unless the    |
   |                        |                         | user specifies         |
   |                        |                         | ``--noCaVerification`` |
   +------------------------+-------------------------+------------------------+
   | ``--https``            | --                      | Enables HTTPS          |
   |                        |                         | protocol for           |
   |                        |                         | vaultclient commands   |
   +------------------------+-------------------------+------------------------+
   | ``--noCaVerification`` | --                      | Disables SSL           |
   |                        |                         | certificate            |
   |                        |                         | validation             |
   +------------------------+-------------------------+------------------------+
   | ``--host``             | <hostname>              | Specifies the Vault    |
   |                        |                         | host for vaultclient;  |
   |                        |                         | configuration          |
   |                        |                         | necessary in the       |
   |                        |                         | event the endpoint is  |
   |                        |                         | not localhost:8600.    |
   +------------------------+-------------------------+------------------------+
   | ``--port``             | <port>                  | Specifies the Vault    |
   |                        |                         | port for vaultclient;  |
   |                        |                         | configuration          |
   |                        |                         | necessary in the       |
   |                        |                         | event if the endpoint  |
   |                        |                         | is not                 |
   |                        |                         | localhost:8600.        |
   +------------------------+-------------------------+------------------------+
