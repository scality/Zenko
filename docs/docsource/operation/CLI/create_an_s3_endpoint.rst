.. _Create an S3 endpoint:

Create an S3 Endpoint
=====================

To create an S3 endpoint from the command line:

#. Retrieve tokens as described in :ref:`Retrieve Access Tokens`.

#. Issue the following variable declarations and commands:
   
   .. code::
      
      ENDPOINT_PARAMS=$(
          echo '{}' |
          jq -c "
              .hostname=\"${ENDPOINT_HOSTNAME}\" |
              .locationName=\"${LOCATION_NAME}\"
          "
      )
      
      curl -s -k -X POST \
          -H "X-Authentication-Token: ${TOKEN}" \
          -H "Content-Type: application/json" \
          -d "${ENDPOINT_PARAMS}" \
          "http://management.zenko.local/api/v1/config/${INSTANCE_ID}/endpoint" | \
          jq '.'
