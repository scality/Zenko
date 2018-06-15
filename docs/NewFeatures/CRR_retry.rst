CRR Retry
=========

As with any large data transfers over public infrastructure,
cross-region replication operations are imperfect and can suffer
failure. In early releases, CRR operations did not fail gracefully--sometimes
requiring repetition of an entire CRR operation. With v. 1.0, Zenko provides
a way to monitor CRR operations, retrieve a list of failed operations,
and retry specific operations on failure.

If a CRR request fails, CRR Retry provides a list of all failed CRR
requests, formatted similarly to S3’s List Object API response. Users can
select failed CRR requests to retry by specifying the bucket, key,
version ID and storage class for each listed CRR request failure.

CRR Retry is accessible using a RESTful API call to the Backbeat
component.
