
###################
Re-Installing Zenko
###################

If you are installing Zenko on a fresh cluster, the instructions provided in
the `Installation Guide <./installation_guide.html>`_ are sufficient. If, however,
you are reinstalling Zenko on an existing cluster (while assessing or testing
Zenko, for example), you must perform the following additional step.

Destroy All Volumes
+++++++++++++++++++
Any Kubernetes cluster deloyed for Zenko must have a logical volume associated
with each node. If you reinstall Zenko onto a prior installation's node
structure, these existing volumes will prevent successful deployment.

Before reinstalling Zenko, destroy all volumes in the cluster. Do not reuse the
existing volumes.

Diagnostic
----------

A Scality engineer used the following diagnostic to determine the source of
this issue:

::

  (metal-k8s) [scality@sup-cluster1 metal-k8s]$ for i in 0 1 2 3 4; do kubectl exec -ti zenko-zenko-quorum-${i} -c zookeeper cat /var/lib/zookeeper/data/myid; done
  1
  1
  2
  5
  5

Note the duplicated IDs.

Error Condition
---------------

In reviewing this error, the same tester found the following error condition
in the zenko-quorum logs.

::

  2018-07-04 01:01:11,359 [myid:2] - INFO  [WorkerSender[myid=2]:QuorumPeer$QuorumServer@167] - Resolved hostname: zenko-zenko-quorum-2.zenko-zenko-quorum-headless.default.svc.cluster.local to address: zenko-zenko-quorum-2.zenko-zenko-quorum-headless.default.svc.cluster.local/10.233.123.145
  2018-07-04 01:01:11,359 [myid:2] - INFO  [WorkerReceiver[myid=2]:FastLeaderElection@600] - Notification: 1 (message format version), 2 (n.leader), 0x10000009e (n.zxid), 0x584 (n.round), LOOKING (n.state), 2 (n.sid), 0x1 (n.peerEpoch) LOOKING (my state)
  2018-07-04 01:01:11,360 [myid:2] - WARN  [WorkerSender[myid=2]:QuorumCnxManager@588] - Cannot open channel to 4 at election address zenko-zenko-quorum-3.zenko-zenko-quorum-headless.default.svc.cluster.local/10.233.99.143:3888
  java.net.ConnectException: Connection refused (Connection refused)
        at java.net.PlainSocketImpl.socketConnect(Native Method)
        at java.net.AbstractPlainSocketImpl.doConnect(AbstractPlainSocketImpl.java:350)
        at java.net.AbstractPlainSocketImpl.connectToAddress(AbstractPlainSocketImpl.java:206)
        at java.net.AbstractPlainSocketImpl.connect(AbstractPlainSocketImpl.java:188)
        at java.net.SocksSocketImpl.connect(SocksSocketImpl.java:392)
        at java.net.Socket.connect(Socket.java:589)
        at org.apache.zookeeper.server.quorum.QuorumCnxManager.connectOne(QuorumCnxManager.java:562)
        at org.apache.zookeeper.server.quorum.QuorumCnxManager.toSend(QuorumCnxManager.java:538)
        at org.apache.zookeeper.server.quorum.FastLeaderElection$Messenger$WorkerSender.process(FastLeaderElection.java:452)
        at org.apache.zookeeper.server.quorum.FastLeaderElection$Messenger$WorkerSender.run(FastLeaderElection.java:433)
        at java.lang.Thread.run(Thread.java:748)
  2018-07-04 01:01:11,360 [myid:2] - INFO  [WorkerSender[myid=2]:QuorumPeer$QuorumServer@167] - Resolved hostname: zenko-zenko-quorum-3.zenko-zenko-quorum-headless.default.svc.cluster.local to address: zenko-zenko-quorum-3.zenko-zenko-quorum-headless.default.svc.cluster.local/10.233.99.143
  2018-07-04 01:01:11,360 [myid:2] - INFO  [WorkerSender[myid=2]:QuorumCnxManager@337] - Have smaller server identifier, so dropping the connection: (5, 2)
  2018-07-04 01:01:11,364 [myid:2] - INFO  [WorkerReceiver[myid=2]:FastLeaderElection@600] - Notification: 1 (message format version), 2 (n.leader), 0x10000009e (n.zxid), 0x584 (n.round), LOOKING (n.state), 1 (n.sid), 0x1 (n.peerEpoch) LOOKING (my state)
  2018-07-04 01:01:12,108 [myid:2] - INFO  [NIOServerCxn.Factory:0.0.0.0/0.0.0.0:2181:NIOServerCnxnFactory@192] - Accepted socket connection from /10.233.114.70:45648
  2018-07-04 01:01:12,108 [myid:2] - WARN  [NIOServerCxn.Factory:0.0.0.0/0.0.0.0:2181:NIOServerCnxn@373] - Exception causing close of session 0x0 due to java.io.IOException: ZooKeeperServer not running
  2018-07-04 01:01:12,109 [myid:2] - INFO  [NIOServerCxn.Factory:0.0.0.0/0.0.0.0:2181:NIOServerCnxn@1044] - Closed socket connection for client /10.233.114.70:45648 (no session established for client)
  2018-07-04 01:01:12,712 [myid:2] - INFO  [NIOServerCxn.Factory:0.0.0.0/0.0.0.0:2181:NIOServerCnxnFactory@192] - Accepted socket connection from /10.233.114.70:45656
