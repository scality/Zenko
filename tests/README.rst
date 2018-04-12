zenko_e2e
=========
A suite of End-to-End tests for Zenko.

Hacking
-------
When working on these tests, it's important to note the suite is supposed to be
able to run in a fully read-only container environment::

    $ make container-image
    $ make container-run \
        AWS_ACCESS_KEY_ID=my_access_key \
        AWS_SECRET_ACCESS_KEY=my_secret_key \
        CLOUDSERVER_FRONT_ENDPOINT=http://zenko.local/

To validate your changes style-wise, run ``tox``.
