Object Lifecycle Management
===========================

Orbit enables you to set policies that manage lifecycle events in selected
buckets. 

From the Bucket Lifecycle selector on the Zenko sidebar menu, you can select,
then create lifecycle transition or lifecycle expiration policies for objects
in buckets. These transition (move) or expire (delete) objects that match your
criteria based on a timespan you set. In other words, Zenko reviews when a set
number of days has passed since an object or type of object was last touched,
and either moves such objects to a different storage site (transitions it) or 
deletes (expires) them. You can create rules to transition objects themselves, 
or if versioning is enabled, to transition object versions.

This feature can help you keep data fresh and save money. You can, for
example, store job information for ongoing customer interactions on a
local RING. After a customer stops making demands for immediate (low-\
latency) support, information pertaining to their purchase order transitions
from the company RING to a public cloud. Latency may increase, but cloud
data storage costs may be reduced. After a few months, if the data on the
public cloud is not accessed, it can either be transitioned to another
cloud or deleted (expired).

Orbit supports most of the Amazon S3 lifecycle management command set; 
however, the following transition rules can only be defined using API calls.

   * Filtering by object tag
   * Using the Date field (GMT ISO 8601 format)
   * Setting the Days field to zero
   * Setting a custom ID

See "Bucket Lifecycle Operations" in the *Reference Guide*.

.. toctree::
   :maxdepth: 1

   Object Lifecycles: Transition <Lifecycle_Management-Transition.rst>
   Object Lifecycles: Expiration <Lifecycle_Management-Expiration.rst>
