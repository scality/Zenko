#!/bin/sh

set -e

USER=${USER:-root}

if [ "${SSH_PRIVATE_KEY}" ]; then
    echo -n "${SSH_PRIVATE_KEY}" > "${USER}/.ssh/id_rsa"
    chmod 600 "${USER}/.ssh/id_rsa"
fi

if [ "${SSH_CONFIG}" ]; then
    echo -n "${SSH_CONFIG}" > "${USER}/.ssh/config"
    chmod 600 "${USER}/.ssh/config"
fi

exec "$@"