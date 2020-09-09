V2 Authorization Signatures
===========================

V2 Authorization uses the sha1 encryption algorithm along with an
account secret key to encrypt a StringToSign, which results in the
signature. The request contains the signature and the elements used to
build the StringToSign. The server receiving the request takes the
element from the request and builds the StringToSign itself. It then
pulls the account secret key from Vault (based on the accessKey in the
request) and calculates the signature. If the two signatures match, the
requester has the correct secretKey and the request is authorized.

.. note::

   V2 POST and GET requests are not supported.
