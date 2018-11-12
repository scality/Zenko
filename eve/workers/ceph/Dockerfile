FROM ceph/daemon

ENV CEPH_DAEMON demo
ENV CEPH_DEMO_DAEMONS mon,mgr,osd,rgw

ENV CEPH_DEMO_UID zenko
ENV CEPH_DEMO_ACCESS_KEY accessKey1
ENV CEPH_DEMO_SECRET_KEY verySecretKey1
ENV CEPH_DEMO_BUCKET zenkobucket

# ENV RGW_NAME=zenko-ceph-ceph-in-a-box
ENV CEPH_PUBLIC_NETWORK 0.0.0.0/0
ENV MON_IP 0.0.0.0
ENV NETWORK_AUTO_DETECT 0
ENV RGW_CIVETWEB_PORT 8001

ADD ./entrypoint-wrapper.sh /
RUN chmod +x /entrypoint-wrapper.sh && \
    rm /etc/yum.repos.d/python-rtslib.repo && \
    yum install -y python-pip && \
    yum clean all && \
    pip install awscli && \
    rm -rf /root/.cache/pip && \
    mkdir /artifacts

ENTRYPOINT [ "/entrypoint-wrapper.sh" ]
