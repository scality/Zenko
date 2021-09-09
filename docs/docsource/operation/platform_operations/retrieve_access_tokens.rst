.. _Retrieve Access Tokens:

Retrieve Access Tokens
======================

Prerequisites
~~~~~~~~~~~~~

-kubectl, jq, and curl installed

Procedure
~~~~~~~~~

.. note::

   In the following commands, replace ``<username>`` and ``<password>`` with
   the user credentials provisioned for the OIDC service, and ``<zenko-name>``
   with the name of the deployed Zenko instance.

.. note::

   In the following example, ``Keycloak`` is used as the OIDC provider, and
   ``https://ui.zenko.workloadplane.scality.local`` is the url for making
   the request to the ``Keycloak`` service. In addition, ``artesca`` and
   ``zenko-ui`` are the example Keycloak realm and client-id values,
   respectively.

#. Declare variables 

   .. code::  

      OIDC_REALM='artesca'
      OIDC_CLIENT_ID='zenko-ui'
      OIDC_USER='<username>'
      OIDC_USER_PASSWORD='<password>'

#. Retrieve ``TOKEN``:

   .. code::

      TOKEN=$(
          curl -s -k "https://ui.zenko.workloadplane.scality.local/auth/realms/${OIDC_REALM}/protocol/openid-connect/token" \
              -d 'scope=openid' \
              -d "client_id=${OIDC_CLIENT_ID}" \
              -d "username=${OIDC_USER}" \
              -d "password=${OIDC_USER_PASSWORD}" \
              -d "grant_type=password" | \
              jq -cr '.id_token'
      )

#. Retrieve ``INSTANCE_ID``:

   .. code::

      INSTANCE_ID=$(kubectl get -n zenko zenko artesca-data -o jsonpath='{.status.instanceID}')

