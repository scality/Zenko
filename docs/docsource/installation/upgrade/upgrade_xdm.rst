.. _Upgrade XDM:

Upgrade XDM
===========

#. Install the new ISO:
   
   .. parsed-literal::
      
      curl -u '$CREDS' https://eve.devsca.com/github/scality/zenko/artifacts/builds/github:scality:zenko:staging-|version|.r210210230152.7c4bbdc.pre-merge.00015938/zenko-|version|.iso -o zenko-|version|.iso

#. Import the ISO:

   .. parsed-literal::
      
      /srv/scality/metalk8s-2.6.0/solutions.sh import --archive /home/centos/zenko-|version|.iso

#. Activate the ISO:

   .. parsed-literal::
      
      /srv/scality/metalk8s-2.6.0/solutions.sh activate --name zenko --version |version|

#. Add the ISO into the namespace:

   .. parsed-literal::
      
      /srv/scality/metalk8s-2.6.0/solutions.sh add-solution --name zenko --solution zenko --version |version|
