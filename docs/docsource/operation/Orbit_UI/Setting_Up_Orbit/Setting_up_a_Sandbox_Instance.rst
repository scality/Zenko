.. _Setting Up an Orbit Sandbox Instance:

Setting Up an Orbit Sandbox Instance
====================================

A good way to learn how to use Orbit is through the sandbox feature
available at `zenko.io <https://zenko.io/>`__ under
`Try Zenko <https://www.zenko.io/try-zenko/>`__.

**Prerequisites**

-  A web-connected browser
-  One or more cloud storage targets (AWS, RING, GCP, Azure, etc.)

The Sandbox is a great place to learn how Orbit will help you manage
your data. To set up a Sandbox instance:

#. Open `zenko.io <https://zenko.io/>`__, and click `Try Zenko
   <https://www.zenko.io/try-zenko/>`__.

   |image0|

#. Click **Register with Google**. You must authenticate using a Google ID.

   .. image:: ../../Graphics/google_login.png

#. After you have registered, the Welcome dialog displays:

   |image1|

   Click **Install now**.

#. The **REGISTER AN INSTANCE** screen displays:

   |image2|

   Choose the Sandbox option (**Next: Let's do this!**)

#. The **CREATE YOUR ZENKO SANDBOX** screen displays:

   |image3|

   Enter a name for your sandbox and click **Create Sandbox**.

#. After less than a minute, the **Settings** window displays:

   |image4|

   Your sandbox is created. Depending on server load, there may be a delay of
   a few minutes to complete the Orbit setup.

#. Once setup is complete, you're taken automatically to the **STORAGE
   ACCOUNTS** screen for account creation.

   .. image:: ../../Graphics/newuser_add_storage_location_prompt.png   

#. Add a storage account name and click the **Generate** button. This creates a
   new user/account, and generates an access/secret key pair.


#. Click **Show** to reveal your secret key. Copy this to a secure location,
   either by highlighting the exposed text or clicking the **Copy** button to
   transfer the secret key to your clipboard.

   .. image:: ../../Graphics/secret_key_my_account.png

   .. important:: You do not get a second chance. Copy this now.

#. The sandbox is for demonstration purposes, and is limited for total data
   managed (1 TB) and time (48 hours). Scality may change these limits without
   notice. You can review how much time remains for your sandbox by reviewing the
   **Settings** window's **Sandbox Time Left** indicator.

   .. image:: ../../Graphics/sandbox_settings.png

   The sandbox runs against a Zenko instance hosted by Scality. Though this
   demonstration instance is limited both in its lifespan and in the amount of
   data it can handle, you can use it to watch Zenko in action. 

.. |image0| image:: ../../Graphics/Zenko.io_screen.png
.. |image1| image:: ../../Graphics/Orbit_Welcome_screen.png
.. |image2| image:: ../../Graphics/Orbit_register_1.png
.. |image3| image:: ../../Graphics/Orbit_Enter_Sandbox.png
.. |image4| image:: ../../Graphics/Orbit_settings_setup.png
