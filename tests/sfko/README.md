# SFKO

```
usage: sfko [-h] [-c] [-w]

I am become death, destoyer of clusters.

optional arguments:
  -h, --help        show this help message and exit
  -c, --controller  Start sfko in controller mode
  -w, --worker      Start sfko in worker mode

If no options are provided sfko will start in standalone mode
```


# Testing model

SFKO implements a randomized testing strategy. Test configuration is loosely defined in `Scenarios` and specifics are chosen at random during runtime.

### Scenarios

`Scenarios` consist of a list of `tests` and `checks` to execute along with options defining required resources.

Simple `Scenario`

```yaml
- name: Write 0B
    required:
      buckets: 1
    objects:
      size: 0B
    tests:
      - put
    checks:
      - check-backend
```

`Scenarios` with all the bells and whistles

```
- name: Replicate 10M
    required:
      buckets:
        - replication:
            - *AWS
            - *GCP
          clouds:
            - *AWS
    objects:
      count: 10000
      size: 10M
    tests:
      - put-replication
    checks:
      - check-replication-mpu
```

#### Scenario options

```
- name: Example Scenario
    required:
      buckets: 1 # buckets can be a integer sepcify the number of buckets to create
      buckets:   # buckets can be a list with each element specify a bucket
      	- replication: True # replication can be set as a boolean
        - replication:		# or a list specify possible backend clouds
            - *AWS
            - *GCP
          clouds:			# clouds specifies a list of backends to be used for created buckets
            - *AWS
```

### Tests and Checks

Functions that either drive the cluster or check behavior are split into two groups: `Tests` and `Checks`.


### Anatomy of a `Test` or `Check`

At its root a `Test` or `Check` is simply a function that returns `True/False` based on success.
```python
@register_test('put')
def put_objects(bucket, objs):
    for obj, data in objs:
        obj.upload_fileobj(data)
    return True

```

```python
@register_check('check-backend')
def check_backend(bucket_conf, objs):
	if that_op_worked():
    	return True
    return False
```

New `Tests` and `Checks` can be registered with the decorators `register_test` and `register_check` respectively. When called each check is pass two objects: a `Bucket` and `ObjectProxy` instance. These describe the generated bucket and objects chosen for this test.

A `Bucket` instance has the following attributes:

```
name		# Name of bucket
backend		# Instance of Backend, describes chosen bucket backend
replication # Instance of Backend, describes chosen replication target
trasient	# bool whether transient source is enabled
expiration	# bool whether lifecycle expiration is enabled
versioning 	# bool whether versioning is enabled
clouds		# List of cloud constants describing possible backend choices
client		# A high level boto3 Bucket client
```
A `Backend` has the following attributes

```
name	# Human friendly name for this backend
type	# A constant describing this backends type
bucket	# The cloudside bucket for this backend
```

A `ObjectProxy` has the following attributes

```
objects		# An iterator yielding a boto3 Object, and a open file descriptor of content
raw			# An iterator yielding a bucket name, key name, and file size
client		# A low level boto3 client
resource	# A high level boto3 resource
```
