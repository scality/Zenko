#!/bin/bash
set -euf -o pipefail

# This script is the terraform entry point
# to the test.
#
# This script takes no argument.
# This script expects to be run as root.
# This script expects ssh connectivity to be
# provided through the ssh-agent associated 
# with the root user.
#
# This scripts assumes that information 
# on the environment will be located in 
# /tmp/terraform.env, a file generated
# by terraform.
#
# This script assumes that there is a
# scality user with sudoer rights on 
# all machines used by Federation.
#
# This script sets the stage for running
# the test  (e.g. it parses the environment
# variables set by terraform and prepares
# to run everything as the scality user).
#
# Note that running as root is not desirable
# as for the time being /root is on nfs 
# storage. Every ssh connection made through
# the root user hits the nfs storage 
# ( authorized_keys etc..) 


# ensure that the scality user can use
# the key in the ssh-agent of the root
# user
sudo chown scality:scality $(dirname $SSH_AUTH_SOCK)
sudo chown scality:scality $SSH_AUTH_SOCK

# install federation using the default client template
sudo -E -u scality nohup bash -c " \
         bash /tmp/install-federation.sh \
                  /tmp/env-source \
                  inventory \
                  /tmp/bin/run-once-source-is-installed.sh && \
         unset SSH_AUTH_SOCK && \
         bash /tmp/install-federation.sh \
                  /tmp/env-destination \
                  inventory \
                  /tmp/bin/run-once-destination-is-installed.sh"

exit 0 
