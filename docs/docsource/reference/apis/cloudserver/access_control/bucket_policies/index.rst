Bucket Policy
=============

Bucket policies let owners inscribe highly specific or powerfully general access
controls to buckets and the objects they contain. By default, external accounts
are denied access to buckets. A bucket policy, set as a JSON file attached to
the bucket, can permit or deny specified accounts or users access to the bucket,
to all objects in the bucket, or to individual objects in the bucket, and can
permit or deny specific actions on specified buckets or objects.

Policies consist of four elements: an action, an effect, a resource, and a principal.

- The *action* is the API being permitted or blocked. This can either take the
  form of a specific API for access/denial (``"Action": ["s3:CreateBucket"]``) or
  a wildcard assertion (``"Action": "s3:*"``) which enables/disables access either
  to an entire bucket (for bucket API calls) or to objects in a bucket (for
  object API calls).

- The *effect* is the condition placed on the action and principal: either
  "Allow" or "Deny" It is expressed simply as: ``"Effect": "Allow"`` or
  ``"Effect": "Deny"``.

- The *resource* is the bucket or object to which access is being granted or
  denied. Resources are formatted in the policy as follows:

   .. tabularcolumns:: ll
   .. table::
  
      +----------+-----------------------------------------------------+
      | Resource | ARN                                                 |
      | Type     |                                                     |
      +==========+=====================================================+
      | bucket   | ``arn:aws:s3:::${BucketName}``                      |
      +----------+-----------------------------------------------------+
      | object   | ``arn:aws:s3:::${BucketName}/${ObjectName}``        |
      +----------+-----------------------------------------------------+

- The *principal* is defined by the account ID, account ARN, user ARN, or
  canonical ID of the user or entity being permitted or denied access. The basic
  format of a principal is ``"Principal": {"AWS": ["123456789012"]}``, but many
  options are available, the syntax for which exceeds the scope of this
  documentation. Zenko follows the conventions for principals documented at
  https://docs.aws.amazon.com/IAM/latest/UserGuide/reference_policies_elements_principal.html,
  but does not recognize federated users, IAM roles, or service roles.

The easiest method for creating bucket policies is to use the Amazon 
policy generator at https://awspolicygen.s3.amazonaws.com/policygen.html.

You can set, review, and clear bucket policies using these API calls: 

- :ref:`PUT Bucket policy`
- :ref:`GET Bucket policy`
- :ref:`DELETE Bucket policy`
