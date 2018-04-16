zenko_e2e
=========
A suite of End-to-End tests for Zenko.

Hacking
-------
When working on these tests, it's important to note the suite is supposed to be
able to run in a fully read-only container environment. Given a suitable
``.env`` file, run::

    $ make container-image
    $ make container-run

To validate your changes style-wise, run ``tox``.
