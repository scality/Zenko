.. _`Get CRR Resume Time`:

Get CRR Resume Time
===================

This GET request checks if the given location has a scheduled cross-region
replication resume job. If a resume job is scheduled, Backbeat returns the
date when the resume is scheduled to occur.

.. note::

   CRR resumes are scheduled as unique, non-recurring events. Resumes cannot be
   scheduled as recurring events.

Request
-------

.. code::

   GET /_/backbeat/api/crr/resume/<location-name>

Specifying ``all`` for the location name returns all scheduled resume jobs, if
any. 


Response
--------

The response is formatted by location and contains a time for requested
locations with a scheduled resume or ``none`` for locations with no scheduled
resume.

.. code::

  {
    "location1": "2018-06-28T05:40:20.600Z",
    "location2": "none"
  }

