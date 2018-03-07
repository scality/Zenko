#!/usr/bin/env python
# sudo pip install -r requirements.txt
# ./replication.py --source_access_key 'PFW10LROZVQ8B0FZ8XCO' --source_secret_key 'ATe+CSJuM7hFwAvhk3JeUZ+Cfc09te+Q7tUOvNZE' --source_s3_endpoint 'http://10.100.172.224:8000' --source_iam_endpoint 'http://10.100.172.224:8600' --source_bucket 'source42' --destination_access_key 'EK4Y73PVLCPPB88I0ES1' --destination_secret_key  'KoU2SpIlqkbshXYyV3/O/jO6VmWkbmnF64o+DbM4' --destination_s3_endpoint 'http://10.100.172.219:8000' --destination_iam_endpoint 'http://10.100.172.219:8600' --destination_bucket 'destination42'

# A few imports
import botocore.session
from botocore.client import Config
import json
import argparse
import os
# -------------------------------------------------------------------
# Constants
STATUS = 'Status'
ENABLED = 'Enabled'
POLICY_NAME = 'PolicyName'
ROLE_NAME = 'RoleName'
ARN = 'Arn'
ROLE = 'Role'
BASE_DIR = os.path.dirname(os.path.realpath(__file__))
# ------------------------------------------------------------------
# A few functions


def isVersioningOn(client, bucket):
    """
    Return True if the bucket has versioning enabled, False otherwise
    @type  client: S3
    @param client: A boto s3 client
    @type  b: string
    @param b: the name of the bucket
    @rtype: boolean
    @return: True if the bucket has versioning enabled
    """
    response = client.get_bucket_versioning(Bucket=bucket)
    return ((STATUS in response) and (response[STATUS] == ENABLED))


def getBackbeatRole():
    """
    Return the backbeat role
    @rtype: string
    @return: the policy to be applied
    """
    with open(BASE_DIR + '/templates/role.json') as filein:
        return filein.read()


def getBucketPolicy(sourcebucket, destinationbucket):
    """
    Return a string contain the bucket policy to be applied to set up
    replication
    @type  string: sourcebucket
    @param sourcebucket: The name of the source bucket
    @type  string: destinationbucket
    @param destinationbucket: the name of the destionation
    @rtype: string
    @return: the policy to be applied
    """
    with open(BASE_DIR + '/templates/policy.json') as filein:
        return filein.read().replace('destinationbucket', destinationbucket).replace('sourcebucket', sourcebucket)


def getReplication(sourceArn, destinationArn, destinationbucket):
    """
    Return a string contain the bucket policy to be applied to set up
    replication
    @type  string: sourceArn
    @param sourceArn: the arn of the role on the source
    @type  string: destinationArn
    @param destinationArn: the arn of the role on the destination
    @type  string: destinationbucket
    @param destinationArn: the arn of the role on the destination 
    @rtype: string
    @return: the policy to be applied
    """
    # TO DO should a path relative to the script path
    with open(BASE_DIR + '/templates/replication.json') as filein:
        return filein.read().replace('destinationbucket', destinationbucket).replace('destination_role_arn', destinationArn).replace('source_role_arn', sourceArn)


def doesPolicyExist(client, name, marker='0'):
    """
    Return true if the policy exists, false otherwise
    @type  client: IAM
    @param client: The IAM client to use
    @type  name: string
    @param name: the name of the policy
    @type  marker: string
    @param marker: The IAM policies listing marker
    @rtype: boolean
    @return: True if the policy exists, false otherwise
    """
    res = client.list_policies(Marker=marker)
    for policy in res['Policies']:
        if policy[POLICY_NAME] == name:
            return True
    if res['IsTruncated']:
        return doesPolicyExist(client, name, res['Marker'])
    return False


def getPolicyARN(client, name, marker='0'):
    """
    Return the ARN of the policy
    @type  client: IAM
    @param client: The IAM client to use
    @type  name: string
    @param name: the friendly name of the policy
    @type  marker: string
    @param marker: The IAM policies listing marker
    @rtype: string
    @return: the policy arn
    """
    res = client.list_policies(Marker=marker)
    for policy in res['Policies']:
        if policy[POLICY_NAME] == name:
            return policy[ARN]
    if res['IsTruncated']:
        return getPolicyARN(client, name, res['Marker'])
    raise Exception("No arn found for policy with friendly name " + name)


def doesRoleExist(client, name):
    """
    Return true if the role exists, false otherwise
    @type  client: IAM
    @param client: The IAM client to use
    @type  name: string
    @param name: the name of the role
    @rtype: boolean
    @return: True if the role exists, false otherwise
    """
    try:
        client.get_role(RoleName=name)
        return True
    except botocore.exceptions.ClientError as e:
        return False

# ------------------------------------------------------------------


parser = argparse.ArgumentParser(
    description='Setup replication between two buckets on two Federation deployments')
parser.add_argument("-sak", "--source_access_key", type=str,
                    help="access key for the source bucket", required=True)
parser.add_argument("-ssk", "--source_secret_key", type=str,
                    help="secret key for the source bucket", required=True)
parser.add_argument("-ss3e", "--source_s3_endpoint", type=str,
                    help="s3 endpoint for the source bucket", required=True)
parser.add_argument("-siame", "--source_iam_endpoint", type=str,
                    help="iam endpoint for the source bucket", required=True)
parser.add_argument("-s", "--source_bucket", type=str,
                    help="source bucket name - it will be created if it does not exist", required=True)
parser.add_argument("-dak", "--destination_access_key", type=str,
                    help="access key for the destination bucket", required=True)
parser.add_argument("-dsk", "--destination_secret_key", type=str,
                    help="secret key for the destination bucket", required=True)
parser.add_argument("-ds3e", "--destination_s3_endpoint", type=str,
                    help="s3 endpoint for the destination bucket", required=True)
parser.add_argument("-diame", "--destination_iam_endpoint", type=str,
                    help="iam	endpoint for the destination	bucket", required=True)
parser.add_argument("-d", "--destination_bucket", type=str,
                    help="destination bucket name - it will be created if it does not exist", required=True)
args = parser.parse_args()

source_access_key = args.source_access_key
source_secret_key = args.source_secret_key
source_s3_endpoint = args.source_s3_endpoint
source_iam_endpoint = args.source_iam_endpoint
source_bucket = args.source_bucket
destination_access_key = args.destination_access_key
destination_secret_key = args.destination_secret_key
destination_s3_endpoint = args.destination_s3_endpoint
destination_iam_endpoint = args.destination_iam_endpoint
destination_bucket = args.destination_bucket

boto_s3_source = botocore.session.get_session().create_client(
    's3',
    aws_access_key_id=source_access_key,
    aws_secret_access_key=source_secret_key,
    endpoint_url=source_s3_endpoint,
    use_ssl=False,
    verify=False,
    region_name='us-east-1',
    config=Config(s3={'addressing_style': 'path'})
)

boto_s3_destination = botocore.session.get_session().create_client(
    's3',
    aws_access_key_id=destination_access_key,
    aws_secret_access_key=destination_secret_key,
    endpoint_url=destination_s3_endpoint,
    use_ssl=False,
    verify=False,
    region_name='us-east-1',
    config=Config(s3={'addressing_style': 'path'})
)

boto_iam_source = botocore.session.get_session().create_client(
    'iam',
    aws_access_key_id=source_access_key,
    aws_secret_access_key=source_secret_key,
    endpoint_url=source_iam_endpoint,
    use_ssl=False,
    verify=False,
    region_name='us-east-1'
)

boto_iam_destination = botocore.session.get_session().create_client(
    'iam',
    aws_access_key_id=destination_access_key,
    aws_secret_access_key=destination_secret_key,
    endpoint_url=destination_iam_endpoint,
    use_ssl=False,
    verify=False,
    region_name='us-east-1'
)

# create the source and destination buckets if they
# do not exist
try:
    boto_s3_destination.head_bucket(Bucket=destination_bucket)
except botocore.exceptions.ClientError as e:
    print('Creating bucket ' + destination_bucket)
    boto_s3_destination.create_bucket(Bucket=destination_bucket)

try:
    boto_s3_source.head_bucket(Bucket=source_bucket)
except botocore.exceptions.ClientError as e:
    print('Creating bucket ' + source_bucket)
    boto_s3_source.create_bucket(Bucket=source_bucket)

# enable versioning on the buckets if it is not
# already enabled
if not isVersioningOn(boto_s3_source, source_bucket):
    print('Enabling versioning on ' + source_bucket)
    boto_s3_source.put_bucket_versioning(Bucket=source_bucket,
                                         VersioningConfiguration={STATUS: ENABLED})

if not isVersioningOn(boto_s3_destination, destination_bucket):
    print('Enabling versioning on ' + destination_bucket)
    boto_s3_destination.put_bucket_versioning(Bucket=destination_bucket,
                                              VersioningConfiguration={STATUS: ENABLED})

policy_name = "policy_" + source_bucket + "_" + destination_bucket
policy = getBucketPolicy(source_bucket, destination_bucket)
if not doesPolicyExist(boto_iam_source, policy_name):
    print("Creating policy " + policy_name + " on the source")
    boto_iam_source.create_policy(
        PolicyName=policy_name, PolicyDocument=policy)
if not doesPolicyExist(boto_iam_destination, policy_name):
    print("Creating policy " + policy_name + " on the destination")
    boto_iam_destination.create_policy(
        PolicyName=policy_name, PolicyDocument=policy)

role_name = "Role-" + source_bucket + "-" + destination_bucket
role = getBackbeatRole()
if not doesRoleExist(boto_iam_source, role_name):
    print("Creating role " + role_name + " on the source")
    boto_iam_source.create_role(
        RoleName=role_name, AssumeRolePolicyDocument=role)
if not doesRoleExist(boto_iam_destination, role_name):
    print("Creating role " + role_name + " on the destination")
    boto_iam_destination.create_role(
        RoleName=role_name, AssumeRolePolicyDocument=role)

arn_source = getPolicyARN(boto_iam_source, policy_name)
print("Attaching policy with arn " + arn_source +
      " to role " + role_name + " on source")
boto_iam_source.attach_role_policy(RoleName=role_name, PolicyArn=arn_source)
arn_destination = getPolicyARN(boto_iam_destination, policy_name)
print("Attaching policy with arn " + arn_destination +
      " to role " + role_name + " on destination")
boto_iam_destination.attach_role_policy(
    RoleName=role_name, PolicyArn=arn_destination)

role_arn_source = (boto_iam_source.get_role(RoleName=role_name))[ROLE][ARN]
role_arn_destination = (boto_iam_destination.get_role(
    RoleName=role_name))[ROLE][ARN]
replication = getReplication(
    sourceArn=role_arn_source, destinationArn=role_arn_destination, destinationbucket=destination_bucket)
print("Setting replication on bucket " + source_bucket + " on source")
boto_s3_source.put_bucket_replication(
    Bucket=source_bucket, ReplicationConfiguration=json.loads(replication))
