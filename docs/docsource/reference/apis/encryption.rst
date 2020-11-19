.. _Encryption:

Encryption
==========

|product|'s encryption scheme is architected around bucket-level encryption. This
reflects a design bias toward wholesale operations such as bucket- and
site-level replication and away from object-level operations.

Bucket Encryption
-----------------

Slightly different from AWS SSE, |product| bucket encryption (except for bucket
creation) is transparent to the application. Buckets are created with a special
``x-amz-scal-server-side-encryption`` header (value: ``AES256``), which
specifies that the bucket’s objects shall be encrypted, with no need thereafter
to change any Object PUT or GET calls in the application, because encryption and
decryption are automatic (encrypt on PUT, decrypt on GET). AWS SSE is
comparatively intrusive, requiring special headers on all Object Create calls,
including Object Put, Object Copy, Object Post, and Multi-Part Upload requests.

|product|'s Key Management Service (KMS) integration for bucket encryption is
similar to that of SSE-C. Scality requires that customers provide the KMS, which
is responsible for generating encryption keys on PUT calls and for retrieving
the same encryption key on GET calls. This architecture ensures that |product| does
not store encryption keys. Currently, |product| is integrated with one KMS solution,
Gemalto SafeNet KeySecure.

|product| uses standard OpenSSL, 256-bit encryption libraries to perform the
payload encryption/decryption. This also supports the Intel AES-NI CPU
acceleration library, making encrypted performance nearly as fast as
non-encrypted performance.

Object Encryption
-----------------

As of version 1.2.1, |product| is modified to accept object encryption headers.
Object-level encryption is not supported; however, |product| no longer throws an
error when it encounters object-level encryption headers, provided bucket-level
encryption is enabled and the correct protocol is used. Objects and buckets may
or may not be encrypted, but under no circumstances does |product| allow an object
with an unsupported cryptographic protocol pass as safely encrypted, either to
an unencrypted bucket, or using an unsupported encryption protocol at the bucket
or object level.

If |product| encounters an object-level encryption header and bucket-level
encryption is not set for the buckets transferring or replicating the object, S3
Connector responds with a ``400: InvalidArgument`` error.

Likewise, if |product| encounters an encryption header 
(``x-amz-server-side-encryption`` or ``x-amz-scal-server-side-encryption``) with
a value other than ``AES256``, it returns ``400: InvalidArgument``.
