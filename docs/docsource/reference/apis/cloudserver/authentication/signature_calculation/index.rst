Signature Calculation
=====================

Authentication information sent in a request must include a signature, a
256-bit string expressed as 64 lowercase hexadecimal characters. For
example:

.. code::

   fe5f80f77d5fa3beca038a248ff027d0445342fe2855ddc963176630326f1024

The signature is calculated from selected elements of a request, so it
will vary from request to request.

For both V2 Authentication and V4 Authentication, the first step in
calculating a signature is the concatenation of select request elements
to form a string (referred to as the StringToSign). Thereafter, the
process for producing the signature differs, depending on the
authentication method in use.

.. toctree::
   :maxdepth: 2

   v2_authorization_signatures
   v4_authorization_signatures
