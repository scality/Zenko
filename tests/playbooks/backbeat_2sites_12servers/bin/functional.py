# The test suite generates a significant amount
# of headers and the default limit is at 100
# Raising this limit should come first
import httplib  # http.client on Python 3 use http.client instead
httplib._MAXHEADERS = 1000

import ConfigParser
import os
import urllib
import time
import random
import socket
import string
import mimetypes
import pytest
import botocore.session
from botocore.client import Config
from random import shuffle
from random import randint
# Run me with:
# py.test -s -v /tmp/bin/functional.py

#-------------Helpers------------------------------


def randomString(size):
    """
    This function generates a random string
    whose length is given in argument.
    The characters composing the string
    are upper case ascii letters and digits.

    :param size: an integer the length of the string
    :returns: a random string
    """
    return ''.join(random.choice(string.ascii_uppercase + string.digits) for _ in range(size))


def randomUtf8String(length):
    """
    This function generates a random string
    whose length is given in argument.
    The characters composing the string
    are unicode characters.

    :param length: an integer the length of the string
    :returns: a random string
    """
    random_unicodes = [unichr(random.randint(1, 0xD7FF))
                       for _ in xrange(0, length)]
    return u"".join(random_unicodes).encode('UTF-8', 'ignore')


def generateRandomMetadata():
    """
    This function generates a data structure
    that can be fed to boto so random headers
    are added to the data.

    The data structure is a dictionary
    of header / value.

    Header name and values are randomly generated.

    :returns: a dictionary
    """
    result = {}
    size = 0
    while True:
        # the limit of 40 is somewhat random but headers are typically small
        keyLength = randint(1, 40)
        key = randomString(keyLength)
        valueLength = randint(0, 40)
        value = randomString(valueLength)
        # it seems metadata and tags can not be more than 2000 bytes
        # we leave 1000 for tags
        if ((size + valueLength + keyLength) > 1000):
            return result
        else:
            size = size + valueLength + keyLength
            result[key] = value


def generateRandomTagSet():
    """
    This function generates a data structure
    that can be fed to boto so random tags
    are added to the data.

    Tag names and values are randomly generated.
    See
    http://boto3.readthedocs.io/en/latest/reference/services/s3.html#S3.Client.put_object_tagging
    :returns: a list
    """
    result = []
    size = 0
    while True:
        # boto seems to allow only ascii
        keyLength = randint(1, 100)
        key = randomString(keyLength)
        valueLength = randint(0, 100)
        value = randomString(valueLength)
        # it seems	metadata and tags can not be more than 2000 bytes
        # we leave	1000 for metadata
        # in addition we can not have more than 10 tags
        if ((size + valueLength + keyLength) > 1000) or len(result) == 10:
            return result
        else:
            size = size + valueLength + keyLength
            element = {}
            element['Key'] = key
            element['Value'] = value
            result.append(element)


def generateRandomCannedAcls():
    """
    This function picks up a random canned acl.
    :returns: a string
    """
    # our s3 does not support aws-exec-read at the moment
    cannedACLs = ['private', 'public-read',
                  'public-read-write', 'authenticated-read',
                  'bucket-owner-read',
                  'bucket-owner-full-control']
    result = random.choice(cannedACLs)
    return result


def generateRandomCacheControl():
    """
    This function generates a random cache control
    header.
    This function has a bias towards relatively
    complex cache control header (a simple one
    is less likekly to be generated).
    :returns: a string
    """
    result = ''
    sep = ''
    if bool(random.getrandbits(1)):
        if bool(random.getrandbits(1)):
            result = result + sep + 'no-cache'
            sep = ', '
        if bool(random.getrandbits(1)):
            result = result + sep + 'no-store'
            sep = ', '
    else:
        if bool(random.getrandbits(1)):
            result = result + sep + 'max-age=3600'
            sep = ', '
        if bool(random.getrandbits(1)):
            result = result + sep + 's-maxage=3600'
            sep = ', '
        attrs = ['must-revalidate', 'proxy-revalidate', 'public']
        shuffle(attrs)
        for attribute in attrs:
            if bool(random.getrandbits(1)):
                result = result + sep + attribute
                sep = ', '
    return result


def generateRandomContentDisposition():
    """
    This function generates a random content disposition
    header.
    This function has a bias towards relatively
    complex header (a simple one
    is less likekly to be generated).
    :returns: a string
    """
    result = ''
    sep = ''
    i = randint(1, 3)
    if i == 1:
        result = 'inline'
        sep = '; '
    elif i == 2:
        result = 'attachment'
        sep = '; '
    elif i == 3:
        result = 'form-data'
        sep = '; '
        if bool(random.getrandbits(1)):
            result = result + sep + 'name="' + randomString(16) + '"'
            sep = '; '
    if i == 2 or i == 3:
        if bool(random.getrandbits(1)):
            result = result + sep + 'filename="' + randomString(16) + '"'
            sep = '; '
        if bool(random.getrandbits(1)):
            result = result + sep + 'filename*="' + randomString(16) + '"'
            sep = '; '
    return result


def generateRandomContentEncoding():
    """
    This function generates a random content encoding
    header.
    :returns: a string
    """
    encodings = ['gzip', 'compress', 'deflate', 'identity', 'br']
    return random.choice(encodings)


def generateRandomContentType():
    """
    This function generates a random content type
    header.
    :returns: a string
    """
    mimetypes.init()
    listOfMimeTypes = list(mimetypes.MimeTypes().encodings_map.values())
    result = random.choice(listOfMimeTypes)
    return result


def generateRandomContentLanguage():
    """
    This function generates a random content language
    header.
    This function has a very limited range of languages
    and variations.
    :returns: a string
    """
    # subset
    languages = ['ab', 'aa', 'eu', 'zh']
    countries = ['CA', 'FR', 'US']
    result = ''
    sep = ''
    for _ in range(1, randint(1, len(languages))):
        result = result + sep + random.choice(languages)
        sep = ', '
        if bool(random.getrandbits(1)):
            result = result + '-' + random.choice(countries)
    return result


def full_path(path):
    """
    This function expands paths containing tilde
    and tranform them into absolute paths.
    The tilde is used to represent the path of
    the home directory of the current user.
    When the tilde is present, it must be the
    first character.

    :param path: a string containing a relative path potentially containing tildes
    :returns: an absolute path
    """
    someDir = os.path.dirname(path)
    someFile = os.path.basename(path)
    if someDir[0] == '~' and not os.path.exists(someDir):
        someDir = os.path.expanduser(someDir)
    return os.path.abspath(someDir) + '/' + someFile


def getS3Endpoint(machineName):
    """
    This function generates an s3 endpoint
    based on the host name given in argument.
    The endpoint is of the form
    http://<host>:8000 (e.g. the federation
    inventory is not checked).

    :param machineName: a string containing a hostname
    :returns: an URL corresponding to an S3 endpoint
    """
    # location constraints force ip here
    addr = socket.gethostbyname(machineName)
    return "http://" + addr + ":8000"


def getVaultEndpoint(machineName):
    """
    This function generates an iam endpoint
    based on the host name given in argument.
    The endpoint is of the form
    http://<host>:8600 (e.g. the federation
    inventory is not checked)
    :param machineName: a string containing a hostname
    :returns: an URL corresponding to an IAM endpoint
    """
    return "http://" + machineName + ":8600"


def listObjects(client, bucket):
    """
    This function lists all the versions of
    all the objects contained in the bucket
    given in argument using the given S3 boto
    client.
    A list is returned. This list contains
    all the information from the s3 listing but
    not the information relative to who owns
    the bucket. In addition, it contains
    only the objects that have not been
    deleted so far.
    Omitting the owner information
    allows comparing listings from
    different environments by simply
    comparing the lists.
    :param client: a boto S3 client used to perform the listing
    :param bucket: a string containing the name of the bucket
    :returns: a list of objects
    """
    result = []
    paginator = client.get_paginator('list_object_versions')
    pageresponse = paginator.paginate(Bucket=bucket)
    for pageobject in pageresponse:
        if "Versions" in pageobject:
            for obj in pageobject["Versions"]:
                if 'Owner' in obj:
                    obj.pop('Owner', None)
                result.append(obj)
    return result


def listParts(client, bucket, key, uploadId):
    """
    This function lists all parts
    all the objects contained in the mpu
    given in argument using the given S3 boto
    client.
    A list is returned. This list contains objects
    containing the PartNumber and the ETag of
    each part.
    :param client: a boto S3 client used to perform the listing
    :param bucket: a string containing the name of the bucket
    :param key: a string identifying the object that is the target of the mpu
    :param uploadId: a string identifying the on going mpu
    :returns: a list of parts
    """
    parts = []
    paginator = client.get_paginator('list_parts')
    pageresponse = paginator.paginate(
        Bucket=bucket, Key=key, UploadId=uploadId)
    for pageobject in pageresponse:
        if "Parts" in pageobject:
            for obj in pageobject["Parts"]:
                parts.append(
                    {"PartNumber": obj['PartNumber'], "ETag": obj['ETag']})
    return parts


def listDeleteMarkers(client, bucket):
    """
    This function lists all the DeleteMarker (e.g.
    the deleted objects) contained in the bucket
    given in argument using the given S3 boto
    client.
    A list is returned. This list contains
    all the information from the S3 listing but
    not the informtion relative to who owns
    the bucket.
    Omitting the owner information
    allows comparing listings from
    different environments by simply
    comparing the lists.
    :param client: a boto S3 client used to perform the listing
    :param bucket: a string containing the name of the bucket
    :returns: a list of DeleteMarker objects
    """
    result = []
    paginator = client.get_paginator('list_object_versions')
    pageresponse = paginator.paginate(Bucket=bucket)
    for pageobject in pageresponse:
        if "DeleteMarkers" in pageobject:
            for obj in pageobject["DeleteMarkers"]:
                if 'Owner' in obj:
                    obj.pop('Owner', None)
                result.append(obj)
    return result


def completeMpu(s3, bucket, key, numberOfParts, partSize, mpu_id, objectCopy=None, randomBetweenPart=3):
    """
    This function performs a multi part upload
    using randomly generated data.  The mpu must
    have been alreay initiated, this gives
    testing functions the opportunity to set up
    content type, metadata etc... The parts
    have a fixed size governed by the partSize
    argument except the last one whose size
    will vary between 1 and the partSize.

    The generated object in S3 contains
    random ASCII data.

    Upon completion of the MPU, the
    ETAG of the object is returned.

    This function will randomly copy a
    part into another part and issue a
    range request if the objectCopy to
    copy data from is provided.

    Some parts will also be randomly
    overwritten.

    An optional objectCopy can also be given.
    This object must exist in the source bucket.
    This object must be bigger than 6 MB.
    When provided this object will be used
    to generate part using copy part.

    An optional integer can also be given.
    This integer reflects the fact that
    the part number does not need to be strictly
    increasing.

    This integer gives the difference between
    two consecutives part numbers. S3 checks
    that the part number is smaller than 10 k
    hence for an upload with lots of parts to
    be set to 0.

    :param client: a boto S3 client used to perform the mpu
    :param bucket: a string containing the name of the bucket
    :param key: a string containing the name of the object to be generated in S3
    :param numberOfParts: an integer containing the number of parts to be generated
    :param partSize: an integer containing the part size in bytes
    :param mpu_id: a string containing an mpuid
    :param objectCopy: a string containing an object to be used to provide data for copy part
    :param randomBetweenPart: an int giving the maximum difference between 2 consecutive part number
    :returns: a string containing the ETAG of the generatd object
    """
    parts = []
    i = 1
    # this is used to randomize the part number
    accumulator = randint(0,  randomBetweenPart)
    if(objectCopy is not None):
        copy = s3.head_object(Bucket=bucket,
                              Key=objectCopy)
        copyLength = copy['ContentLength']
    partNumber = 0
    # the condition in the below while is a bit contrived:
    # for large MPU : the number of parts (i.e. the PartNumber) can not exceed 10 000
    # it is not legit to complete an mpu with no part
    while (i < numberOfParts and partNumber < numberOfParts) or (len(parts) == 0):
            # this is a little optimization - try to reuse some random data
            # using upload_part_copy has also helped to spot bugs
        if objectCopy is not None and bool(random.getrandbits(1)):
            # the value of 6000000 reflects the fact that is
            # theory a part should not be less than 5 MB
            # (unless it is the last one)
            rangeIndexStart = randint(0, int(copyLength) - 6000000)
            rangeIndexEnd = randint(rangeIndexStart + 6000000, int(copyLength))
            range = str(rangeIndexStart) + '-' + str(rangeIndexEnd)
            partNumber = i + accumulator
            part = s3.upload_part_copy(
                Bucket=bucket,
                Key=key,
                UploadId=mpu_id,
                PartNumber=partNumber,
                CopySource=(bucket + '/' + objectCopy),
                CopySourceRange=range)
            etag = part['CopyPartResult']['ETag']
        else:
            # randomString is much faster than randomUtf8String
            if i == numberOfParts:
                data = randomString(randint(1, partSize))
            else:
                data = randomString(partSize)
            partNumber = i + accumulator
            part = s3.upload_part(Body=data, Bucket=bucket,
                                  Key=key, UploadId=mpu_id, PartNumber=partNumber)
            etag = part["ETag"]
        # randomly choose to overwrite or skip the part
        # note: this test does not check whether backbeat replicates
        # the sproxyd orphans resulting from overwriting or not using
        # a part.
        # Manual test on Aug 29th release 7.1: backbeat does not
        # replicate sproxyd orphans
        if bool(random.getrandbits(1)):
            # we keep the part
            parts.append({"PartNumber": partNumber, "ETag": etag})
            i += 1
            accumulator = randint(0,  randomBetweenPart) + accumulator
    # do a listing of the parts and check that
    # the parts we are going to upload are ok
    # this is to ease debugging/investigation as
    # boto tends to report that there are missing/lost
    # parts even when there is none
    listedParts = listParts(s3, bucket, key, mpu_id)
    for somePart in parts:
        try:
            i = listedParts.index(somePart)
        except:
            print("failed to find part")
            print(somePart)
            print("the test is very likely to fail")
    result = s3.complete_multipart_upload(
        Bucket=bucket,
        Key=key,
        UploadId=mpu_id,
        MultipartUpload={"Parts": parts})
    return result['Key']


def mpu(s3, bucket, key, numberOfParts, partSize, objectCopy=None, randomBetweenPart=3):
    """
    This function performs a multi part upload
    using randomly generated data. The parts
    have a fixed size governed by the partSize
    argument except the last one whose size
    will vary between 1 and the partSize.

    The generated object in S3 contains
    random ASCII data.

    An optional objectCopy can also be given.
    This object must exist in the source bucket.
    This object must be bigger than 6 MB.
    When provided this object will be used
    to generate part using copy part.

    An optional integer can also be given.
    This integer reflects the fact that
    the part number does not need to be strictly
    increasing.
    This integer gives the difference between
    two consecutives part numbers. S3 checks
    that the part number is smaller than 10 k
    hence for an upload with lots of parts to
    be set to 0.

    Upon completion of the MPU, the
    ETAG of the object is returned.

    :param client: a boto S3 client used to perform the mpu
    :param bucket: a string containing the name of the bucket
    :param key: a string containing the name of the object to be generated in S3
    :param numberOfParts: an integer containing the number of parts to be generated
    :param partSize: an integer containing the part size in bytes
    :param objectCopy: a string containing an object to be used to provide data for copy part
    :param randomBetweenPart: an int giving the maximum difference between 2 consecutive part number
    :returns: a string containing the ETAG of the generatd object
    """
    mpu = s3.create_multipart_upload(Bucket=bucket, Key=key)
    mpu_id = mpu["UploadId"]
    return completeMpu(s3, bucket, key, numberOfParts, partSize, mpu_id, objectCopy, randomBetweenPart)

#--------------------------------------------------

# this is used to represent either the source or
# the destination env


class Federation:
    def __init__(self, pathToS3cfgConfigFile, machineName, bucket):
          """
        This creates a new Federation object using the
        access and secret key contained in the s3cfg file
        given in first argument and running the tests in the
        bucket given in third argumentn sending traffic to the
        hostname given in second argument.
        The bucket is supposed to exist.
        This object acts as a bag containing various information
        on how to use the env:
        - access_key contains a valid access key on that env
        - secret_key contains a valid secret key on that env
        - s3endpoint contains the url of an s3 endpoint
        - vaultendpoint contains the url of a vaul endpoint
        - bucket contains a bucket name to work on
        - s3 contains a boto S3 client
        - iam contains a boto IAM client
        :param pathToS3cfgConfigFile: a string containing a path to an s3cfg file
        :param bucket: a string containing a bucket name
        """
        self.machineName = machineName
        configParser = ConfigParser.RawConfigParser()
        configParser.read(full_path(pathToS3cfgConfigFile))
        self.access_key = configParser.get('default', 'access_key')
        self.secret_key = configParser.get('default', 'secret_key')
        self.s3endpoint = getS3Endpoint(machineName)
        self.vaultendpoint = getVaultEndpoint(machineName)
        self.bucket = bucket
        # for the increased timeout see
        # https://scality.atlassian.net/browse/S3C-840
        self.s3 = botocore.session.get_session().create_client(
            's3',
            aws_access_key_id=self.access_key,
            aws_secret_access_key=self.secret_key,
            endpoint_url=self.s3endpoint,
            use_ssl=False,
            verify=False,
            region_name='us-east-1',
            config=Config(read_timeout=300, s3={'addressing_style': 'path'})
        )
        self.iam = botocore.session.get_session().create_client(
            'iam',
            aws_access_key_id=self.access_key,
            aws_secret_access_key=self.secret_key,
            endpoint_url=self.vaultendpoint,
            use_ssl=False,
            verify=False,
            region_name='us-east-1'
        )

    def __str__(self):
          """
        This function returns a string representating the Federation oject.
        :returns: string representating the Federation object
        """
        return "Federation object machineName=" + self.machineName + \
               " access_key=" + self.access_key + \
               " s3 endpoint=" + self.s3endpoint + \
               " vault endpoint=" + self.vaultendpoint + \
               " using bucket=" + self.bucket

class Checker:
    def __init__(self, sourceFederation, destinationFederation):
            """
        Creates a checker object that agregates two Federation objects.
        One of them is the source federation env. The other one is the 
        destination federation env.  
        It provides methods to check that the two Federation env
        exposes the same data.
        :param sourceFederation: a Federation object corresponding to the source env
        :param destinationFederation: a Federation object corresponding to the destination env
        """
        self.source = sourceFederation
        self.destination = destinationFederation

    def checkObject(self, key, version):
        """
        This function checks that the given object version is the
        same on both the source and the destination.
        Binary objects are not supported.
        :param key: the name of the object to be checked
        :param version: the version of the object to be checked
        :returns: True if the object matches on the source and on the destination, False otherwise
        """
        sourceObject = self.source.s3.get_object(
            Bucket=self.source.bucket, Key=key, VersionId=version)
        # check metadata
        if not(sourceObject['ReplicationStatus'] == 'COMPLETED'):
            # boto doc says COMPLETE but S3 docs say COMPLETED
            print("replication status for object=" + key +
                  " is not COMPLETED but [" + sourceObject['ReplicationStatus'] + "]")
            return False
        destinationObject = self.destination.s3.get_object(
            Bucket=self.destination.bucket, Key=key, VersionId=version)
        if not(destinationObject['ReplicationStatus'] == 'REPLICA'):
            print("replication status for object=" + key + " is not REPLICA")
            return False
        checked = ['LastModified', 'ContentLength', 'ETag', 'CacheControl', 'ContentDisposition', 'ContentEncoding', 'ContentLanguage',
                   'Expires', 'ContentType', 'WebsiteRedirectLocation', 'Metadata', 'ServerSideEncryption', 'SSECustomerAlgorithm',
                   'SSECustomerKeyMD5', 'SSEKMSKeyId', 'PartsCount', 'TagCount']
        for attribute in checked:
            if attribute in sourceObject and attribute in destinationObject:
                if not(sourceObject[attribute] == destinationObject[attribute]):
                    print("attribute " + attribute +
                          " for object=" + key + " is not the same")
                    return False
            else:
                if (attribute in sourceObject and not(attribute in destinationObject)) or \
                   (not (attribute in sourceObject) and attribute in destinationObject):
                    print("attribute " + attribute +
                          " for object=" + key + " is not the same")
                    return False
        # The below will probably break with binary objects
        # This is relatively naive anyway
        sourceBody = sourceObject["Body"].read()
        destinationBody = destinationObject["Body"].read()
        if not (sourceBody == destinationBody):
            print("Bodies for object=" + key + " are not the same")
            return False
        # check ACL - Owner are always different in our setup
        sourceACLs = self.source.s3.get_object_acl(
            Bucket=self.source.bucket, Key=key, VersionId=version)['Grants']
        destinationACLs = self.destination.s3.get_object_acl(
            Bucket=self.destination.bucket, Key=key, VersionId=version)['Grants']
        if len(sourceACLs) != len(destinationACLs):
            print("The number of grants for object=" + key + " are not the same")
            return False
        # analyse the Grant based on URI
        for sourceGrant in sourceACLs:
            if 'URI' in sourceGrant['Grantee']:
                foundDestinationGrant = None
                for destinationGrant in destinationACLs:
                    if 'URI' in destinationGrant['Grantee'] and \
                            sourceGrant['Grantee']['URI'] == destinationGrant['Grantee']['URI'] and \
                            sourceGrant['Permission'] == destinationGrant['Permission']:
                        foundDestinationGrant = destinationGrant
                if foundDestinationGrant is None:
                    print("Grant " + sourceGrant +
                          " has no equivalent in destination for key=" + key)
                    return False
        # check tags
        sourceTags = self.source.s3.get_object_tagging(
            Bucket=self.source.bucket, Key=key, VersionId=version)["TagSet"]
        destinationTags = self.destination.s3.get_object_tagging(
            Bucket=self.destination.bucket, Key=key, VersionId=version)["TagSet"]
        if not (len(sourceTags) == len(destinationTags)):
            print("Tags for object=" + key + " are not the same")
            return False
        sourceTags.sort()
        destinationTags.sort()
        if not (sourceTags == destinationTags):
            print("Tags for object=" + key + " are not the same")
            return False
        return True

    def check(self):    
        """
        This function checks that the contents
        buckets on the destination and on the source
        match.
        :returns: True is everything match, False otherwise
        """
        # check versions of existing objects
        sourceObjects = listObjects(self.source.s3, self.source.bucket)
        sourceObjects.sort()
        destinationObjects = listObjects(
            self.destination.s3, self.destination.bucket)
        destinationObjects.sort()
        if not (sourceObjects == destinationObjects):
            print(self.source.bucket + " and " + self.destination.bucket +
                  " contains a different number/listing of objects/versions")
            return False
        result = True
        for obj in sourceObjects:
            if not(self.checkObject(obj['Key'], obj['VersionId'])):
                result = False
        # check delete markers
        sourceMarkers = listDeleteMarkers(self.source.s3, self.source.bucket)
        sourceMarkers.sort()
        destinationMarkers = listDeleteMarkers(
            self.destination.s3, self.destination.bucket)
        destinationMarkers.sort()
        if not (sourceMarkers == destinationMarkers):
            print(self.source.bucket + " and " + self.destination.bucket +
                  " contains a different number/listing of DeleteMarkers")
            result = False
        return result


class DelayedChecker:

    def __init__(self, sourceFederation, destinationFederation):
        """
        This class behaves like Checker but it acknowledges
        the fact that the replication in backbeat is asynchronous.
        Creates a checker object that agregates two Federation objects.
        One of them is the source federation env. The other one is the
        destination federation env.
        It provides methods to check that the two Federation env
        exposes the same data.
        :param sourceFederation: a Federation object corresponding to the source env
        :param destinationFederation: a Federation object corresponding to the destination env    
        """
        self.checker = Checker(sourceFederation, destinationFederation)

    def check(self):
        """
        This function checks that the contents
        buckets on the destination and on the source
        match.
        :returns: True is everything match, False otherwise
        """
        # most of the time backbeat will propagate the change in near realtime
        # if this is not the case, we give it a bit of slack time before finally
        # giving up
        duration = 10
        for _ in range(1, 5):
            time.sleep(duration)
            result = self.checker.check()
            if result:
                return result
            duration = duration * 3
            print("check failed - sleep for " +
                  str(duration) + " s before retrying")
        return False


@pytest.fixture
def env(request):
    # seeding the random number generator makes the tests deterministic
    random.seed(a=0)
    s3cfg_source = request.config.getoption("--s3cfg-source")
    s3cfg_destination = request.config.getoption("--s3cfg-destination")
    machine_source = request.config.getoption("--machine-source")
    machine_destination = request.config.getoption("--machine-destination")
    bucket_source = request.config.getoption("--bucket-source")
    bucket_destination = request.config.getoption("--bucket-destination")
    env.source = Federation(s3cfg_source, machine_source, bucket_source)
    env.destination = Federation(
        s3cfg_destination, machine_destination, bucket_destination)
    env.checker = DelayedChecker(env.source, env.destination)
    env.sample_size = int(request.config.getoption("--sample-size"))
    # the object name size can be a problem
    # see https://scality.atlassian.net/projects/S3C/issues/S3C-837
    env.object_name_size = int(request.config.getoption("--object-name-size"))
    env.non_mpu_body_size = int(
        request.config.getoption("--non-mpu-object-body-size"))
    # it should not be less than 5 MB
    # unless MPU_TESTING=yes is passed to s3
    env.mpu_part_size = int(request.config.getoption(
        "--mpu-part-size-mb")) * int(1e6)
    # we create a "large" object that can be used as a source for upload_part_copy
    env.largeObj = 'large' + randomString(randint(1, env.object_name_size))
    mpu(s3=env.source.s3,
        bucket=env.source.bucket,
        key=env.largeObj,
        numberOfParts=4,
        partSize=env.mpu_part_size)
    return env


class Tests:

    def test_simple_put(self, env):
        """
        This is a simple test where some objects are written
        in the source environment. It checks that backbeat
        replicates these objects on the remote environment.
        Object names and body are randomly generated.
        The objet name is an ascii string.
        """
        for _ in range(0, env.sample_size):
            objectName = randomString(randint(1, env.object_name_size))
            data = randomUtf8String(randint(1, env.non_mpu_body_size))
            env.source.s3.put_object(
                Key=objectName, Body=data, Bucket=env.source.bucket)
        assert env.checker.check()

    def test_simple_delete(self, env):
        """
        This is a simple test where some objects are written
        and then deleted in the source environment. It checks 
        that backbeat replicates these objects on the remote environment.
        Object names and body are randomly generated.
        The net effect is to generate a tons of delete markers
        that should be replicated on the remote env.
        """
        for _ in range(0, env.sample_size):
            objectName = randomString(randint(1, env.object_name_size))
            data = randomUtf8String(randint(1, env.non_mpu_body_size))
            env.source.s3.put_object(
                Key=objectName, Body=data, Bucket=env.source.bucket)
            env.source.s3.delete_object(
                Key=objectName, Bucket=env.source.bucket)
        assert env.checker.check()

    def test_overwrite(self, env):
        """
        This is a simple test where some objects are overwritten
        in the source environment. It checks
        that backbeat replicates these objects on the remote environment.
        Object names and body are randomly generated.
        The net effect is to create a tons of versions for these objects.
        Each version should be replicated properly on the remote site.
        """
        for _ in range(0, env.sample_size):
            objectName = randomString(randint(1, env.object_name_size))
            for _ in range(0, randint(1, 40)):
                data = randomUtf8String(randint(1, env.non_mpu_body_size))
                env.source.s3.put_object(
                    Key=objectName, Body=data, Bucket=env.source.bucket)
        assert env.checker.check()

    def test_overwrite_and_delete(self, env):
        """
        This is a simple test where some objects are overwritten
        or deleted in the source environment. It checks
        that backbeat replicates these objects on the remote environment.
        Object names and body are randomly generated.
        The net effect is to create a tons of versions for these objects.
        Each version / delete marker should be replicated properly on the remote site.
        """
        for _ in range(0, env.sample_size):
            objectName = randomString(randint(1, env.object_name_size))
            for _ in range(0, randint(1, 40)):
                if random.choice([True, False]):
                    data = randomUtf8String(randint(1, env.non_mpu_body_size))
                    env.source.s3.put_object(
                        Key=objectName, Body=data, Bucket=env.source.bucket)
                else:
                    env.source.s3.delete_object(
                        Key=objectName, Bucket=env.source.bucket)
        assert env.checker.check()

    def test_put_with_metadata_and_tags(self, env):
        """
        This is a simple test where some objects are created.
        These objects contain metadata header and other tags It checks
        that backbeat replicates these objects on the remote environment.
        The test focuses on checking that the object metadata
        and tags are properly replicated on the remote site.
        """
        for _ in range(0, env.sample_size):
            objectName = randomString(randint(1, env.object_name_size))
            data = randomUtf8String(randint(1, env.non_mpu_body_size))
            metadata = generateRandomMetadata()
            env.source.s3.put_object(Key=objectName,
                                     Body=data,
                                     CacheControl=generateRandomCacheControl(),
                                     ContentDisposition=generateRandomContentDisposition(),
                                     ContentEncoding=generateRandomContentEncoding(),
                                     ContentLanguage=generateRandomContentLanguage(),
                                     ContentType=generateRandomContentType(),
                                     Metadata=metadata,
                                     Bucket=env.source.bucket)
            tags = {'TagSet': generateRandomTagSet()}
            env.source.s3.put_object_tagging(Key=objectName,
                                             Bucket=env.source.bucket,
                                             Tagging=tags)
        assert env.checker.check()

    def test_canned_acl(self, env):
        """
        This is a simple test where some objects are created.
        These objects contain metadata header and other tags It checks
        that backbeat replicates these objects on the remote environment.
        In addition canned acls are attached to these objects.
        The test focuses on checking that the ACLs are properly 
        replicated. 
        Note: we do now replicate iam information, hence 
        replication of ACLs is limited to canned ACLs at 
        the moment.
        """
        for _ in range(0, env.sample_size):
            objectName = randomString(randint(1, env.object_name_size))
            data = randomUtf8String(randint(1, env.non_mpu_body_size))
            metadata = generateRandomMetadata()
            env.source.s3.put_object(Key=objectName,
                                     Body=data,
                                     CacheControl=generateRandomCacheControl(),
                                     ContentDisposition=generateRandomContentDisposition(),
                                     ContentEncoding=generateRandomContentEncoding(),
                                     ContentLanguage=generateRandomContentLanguage(),
                                     ContentType=generateRandomContentType(),
                                     Metadata=metadata,
                                     Bucket=env.source.bucket)
            tags = {'TagSet': generateRandomTagSet()}
            env.source.s3.put_object_tagging(Key=objectName,
                                             Bucket=env.source.bucket,
                                             Tagging=tags)
            env.source.s3.put_object_acl(Key=objectName,
                                         ACL=generateRandomCannedAcls(),
                                         Bucket=env.source.bucket)
        assert env.checker.check()

    def test_small_mpu(self, env):
        """
        This is a simple test where one object is uploaded
        in mpu. This object has 1 part. It checks that backbeat
        replicates this object on the remote environment.
        The object name and the mpu part contents are randomly generated.
        The objet name is an ascii string.
        """
        mpu(s3=env.source.s3,
            bucket=env.source.bucket,
            key=randomString(randint(1, env.object_name_size)),
            numberOfParts=2,
            partSize=env.mpu_part_size,
            objectCopy=env.largeObj)
        assert env.checker.check()

    def test_large_mpu(self, env):
        """
        This is a simple test where one object is uploaded
        in mpu. This object has some parts. It checks that backbeat
        replicates this object on the remote environment.
        The object name and the mpu part contents are randomly generated.
        The objet name is an ascii string.
        """
        mpu(s3=env.source.s3,
            bucket=env.source.bucket,
            key=randomString(randint(1, env.object_name_size)),
            numberOfParts=env.sample_size,
            partSize=env.mpu_part_size,
            objectCopy=env.largeObj)
        assert env.checker.check()

    def test_mpu_with_10k_parts(self, env):
        """
        This is a simple test where one object is uploaded
        in mpu. This object has 10 k parts. It checks that backbeat
        replicates this object on the remote environment.
        The object name and the mpu part contents are randomly generated.
        The objet name is an ascii string.
        """
        mpu(s3=env.source.s3,
            bucket=env.source.bucket,
            key=randomString(randint(1, env.object_name_size)),
            numberOfParts=9999,
            partSize=1,
            objectCopy=None,
            randomBetweenPart=0)
        assert env.checker.check()

    def test_mpus(self, env):
        """
        This is a test where some objects are uploaded
        in mpu. The object have a variable number of parts. 
        It checks that backbeat
        replicates these objects on the remote environment.
        The object names and the mpu part contents are randomly generated.
        The objet names are ascii strings. 
        Some parts are generated as range requests with copy part.
        """
        for _ in range(0, env.sample_size):
            mpu(s3=env.source.s3,
                bucket=env.source.bucket,
                key=randomString(randint(1, env.object_name_size)),
                numberOfParts=randint(1, env.sample_size),
                partSize=env.mpu_part_size,
                objectCopy=env.largeObj)
        assert env.checker.check()

    def test_mpu_with_metadata_and_tags_and_canned_acls(self, env):
        """
        This is a test where some objects are uploaded
        in mpu. The object have a variable number of parts.
        These objects have some random metadata and tags attached
        to them. It checks that backbeat
        replicates these objects on the remote environment.
        The object names and the mpu part contents are randomly generated.
        The object names are ascii strings.
        Some parts are generated as range requests with copy part.
        """
        for _ in range(0, env.sample_size):
            objectName = randomString(randint(1, env.object_name_size))
            metadata = generateRandomMetadata()
            put = env.source.s3.create_multipart_upload(Bucket=env.source.bucket,
                                                        Key=objectName,
                                                        CacheControl=generateRandomCacheControl(),
                                                        ContentDisposition=generateRandomContentDisposition(),
                                                        ContentEncoding=generateRandomContentEncoding(),
                                                        ContentLanguage=generateRandomContentLanguage(),
                                                        ContentType=generateRandomContentType(),
                                                        Metadata=metadata)
            completeMpu(s3=env.source.s3,
                        bucket=env.source.bucket,
                        key=objectName,
                        numberOfParts=randint(1, env.sample_size),
                        partSize=env.mpu_part_size,
                        mpu_id=put["UploadId"],
                        objectCopy=env.largeObj)
            tags = {'TagSet': generateRandomTagSet()}
            env.source.s3.put_object_tagging(Key=objectName,
                                             Bucket=env.source.bucket,
                                             Tagging=tags)
            env.source.s3.put_object_acl(Key=objectName,
                                         ACL=generateRandomCannedAcls(),
                                         Bucket=env.source.bucket)
        assert env.checker.check()

    def test_simple_put_utf8(self, env):
        """
        This is a simple test where some objects are written
        in the source environment. It checks that backbeat
        replicates these objects on the remote environment.
        Object names and body are randomly generated.
        The object name is an UTF8 string.
        """
        for _ in range(0, env.sample_size):
            objectName = urllib.quote(randomUtf8String(
                randint(1, env.object_name_size)))
            data = randomUtf8String(randint(1, env.non_mpu_body_size))
            env.source.s3.put_object(
                Key=objectName, Body=data, Bucket=env.source.bucket)
        assert env.checker.check()
