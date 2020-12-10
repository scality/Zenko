.. _add_a_new_user:

Add a New User
==============

#. Click **Storage Accounts** in the sidebar to raise the Storage Accounts window.

   ..  image:: ../../Graphics/sidebar_storage_accounts_button.png
   
#. Enter a new user name in the **Account Name** field and click
   **Generate**.

   |image0|

#. Click **Show** to see the secret key associated with this user:

   |image2|

   Copy this key and store it.

   .. warning::

      You will not get a second chance to copy this key! If you lose the key, the
      user name and any information associated with it are lost as well.

   A **Copy** button is included in the user interface for your convenience.
   
As the |product| user, you can create multiple users in the |product|-managed namespace,
each with a unique access key and secret key. You can also re-generate 
access/secret key pairs for any such user.

.. |image0| image:: ../../Graphics/Orbit_user_create_enter_username.png
   :class: FiftyPercent
.. |image2| image:: ../../Graphics/Orbit_user_create_secret_key.png
   :class: FiftyPercent
