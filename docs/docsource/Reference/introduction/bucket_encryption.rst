Bucket Encryption
=================

Slightly different from AWS SSE, other than Zenko bucket creation bucket
encryption is transparent to the application. Buckets are created with a
special x-amz-scal-server-side-encryption header (value: AES256) that
specifies that the Bucket’s objects be encrypted, and thereafter there
is no need to change any Object PUT or GET calls in the application as
the encrypt/decrypt behavior will simply occur (encrypt on PUT, decrypt
on GET). In contrast, AWS SSE is quite intrusive, as it requires special
headers on all Object create calls, including Object Put, Object Copy,
Object Post, and Multi Part Upload requests.

Zenko bucket encryption is similar to SSE-C in how it integrates with the Key
Management Service (KMS). Scality requires that customers provide the
KMS, which is responsible for generating encryption keys on PUT calls
and for retrieving the same encryption key on GET calls. In this manner,
Zenko does not store encryption keys.

Also, Zenko uses standard OpenSSL, 256-bit encryption libraries to perform the
actual payload encryption/decryption. This also supports the Intel
AES-NI CPU acceleration library, making encryption nearly as fast as
non-encrypted performance.
