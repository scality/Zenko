.. _Zenko from the Command Line:

Zenko from the Command Line
===========================

Zenko supports command-line interactions for a limited set of Amazon
S3 API calls and to access its own Backbeat server.

Enabling command-line interactions enables programmatic access to
the following features:

.. toctree::
   :maxdepth: 1

   CRR Metrics and Healthcheck <CRR_Metrics_and_Health>
   CRR Retry <CRR_Retry>
   CRR Pause and Resume <CRR_Pause_&_Resume>
   CRR Statistics <CRR_statistics>
   Object Lifecycle Management <Object_Lifecycle_Management>

Accessing Zenko from the command line requires setting up access to 
the S3 API, the Backbeat API, or both.

.. _S3 API config:

S3 API
------

Zenko supports a limited set of S3 API commands. For a comprehensive
listing of supported S3 commands, see the *Zenko Reference Guide*.

Setup
~~~~~

To access Zenko’s AWS S3 API, you must perform the following setup
tasks. In the present example, server 1 is modified to be the
AWS gateway.

#. Using SSH, open any server in a running Zenko instance.

   ::

       $ ssh centos@10.0.0.1

#. Install the EPEL libraries.

   ::

       [$centos@node-01 ~]$ sudo yum -y install epel-release

#. Install python-devel and python-pip

   ::

       [centos@node-01 ~]$ sudo yum -y install python-devel python-pip

#. Install awscli.

   ::

       [centos@node-01 ~]$ sudo pip install awscli

#. Edit /etc/hosts.

   ::

       [centos@node-01 ~]$ sudo vi /etc/hosts

#. Nominate a server node as zenko.local.

   ::

       # Ansible inventory hosts BEGIN
       10.0.0.1 node-01 node-01.cluster.local zenko.local
       10.0.0.2 node-02 node-02.cluster.local
       10.0.0.3 node-03 node-03.cluster.local
       10.0.0.4 node-04 node-04.cluster.local
       10.0.0.5 node-05 node-05.cluster.local
       # Ansible inventory hosts END

#. Retrieve your Zenko access key ID and Zenko secret access key.

#. Configure AWS using these keys.

   ::

       [centos@node-01 ~]$ aws configure
       AWS Access Key ID [None]: P6F776ZY4QZS7BY9E5KF
       AWS Secret Access Key [None]: lndN5vIeqL9K6g6HVKCMAjZbTX9KsCGw5Fa4MbRl
       Default region name [None]:
       Default output format [None]:

   Leave the Default region name and output format fields blank.

#. Enter a test AWS command.

   ::

       [centos@node-01 ~]$ aws s3 ls --endpoint http://zenko.local
       2018-09-07 18:33:34 wasabi-bucket
       2018-09-05 22:17:18 zenko-bucket-01

Zenko can now respond to the set of S3 commands documented in the
Reference Guide.

Backbeat API
------------

Backbeat can be accessed from the command line for troubleshooting
purposes from inside the firewall only. To access command-line features
from Zenko, set up port forwarding for port 8900.

First, determine the full name of the backbeat-api:

::

    $ kubectl get pods | grep backbeat-api

The response resembles:

::

    zenko-backbeat-api-787f756fb7-8hwh4             1/1    Running    6       6h

Copy this and issue the following command:

::

    $ kubectl port-forward zenko-backbeat-api-787f756fb7-8hwh4 8900

With this port open, the Backbeat API port can respond to command-line
queries.

A robust API is not yet developed. Use this port for testing and
troubleshooting only.

.. warning::

   Opening the Backbeat API has security implications. Don’t expose the
   Backbeat port unless you know what you’re doing.

.. _`CRR Metrics and Healthcheck`: CRR_Metrics_and_Health.html
