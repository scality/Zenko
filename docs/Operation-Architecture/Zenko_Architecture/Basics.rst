Basics
======

Zenko provides a layer that mediates between a user or configured
storage frontend and one or several storage backends.

|image0|

Zenko may use a transient source, which enables it to write once to a
master (local) storage cloud, then replicate the stored data to other
clouds without incurring egress fees from the primary storage cloud.

Zenko uses agile application frameworks such as Kubernetes for
orchestration and Prometheus for monitoring. Zenko is deployed using
MetalK8s either on-premises or in the cloud, or with a cloud Kubernetes
framework (such as GKE, AKS, EKS, or Kops).

.. |image0| image:: ../Resources/Images/Zenko_hi-level.svg
   :class: SeventyFivePercent

