.. _preconfiguring_zenko:

Preconfiguring |product|
========================

|product| provides valid settings for a stable, featureful deployment by default.
For most users, the best practice is to use the default settings to deploy
|product|, then to modify settings files held in Helm charts and use Helm to pass
these values to the deployment.

For some uses, however (for example, in a high-security environment that
requires unnecessary interfaces to be turned off), configuring the charts
*before* deploying |product| may be necessary. To preconfigure |product|, follow the
instructions in :ref:`configuring_zenko`, then install using your custom
settings.
