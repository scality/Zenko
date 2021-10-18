.. _Delete an S3 endpoint:

Delete an S3 Endpoint
=====================

To delete an S3 endpoint from the command line:

#. Retrieve tokens as described in :ref:`Retrieve Access Tokens`.

#. Retrieve list of all endpoints and hostnames:

   .. code::

      kubectl -n zenko get zenkoconfigurationoverlay -o jsonpath='{.items[0].spec.s3API.endpoints[*]}'

   For hostnames only:

   .. code::

      kubectl -n zenko get zenkoconfigurationoverlay -o jsonpath='{.items[0].spec.s3API.endpoints[*].hostname}'

#. Select hostname to delete:

   .. code::

      HOSTNAME="hostname to delete"

#. Send delete request to the management API:

   .. code::

       curl -s -k -X DELETE -H "X-Authentication-Token: ${TOKEN}" "" | jq '

#. Post-checks

   Verify endpoint has been deleted: 

   .. code::

      kubectl -n zenko get zenkoconfigurationoverlay -o jsonpath='{.items[0].spec.s3API.endpoints[*]}' 

   After a few moments, all pods will be in a running state.

   .. code::

      kubectl -n zenko get pods 