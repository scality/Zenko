V4 Authorization Signatures
===========================

V4 Authorization is similar to V2 Authorization, but uses the SHA-256
encryption algorithm instead of SHA-1. It also uses a varying
combination of request elements to build the StringToSign (including
hashing the payload on a PUT request), and in addition to the secret
key, uses a signing key to create the actual signature.

  |image0|

Upon receiving an authenticated request, S3 Connector re-creates the signature using
the authentication information contained in the request. If the
signatures match, S3 Connector processes the request; otherwise, the request is
rejected.

V4 Authorization signature calculations vary depending on the method
chosen for transferring the request payload. S3 Connector supports payload transfer
in both a single chunk, as well as in multiple chunks.

Transfer Payload in a Single Chunk
----------------------------------

Two calculation options are available for transferring payload in a
single chunk, signed and unsigned.

.. tabularcolumns:: lL
.. table::
   :widths: auto

   +-----------------------------------+-----------------------------------+
   | Calculation Option                | Description                       |
   +===================================+===================================+
   | Signed Payload                    | Optionally compute the entire     |
   |                                   | payload checksum and include it   |
   |                                   | in signature calculation, whihc   |
   |                                   | provides added security but       |
   |                                   | requires that the payload be read |
   |                                   | twice or be buffered in memory.   |
   |                                   |                                   |
   |                                   | For example, in order to upload a |
   |                                   | file, you need to read the file   |
   |                                   | first to compute a payload hash   |
   |                                   | for signature calculation and     |
   |                                   | again for transmission when you   |
   |                                   | create the request. For smaller   |
   |                                   | payloads, this approach might be  |
   |                                   | preferable. However, for large    |
   |                                   | files, reading the file twice can |
   |                                   | be inefficient, so you might want |
   |                                   | to upload data in chunks instead. |
   +-----------------------------------+-----------------------------------+
   | Unsigned Payload                  | To not include payload checksum   |
   |                                   | in signature calculation.         |
   +-----------------------------------+-----------------------------------+

Transfer Payload in Multiple Chunks
-----------------------------------

With a chunked upload, the payload is transferred in chunks, which can
be performed regardless of the payload size. This method circumvents the
need to read the entire payload to calculate the signature. Instead, for
the first chunk, a seed signature is calculated that uses only the
request headers. The second chunk contains the signature for the first
chunk, and each subsequent chunk contains the signature for the chunk
that precedes it. At the end of the upload, a final chunk is sent with 0
bytes of data that contains the signature of the last chunk of the
payload.

When a request is sent, S3 Connector must be informed which of the preceding
options has been chosen for signature calculation, by adding the
x-amz-content-sha256 header with one of the following values:

-  STREAMING-AWS4-HMAC-SHA256-PAYLOAD (if chunked upload options are
   selected).
-  payload checksum (signed payload option), or the literal string for
   the unsigned payload option UNSIGNED-PAYLOAD (if the choice is made
   to upload payload in a single chunk)

Upon receiving the request, S3 Connector recreates the StringToSign using
information in the Authorization header and the date header. It then verifies
with authentication service that the signatures match. The request date can be
specified by using either the HTTP Date or the x-amz-date header. If both
headers are present, x-amz-date takes precedence.

If the signatures match, S3 Connector processes your request; otherwise, the
request fails.

.. |image0| image:: ../../../../images/signing-overview.png
