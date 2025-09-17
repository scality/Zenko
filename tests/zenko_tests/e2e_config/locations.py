#!/usr/bin/env python

from boto3 import Session
import logging
import os

_log = logging.getLogger("end2end configuration")

IAM_ENDPOINT = os.getenv("IAM_ENDPOINT", "http://iam.zenko.local")
CRR_ROLE_NAME = os.getenv("CRR_ROLE_NAME", "crr-role")

def _setup_crr_iam_resources(account_creds):
    """
    Sets up a CRR site by creating the user, role and policy.
    :param account_creds: credentials of the crr site account
    :return: accessKey and secretKey of the created crr user
    """
    try:
        iam_client = Session(
            aws_access_key_id=account_creds["AccessKeyId"],
            aws_secret_access_key=account_creds["SecretAccessKey"],
            aws_session_token=account_creds["SessionToken"],
        ).client('iam', endpoint_url=IAM_ENDPOINT, region_name='us-east-1')

        user = iam_client.create_user(UserName="crr-user")
        credentials = iam_client.create_access_key(UserName="crr-user")

        iam_client.create_role(
            RoleName=CRR_ROLE_NAME,
            AssumeRolePolicyDocument='''{
                "Version": "2012-10-17",
                "Statement": [
                    {
                        "Effect": "Allow",
                        "Principal": {
                            "AWS": "''' + user["User"]["Arn"] + '''"
                        },
                        "Action": "sts:AssumeRole"
                    }
                ]
            }'''
        )

        policy = iam_client.create_policy(
            PolicyName="crr-policy",
            PolicyDocument='''{
                "Version": "2012-10-17",
                "Statement": [
                    {
                        "Effect": "Allow",
                        "Action": "s3:ReplicateObject",
                        "Resource": "arn:aws:s3:::*/*"
                    }
                ]
            }'''
        )

        iam_client.attach_role_policy(
            RoleName=CRR_ROLE_NAME,
            PolicyArn=policy["Policy"]["Arn"]
        )

        return {
            "accessKey": credentials["AccessKey"]["AccessKeyId"],
            "secretKey": credentials["AccessKey"]["SecretAccessKey"],
        }
    except Exception as e:
        raise Exception("Failed to setup CRR site: %s" % e)

def create_location(client, uuid, location, accounts_creds):
    """
    Creates a location
    :param client: swagger client
    :param uuid: zenko instance uuid
    :param location: location details
    :param account_credentials: credentials of the accounts created
    """
    
    ENABLE_RING_TESTS = os.environ['ENABLE_RING_TESTS']
    if ENABLE_RING_TESTS == "false" and location["locationType"] == "location-scality-ring-s3-v1":
        return

    DEPLOY_CRR_LOCATIONS = os.getenv('DEPLOY_CRR_LOCATIONS', 'true')
    if location["locationType"] == "location-scality-crr-v1":
        if DEPLOY_CRR_LOCATIONS == "false":
            return

        account_name = os.environ['CRR_SOURCE_ACCOUNT_NAME']
        if location["name"] == os.environ['CRR_DESTINATION_LOCATION_NAME']:
            account_name = os.environ['CRR_DESTINATION_ACCOUNT_NAME']

        user_creds = _setup_crr_iam_resources(accounts_creds[account_name])
        location["details"]["accessKey"] = user_creds["accessKey"]
        location["details"]["secretKey"] = user_creds["secretKey"]

    try:
        Location_V1 = client.get_model('location-v1')
        if "bootstrapList" not in location["details"]:
            location["details"]["bootstrapList"] = []
        loc = Location_V1(name=location["name"],
                            locationType=location["locationType"],
                            details=location["details"])

        res = (
            client.ui_facing
            .createConfigurationOverlayLocation(location=loc, uuid=uuid)
            .response()
            .result
        )

        _log.info("location %s created", location["name"])
    except Exception as e:
        raise Exception(
            "Failed to create location '%s': %s" % (location["name"], e))
