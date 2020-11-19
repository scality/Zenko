Bucket Encryption
=================

Slightly different from AWS SSE, |product| bucket encryption is transparent to the
application. Buckets are created with a special
``x-amz-scal-server-side-encryption`` header (value: ``AES256``), which
specifies that the bucket's objects be encrypted, and thereafter there is no
need to change any object PUT or GET calls in the application as the
encrypt/decrypt behavior will simply occur (encrypt on PUT, decrypt on GET). In
contrast, AWS SSE can be quite intrusive, as it requires special headers on all
object-create calls, including Object Put, Object Copy, Object Post, and Multi
Part Upload requests.

|product| bucket encryption is similar to SSE-C in its integration with a key
management service (KMS). |product| requires users to provide the KMS, which
generates encryption keys on PUT calls and retrieves the same encryption key on
GET calls. Thus, |product| does not store encryption keys.

|product| also uses standard 256-bit OpenSSL encryption libraries to perform payload
encryption and decryption. This supports the Intel AES-NI CPU acceleration
library, making encryption nearly as fast as non-encrypted performance.
