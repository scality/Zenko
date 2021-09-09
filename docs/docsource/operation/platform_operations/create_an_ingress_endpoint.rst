.. _Create an Ingress Endpoint:

Create an Ingress Endpoint
==========================

Prerequisites
-------------

- kubectl, jq, and curl must be installed

Procedure
---------

#. Retrieve ``TOKEN`` and ``INSTANCE_ID`` as described in :ref:`Retrieve Access Tokens`.

#. Get the list of valid locations:

   .. code:: 

      kubectl --namespace zenko get ZenkoConfigurationOverlays -o jsonpath='{.items[0].spec.locations[*].name}'

#. Issue the following variable declarations and commands:
  
   .. note::

      For the following command, replace ``<hostname>`` and ``<location>``
      with the values of the ingress endpoint to be created.

      ``<location>`` must be one of the valid locations retrieved in the
      previous command, and ``<hostname>`` must be a valid domain name.

   .. note::
      
      In this example, the url
      ``https://management.zenko.workloadplane.scality.local`` is used for
      making the request to the Zenko management service.

   .. code::
      
      ENDPOINT_PARAMS=$(
          echo '{}' |
          jq -c "
              .hostname=\"<hostname>\" |
              .locationName=\"<location>\"
          "
      )
      
      curl -s -k -X POST \
          -H "X-Authentication-Token: ${TOKEN}" \
          -H "Content-Type: application/json" \
          -d "${ENDPOINT_PARAMS}" \
          "https://management.zenko.workloadplane.scality.local/api/v1/config/${INSTANCE_ID}/endpoint" | \
          jq '.'
