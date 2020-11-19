.. _preconfiguring_zenko:

Preconfiguring XDM
====================

XDM provides valid settings for a stable, featureful deployment by default.
For most users, the best practice is to use the default settings to deploy
XDM, then to modify settings files held in Helm charts and use Helm to pass
these values to the deployment.

For some uses, however (for example, in a high-security environment that
requires unnecessary interfaces to be turned off), configuring the charts
*before* deploying XDM may be necessary. To preconfigure XDM, follow the
instructions in :ref:`configuring_zenko`, then install using your custom
settings.
