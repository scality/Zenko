.. _Create an S3 endpoint:

Create an S3 Endpoint
=====================

Create an S3 Endpoint from the UI
---------------------------------

#. From the |product| home screen, select the **Data Services** tab.

#. Click the **+ Create Data Service** button.

   .. image:: ../../graphics/create_endpoint.png

#. Enter a descriptive **Hostname** and select a location from the **Select Storage Location** drop down menu. 

   .. note::

      If no location is specified when creating a bucket from the API, this endpoint 
      location will be used to store objects.

   .. image:: ../../graphics/create_endpoint_options.png

#. Click the **Create** button. The **Deploying Data Service** spinner appears.

#. Check that the created endpoint is listed. 

   .. image:: ../../graphics/endpoint_created.png


Create an S3 Endpoint from the Command Line
----------------------------------------------

#. Retrieve tokens as described in :ref:`Retrieve Access Tokens`.

#. Define a hostname. For more information refer to: 

   - `Rules for naming Amazon S3 access points <https://docs.aws.amazon.com/AmazonS3/latest/userguide/creating-access-points.html#access-points-names>`_.

   - `rfc 1123 - Requirements for Internet Hosts <https://datatracker.ietf.org/doc/html/rfc1123/>`_

   - `rfc 1034 - Domain Names <https://datatracker.ietf.org/doc/html/rfc1034#section-4.3.3>`_

   .. code::

      ENDPOINT_HOSTNAME="hostname"

#. Define storage location. For more information refer to :ref:`Add a Storage Location`.

   .. code::

      LOCATION_NAME="location" 

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
          "https://management.zenko.workloadplane.scality.local/api/v1/config/${INSTANCE_ID}/endpoint" | \ 
          jq '.'
