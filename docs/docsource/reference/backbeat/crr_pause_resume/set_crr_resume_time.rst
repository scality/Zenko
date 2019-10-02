.. _`Set CRR Resume Time`:

Set CRR Resume Time
===================

This POST request sets the resume time for paused cross-region replication at a
specified location configured as a destination replication endpoint. Specifying
``all`` as the location name schedules a resume for all available paused
destinations.

Providing a POST request body object with an hours key and a valid integer value
schedules a resume to occur in the given number of hours.

If no request body is provided for this route, a default of 6 hours is applied.


Request
-------

.. code::

   POST /_/backbeat/api/crr/resume/<location-name>/schedule

Example Body
~~~~~~~~~~~~

.. code::

  {
    "hours": 6
  }

Response
--------

.. code::

    {}
