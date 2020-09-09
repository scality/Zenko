.. _AuthV4 Signature:

AuthV4 Signature
================

Verifies a request's signature using the v4 procedure for the specified
string to sign, access key, region, and scope date.

Method and Path
---------------

.. code::

  GET /

Request Parameters
------------------

.. tabularcolumns:: lLLll
.. table::
   :widths: auto

   +----------------------+-------------+-------------+-------------+-------------+
   | Name                 | Description | Type        | Default     | Value       |
   +======================+=============+=============+=============+=============+
   | Action               | Action to   | string      |             | 'AuthV4'    |
   |                      | execute     |             |             |             |
   +----------------------+-------------+-------------+-------------+-------------+
   | stringToSign         | String      | string      |             |             |
   |                      | build from  |             |             |             |
   |                      | request     |             |             |             |
   +----------------------+-------------+-------------+-------------+-------------+
   | signatureFromRequest | Signature   | string      |             |             |
   |                      | provided by |             |             |             |
   |                      | the request |             |             |             |
   +----------------------+-------------+-------------+-------------+-------------+
   | accessKey            | Access key  | string      |             |             |
   |                      | who perform |             |             |             |
   |                      | the request |             |             |             |
   +----------------------+-------------+-------------+-------------+-------------+
   | region               | Region      | string      |             |             |
   +----------------------+-------------+-------------+-------------+-------------+
   | scopeDate            | Date of the | string ISO  |             |             |
   |                      | request     | 8601        |             |             |
   |                      |             | format,     |             |             |
   |                      |             | YYYYMMDDTHH |             |             |
   |                      |             | MMSSZ       |             |             |
   +----------------------+-------------+-------------+-------------+-------------+

Refer to http://docs.aws.amazon.com/general/latest/gr/sigv4_signing.html

Output Format
-------------

.. code::

   Response upon success if accessKey belongs to an account: {
       arn: string // the arn associated to the account,
       canonicalID: string // the canonical id associated to the account,
       shortid: string // the short id associated to the account,
       email: string // the email address associated to the account,
       accountDisplayName: string // the display name associated to the account
   }
   Response upon success if accessKey belongs to a user: {
       arn: string // the arn associated to the user,
       canonicalID: string // the canonical id associated to the parent account,
       shortid: string // the short id associated to the parent account,
       email: string // the email address associated to the account,
       accountDisplayName: string // the display name associated to the parent account,
       IAMdisplayName: string // the display name associated to the user
   }

Success Code
------------

.. tabularcolumns:: ll
.. table::
   :widths: auto

   +------+---------+
   | Code | Message |
   +======+=========+
   | 200  | OK      |
   +------+---------+

Error Codes
-----------

.. tabularcolumns:: ll
.. table::
   :widths: auto

   +------+-----------------------+
   | Code | Message               |
   +======+=======================+
   | 400  | InvalidArgument       |
   +------+-----------------------+
   | 403  | InvalidAccessKeyId    |
   +------+-----------------------+
   | 403  | SignatureDoesNotMatch |
   +------+-----------------------+
   | 500  | ServiceFailure        |
   +------+-----------------------+
