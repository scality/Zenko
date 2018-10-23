from .register import register_test
from .util.redis import enqueue_replication

# Anatomy of a test function
# Arguements:
#   bucket - a boto3 obj.scenario.Bucket instance representing the target zenko bucket
#   objs - A iterable yielding objects to be PUT/GET/etc to the passed bucket
# Return: True/False
#   True - operations successfully completed
#   False - Unrecoverable error happended during operation



@register_test('put')
def put_objects(bucket, objs):
    for obj, data in objs:
        obj.upload_fileobj(data)
    return True

@register_test('get')
def get_objects(bucket, objs):
    pass

@register_test('put-mpu', objects=dict(size='100M'))
def put_mpu(bucket, objs):
    for obj, data in objs:
        obj.upload_fileobj(data)
    return True

@register_test('put-multibucket')
def put_multibucket(bucket, objs):
    pass

@register_test('put-replication')
def put_replication(bucket, objs):
    for obj, data in objs:
        enqueue_replication(obj.bucket_name, obj.key, bucket.replication.type.friendly())
        obj.upload_fileobj(data)
    return True
