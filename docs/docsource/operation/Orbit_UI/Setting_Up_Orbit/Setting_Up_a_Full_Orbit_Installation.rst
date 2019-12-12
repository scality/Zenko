.. _setting_up_orbit: 

Setting Up a Full Orbit Installation
====================================

Orbit can be run as a user interface to Zenko no matter where or how Zenko is
hosted. You can deploy Zenko in any of the following topologies:

* As a test instance running on a local machine using Minikube
* On a cloud host using MetalK8s
* On a cloud host using the host’s native Kubernetes environment (EKS, GKE, AKS).

To run a “full” Zenko installation, you must register your Zenko instance to
Orbit.

#. Go to `Zenko.io <https://www.zenko.io/try-zenko/>`_.

#. Click **Register with Google** (Google ID required)

#. Authenticate:

   |image0|

#. Click **Install Now**.

   .. image:: ../../Resources/Images/Orbit_Screencaps/Orbit_Welcome_screen.png
      :scale: 75%	      

#. Review and affirm the Privacy Policy:

   |image1|

#. Click **Register My Instance**.

   |image2|

#. Enter your Instance ID and your instance's name, then click **Submit
   Now!**

   |image3|

.. tip::

   To find your Instance ID, use the
   :version-ref:`kubectl commands <https://documentation.scality.com/Zenko/{version}/installation/install/Install_Zenko.html#get-instance-id>`
   from :version-ref:`Zenko Installation <https://documentation.scality.com/Zenko/{version}/installation/index.html>`.

.. |image0| image:: ../../Resources/Images/Orbit_Screencaps/google_login.png
   :scale: 75%
.. |image1| image:: ../../Resources/Images/Orbit_Screencaps/Orbit_setup_Privacy.png
   :width: 75%
.. |image2| image:: ../../Resources/Images/Orbit_Screencaps/Orbit_register_my_Instance_detail.png
.. |image3| image:: ../../Resources/Images/Orbit_Screencaps/Orbit_setup_Instance_ID.png
   :width: 75%
