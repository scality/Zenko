CRR Pause and Resume API Definition
===================================

Get CRR Status
--------------

**Route:** GET /_/backbeat/api/crr/status

This GET request checks if cross-region replication is enabled or not
for all locations configured as destination replication endpoints.

**Response:**

.. code::

  {
    "location1": "disabled",
    "location2": "enabled"
  }

Get CRR Status for a Location
-----------------------------

**Route:** GET /_/backbeat/api/crr/status/<location-name>

This GET request checks if cross-region replication is enabled or not
for a specified location configured as a destination replication
endpoint.

**Response:**

.. code::

  {
    "<location-name>": "enabled"
  }

GET Resume CRR for a Location
-----------------------------

**Route:** GET /_/backbeat/api/crr/resume/<location-name>

This GET request checks if the given location has a scheduled
cross-region replication resume job. If a resume job is scheduled, you
will see the expected date when the resume occurs.

You may specify “all” as the <location-name> to get all scheduled resume
jobs, if any.

**Response:**

.. code::

  {
    "location1": "2018-06-28T05:40:20.600Z",
    "location2": "none"
  }

Pause All CRR
-------------

**Route:** POST /_/backbeat/api/crr/pause

This POST request is to manually pause the cross-region replication
service for all locations configured as destination replication
endpoints.

**Response:**

.. code::

  {}

Pause CRR for a Location
------------------------

**Route:** POST /_/backbeat/api/crr/pause/<location-name>

This POST request is to manually pause the cross-region replication
service for a specified location configured as a destination replication
endpoint.

**Response:**

.. code::

  {}

Resume All CRR
--------------

**Route:** POST /_/backbeat/api/crr/resume

This is a POST request to resume the cross-region replication service
for all locations configured as destination replication endpoints.

**Response:**

.. code::

  {}

POST Resume CRR for a Location
------------------------------

**Route:** POST /_/backbeat/api/crr/resume/<location-name>

This is a POST request to resume cross-region replication to a specified
location configured as a destination replication endpoint.

**Response:**

.. code::

  {}

Schedule Resume CRR for a Location
----------------------------------

**Route:** POST /_/backbeat/api/crr/resume/<location-name>/schedule

This is a POST request to schedule resuming cross-region replication to
a specified location configured as a destination replication endpoint.
Specify "all" as a location name to schedule a resume for all available
destinations.

Providing a POST request body object with an hours key and a valid
integer value schedules a resume to occur in the given number of hours.

If no request body is provided for this route, a default of 6 hours is
applied.

**Request Body Example:**

.. code::

  {
    "hours": 6
  }

**Response:**

  .. code::

    {}
