#!/usr/bin/env bash

# This script is responsible for installing packages needed for Federation
# It is exepcted that it is running on a RHEL based distro

set -ex -o pipefail

MKCERT_VERSION=1.4.4
BUILDKIT_VERSION=0.10.6
CNI_PLUGINS_VERSION=1.1.1

SCRIPT_USER="$(whoami)"

start_group() {
    if [ -n "$GITHUB_ACTIONS" ]; then
        printf '::group::%s\n' "$1"
    else
        printf '=> %s\n' "$1"
    fi
}

end_group() {
    if [ -n "$GITHUB_ACTIONS" ]; then
        printf '::end_group::\n'
    fi
}

disable_selinux() {
    sudo setenforce 0
}

install_rpm() {
    sudo yum reinstall -y "$@" || sudo yum install -y "$@"

}

install_epel() {
    start_group "Install epel"
    install_rpm https://dl.fedoraproject.org/pub/epel/epel-release-latest-8.noarch.rpm
    end_group
}

install_nodejs() {
    start_group "Install nodejs"
    # Setup NodeSource rpm repo
    install_rpm https://rpm.nodesource.com/pub_16.x/el/8/x86_64/nodesource-release-el8-1.noarch.rpm
    # yum will try to install Node.js from the AppStream repository instead of the NodeSource repository.
    # The AppStream's version of Node.js has to be disabled.
    sudo yum module disable -y nodejs
    # make sure yum-config-manager is available
    sudo yum install -y yum-utils
    # Setup yarn repo
    sudo yum-config-manager --add-repo https://dl.yarnpkg.com/rpm/yarn.repo
    sudo yum install -y nodejs yarn
    end_group
}

install_mkcert() {
    start_group "Install mkcert"
    sudo wget -O /usr/bin/mkcert "https://github.com/FiloSottile/mkcert/releases/download/v$MKCERT_VERSION/mkcert-v$MKCERT_VERSION-linux-amd64"
    sudo chmod +x /usr/bin/mkcert
    end_group
}

upgrade_pip() {
    start_group "Upgrade pip"
    sudo python3 -m pip install -U wheel
    sudo python3 -m pip install -U setuptools
    sudo python3 -m pip install -U pip
    end_group
}

install_ansible() {
    start_group "Install ansible"
    sudo python3 -m pip install -U 'ansible==2.9.27'
    sudo python3 -m pip install -U 'docker-py==1.10.6'
    sudo python3 -m pip install -U 'jinja2>=2.10'
    end_group
}

create_scality_user() {
    start_group "Create scality user"
    # create scality user if it doesn't exist
    sudo useradd -u 11042 scality || echo 'scality user already exists'
    echo "scality:secretpassword" | sudo chpasswd;
    echo "scality ALL=(ALL) NOPASSWD: ALL" | sudo tee /etc/sudoers.d/scality
    end_group
}

setup_ssh_access() {
    start_group "Setup ssh access for ansible"
    sudo mkdir -p ~root/.ssh
    sudo mkdir -p ~scality/.ssh
    sudo mkdir -p ~/.ssh

    # Generate ssh key for script user and root, don't overwrite if key exists
    yes n | ssh-keygen -t ed25519 -C "actions" -f ~/.ssh/id_ed25519 -q -N "" || echo 'key already exists'
    yes n | sudo ssh-keygen -t rsa -N "" -f ~root/.ssh/id_rsa || echo 'key already exists'

    ls ~/.ssh

    # Add the generated key to authorized keys
    cat ~/.ssh/id_ed25519.pub ~root/.ssh/id_rsa.pub | sudo tee ~scality/.ssh/authorized_keys;

    printf 'StrictHostKeyChecking no\n' >> ~/.ssh/config
    sudo chmod 600 ~/.ssh/config
    sudo chmod 600 ~/.ssh/authorized_keys
    sudo chmod 700 ~/.ssh

    printf 'StrictHostKeyChecking no\n' | sudo tee -a ~scality/.ssh/config
    sudo chmod 600 ~scality/.ssh/config
    sudo chmod 600 ~scality/.ssh/authorized_keys
    sudo chmod 700 ~scality/.ssh

    # Fix ownership
    sudo chown -R "$SCRIPT_USER:$SCRIPT_USER" ~/.ssh/
    sudo chown -R "scality:scality" ~scality/.ssh/
    end_group
}

create_data_directories() {
    sudo mkdir -p /tmp/artifacts/data
    sudo mkdir -p /tmp/artifacts/logs
}

cleanup_apt_link() {
    # remove link created by tmate action
    # messes up ansible package manager detection
    sudo rm -rf /usr/bin/apt-get
}

remove_audit() {
    start_group "Remove audit package"
    sudo yum autoremove -y audit
    end_group
}

install_buildkit() {
    start_group "Install buildkit"
    wget -O /tmp/buildkit.tar.gz "https://github.com/moby/buildkit/releases/download/v$BUILDKIT_VERSION/buildkit-v$BUILDKIT_VERSION.linux-amd64.tar.gz"
    sudo tar -C /usr -xvzf /tmp/buildkit.tar.gz
    sudo tee /etc/systemd/system/buildkit.service <<EOF
[Unit]
Description=BuildKit
Documentation=https://github.com/moby/buildkit

[Service]
ExecStart=/usr/bin/buildkitd
Restart=on-failure

[Install]
WantedBy=multi-user.target
EOF

    sudo systemctl daemon-reload
    sudo systemctl enable buildkit
    sudo systemctl start buildkit
    end_group
}

install_cni_plugins() {
    start_group "Install CNI plugins"
    sudo mkdir -p /opt/cni/bin
    sudo mkdir -p /etc/cni/net.d
    wget -O /tmp/cni-plugins.tgz "https://github.com/containernetworking/plugins/releases/download/v$CNI_PLUGINS_VERSION/cni-plugins-linux-amd64-v$CNI_PLUGINS_VERSION.tgz"
    sudo tar -C /opt/cni/bin -xvzf /tmp/cni-plugins.tgz
    sudo tee /etc/cni/net.d/10-containerd-net.conflist <<EOF
{
    "cniVersion": "1.0.0",
    "name": "containerd-net",
    "plugins": [
        {
            "type": "bridge",
            "bridge": "cni0",
            "isGateway": true,
            "ipMasq": true,
            "promiscMode": true,
            "ipam": {
                "type": "host-local",
                "ranges": [
                    [{
                    "subnet": "10.117.0.0/16"
                    }]
                ],
                "routes": [
                    { "dst": "0.0.0.0/0" },
                    { "dst": "::/0" }
                ]
            }
        },
        {
            "type": "portmap",
            "capabilities": {"portMappings": true}
        }
    ]
}
EOF
    end_group
}

disable_selinux
install_epel
install_nodejs
install_mkcert
upgrade_pip
install_ansible
create_scality_user
setup_ssh_access
create_data_directories
cleanup_apt_link
remove_audit
install_buildkit
install_cni_plugins
