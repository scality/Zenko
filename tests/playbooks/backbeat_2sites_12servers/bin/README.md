# Overview

This directory holds the scripts and the test
suite to run the test. 

# File structure

 ## `replication.py` and `templates` and `requirements.txt` 
 
  These files are python scripts (along with templates) 
  that creates bucket  and setup replication between them. 
 
 ## `functional.py` and `conftest.py` 

  These files compose the pytest test suite that tests backbeat.

 ## `run-once-source-is-installed.sh` 

  `run-once-source-is-installed.sh` runs once
   the backbeat source environment has been installed. It sets
   the stage for the second run of Federation that will install
   the destination.


 ## `run-once-destination-is-installed.sh` 

  `run-once-destination-is-installed.sh` runs once
   the backbeat	source environment has been installed. It triggers
   the execution of `tester.sh`

 ## `tester.sh` 

   `tester.sh` coordinates the overall execution of 
    the test code. 

# `replication.py`

Before using the script, it is needed to install the
required dependencies. This can be done with:

```
sudo pip install -r /tmp/bin/requirements.txt
```

replication.py takes the following arguments:
 * `--source_access_key` the source access key to be used
   on the source environment
 * `--source_secret_key` the source secret key to be used
   on the source environment
 * `--source_s3_endoint` an s3 endpoint to be used on the
   source environment
 * `--source_iam_endoint` an IAM endpoint to be used on the
   source environment
 * `--source_bucket_endoint` the bucket to be used on the 
   source environment. If it does not exist it will be
   created
 * `--destination_access_key` the destination access key to be used
   on the destination environment
 * `--destination_secret_key` the destination secret key to be used
   on the destination environment
 * `--destination_s3_endoint` an s3 endpoint to be used on the
   destination environment
 * `--destination_iam_endoint` an IAM endpoint to be used on the
   destination environment
 * `--destination_bucket_endoint` the bucket to be used on the
   destination environment. If it does not exist it will be
   created

All the arguments are mandatory and can not be omitted. 

A typical invocation will look like:

```
replication.py --source_access_key 'PFW10LROZVQ8B0FZ8XCO' --source_secret_key 'ATe+CSJuM7hFwAvhk3JeUZ+Cfc09te+Q7tUOvNZE' \
               --source_s3_endpoint 'http://10.100.172.224:8000' --source_iam_endpoint 'http://10.100.172.224:8600' \
               --source_bucket 'source42' --destination_access_key 'EK4Y73PVLCPPB88I0ES1' \
               --destination_secret_key 'KoU2SpIlqkbshXYyV3/O/jO6VmWkbmnF64o+DbM4' \
               --destination_s3_endpoint 'http://10.100.172.219:8000' \
               --destination_iam_endpoint 'http://10.100.172.219:8600' --destination_bucket 'destination42'
```

# `functional.py`

This is a pytest that sends some traffic through boto
on the source and then checks that the destination
and the source bucket are in sync.

It is required to install the following dependencies
before using:

```
sudo pip install -U pytest boto3
```

A typical invocation will look like:

```
pytest -s -v /tmp/bin/functional.py --s3cfg-source=~/.s3cfg.source \
             --s3cfg-destination=~/.s3cfg.destination --bucket-source source \
             --bucket-destination destination --machine-destination node6 \
             --machine-source node1 --sample-size 100
```

The test suite exposes the following arguments
  * `--s3cfg-source` an s3cfg configuration file of the source environment containing access/secret keys
  * `--s3cfg-destination` an s3cfg configuration file of the destination environment containing access/secret keys
  * `--machine-source` a machine on the source environment to send s3/vault queries - it must be a DNS name
  * `--machine-destination` a machine on the destination environment to send s3/vault queries - it must be a DNS name
  * `--bucket-source` the name of the source bucket to use - it is supposed
      to exist and that replication is setup. (replication is setup by `tester.sh` through `replication.py`). 
  * `--bucket-destination` the name of the destination bucket to use - it is supposed to exist and that replication is setup
  * `--sample-size` the number of objects/operations to be carried out in each test.
  * `--object-name-size` the max size of the object names
  * `--non-mpu-object-body-size` the max size of the data associated with an object that is not uploaded with multi part

# tester.sh

This script creates the access and secret key on the source and the destination environments.

It then sets up replication between the buckets source and destination and runs the test suite.

