About |product|
===============

|product| is Scality's multi-cloud storage controller. It provides a single point of
integration using the Amazon S3 and Azure Blob Storage cloud storage APIs, and
enables data backup, transfer, and replication across private and public clouds.

Using |product|, you can store to a Scality RING storage device and automatically
back up to one or several public clouds. Alternatively, you can use a public
cloud such as Amazon S3 as primary storage and replicate data stored
there--specific files, file types, or entire buckets--to other supported clouds,
such as Google Cloud Platform (GCP) or Microsoft Azure.

The |product| open-source project, described at https://www.zenko.io/ and hosted on
GitHub at https://github.com/scality/Zenko, provides the core logic of the Zenko
product. This core is a stack of microservices, written primarily in Node.js and
some Python, that provides a RESTful API that handles the complexities of
translating S3 API calls into actions on various cloud storage platforms.

Based on the latest stable branch of open-source |product|, the |product| Enterprise
product offers full Scality support to build and maintain the topology that
works best for your organization, use of the Orbit graphical user interface
beyond 1 TB of data under management, and other value-added features Scality
elects to offer.

|product| can be accessed and managed through the Orbit GUI, or using direct API
calls. Because Orbit acts as a seamless management interface to |product|, people
may confuse the interface (Orbit) with the underlying logic (|product|). You can
access |product| from Orbit, or from the command line. Where it makes sense, Scality
provides APIs to help customize, automate, and improve interactions with |product|.

.. toctree::
  :maxdepth: 2

     Conceptual Framework <Conceptual_Framework>
     Supported Clouds and Services <supported_clouds+services>



