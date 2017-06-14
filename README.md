# Zenko
Because everyone should be in control of their data.

##
This repository will include installation resources to deploy the full Zenko stack over different orchestration systems.
We will start with docker swarm but others like kubernetes will follow.
The stack is commposed of ngninx, S3 server, utapi, dmd, redis all magically configured to talk to each other.
There must be a testing swarm yml as well as a production swarm yml that includes HA and asks for pre-existing volumes.

Example installer repo: https://github.com/hashicorp/terraform/tree/master/examples
