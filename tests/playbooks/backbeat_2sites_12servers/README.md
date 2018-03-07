# Overview

This directory holds the test for backbeat.

Backbeat requires two federation environments
one acting as the source that syncs on
the destination. 

# Structure

At runtime, this directory contains transient 
terraform files. This directory provides:

 * `script.sh` the HOMER entry point executed as the root
    it defers most of it work to bin/tester.sh a script
    that runs with nohup as the scality user
 * `bin` a directory contains scripts that essentially sets
    the stage for the test suite (`functional.py`)
 * `env-source` a directory containing the environment files
    required by Federation to run the backbeat source
 * `env-destination` a directory containing the environment files 
    required by Federation to run the backbeat destination

# Timeline

 1. The source environment is installed (through Federation).
 2. The destination environment is installed (through Federation).
 3. Federation is run again on the source environment so that the 
    Federation source is aware of the destination remote endpoints.
 4. Finally the test code is executed.

# Dealing with test results

See the [basic test stateless environment](https://github.com/scality/HOMER/blob/master/basic_test_stateless/README.md)

