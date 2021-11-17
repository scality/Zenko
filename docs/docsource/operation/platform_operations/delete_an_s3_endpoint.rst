.. _Delete an S3 endpoint:

Delete an S3 Endpoint
=====================

Delete an S3 Endpoint from the UI
---------------------------------

#. From the |product| home screen, select the **Data Services** tab.

#. Click the red trash can corresponding to the endpoint you want to delete, and click **Delete** on the confirmation popup.

   .. image:: ../../graphics/endpoint_created.png

#. Check that the deleted endpoint is no longer listed.

   .. image:: ../../graphics/create_endpoint.png


Delete an S3 Endpoint from the Command Line
-------------------------------------------

#. Retrieve tokens as described in :ref:`Retrieve Access Tokens`.

#. Retrieve the list of all endpoints and hostnames.

   .. code::

      kubectl -n zenko get zenkoconfigurationoverlay -o jsonpath='{.items[-1].spec.s3API.endpoints[*]}' \
        --sort-by='{.metadata.creationTimestamp}'

#. Select the hostname to delete.

   .. code::

      HOSTNAME="hostname to delete"

#. Send a delete request to the management S3-API.

   .. code::

       curl -s -k -X DELETE -H "X-Authentication-Token: ${TOKEN}" "https://management.zenko.workloadplane.scality.local/api/v1/config/${INSTANCE_ID}/endpoint/${HOSTNAME}"

#. Check that the endpoint has been deleted.

   .. code::

      kubectl -n zenko get zenkoconfigurationoverlay -o jsonpath='{range .items[-1].spec.s3API.endpoints[*]}{}{"\n"}{end}' --sort-by='{.metadata.creationTimestamp}'                               

   After a few moments, all pods will be in a running state.

   .. code::

      kubectl -n zenko get pods 