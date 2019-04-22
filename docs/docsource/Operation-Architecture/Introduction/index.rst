About Zenko
===========

The Zenko open-source project, described at https://www.zenko.io/ and
hosted on GitHub at https://github.com/scality/Zenko, provides the core
logic of the Zenko product. This core is a stack of microservices,
written primarily in Node.js and some Python, that provides a RESTful
API that handles the complexities of translating S3 API calls into
actions on various cloud storage platforms.

Based on the latest stable branch of open-source Zenko, the Zenko
Enterprise product offers full Scality support to build and maintain the
topology that works best for your organization, use of the Orbit
graphical user interface beyond 1 TB of data under management, and other
value-added features Scality elects to offer.

Zenko can be accessed and managed through the Orbit GUI, or using direct
API calls from the command line. Because Orbit acts as a seamless
management interface to Zenko, people may confuse the interface
(Orbit) with the underlying logic (Zenko). You can access Zenko from
Orbit, or from the command line. Where it makes sense, Scality provides
APIs to help customize, automate, and improve interactions with Zenko.

.. toctree::
  :maxdepth: 2

     Conceptual Framework <Conceptual_Framework>
     Supported Public and Private Clouds <supported_clouds>
     Supported Protocols <supported_protocols>


