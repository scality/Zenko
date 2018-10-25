#!/bin/bash

set -e
set -u

XSLTPROC=$(command -v xsltproc)
INKSCAPE=$(command -v inkscape)

function generate_svg() {
        local kind=$1
        local color=$2
        local color_code=$3

        local src="metalk8s-logo-${kind}.svg"
        local dst="generated/metalk8s-logo-${kind}-${color}.svg"

        ${XSLTPROC} --novalid --stringparam color "${color_code}" color.xsl "${src}" > "${dst}.tmp"
        mv "${dst}.tmp" "${dst}"
}

function generate_png() {
        local kind=$1
        local color=$2
        local width=$3

        local src="generated/metalk8s-logo-${kind}-${color}.svg"
        local dst="generated/metalk8s-logo-${kind}-${color}-${width}.png"

        ${INKSCAPE} -D -e "${dst}.tmp" -w "${width}" -z "${src}"
        mv "${dst}.tmp" "${dst}"
}

function generate_pdf() {
        local kind=$1
        local color=$2

        local src="generated/metalk8s-logo-${kind}-${color}.svg"
        local dst="generated/metalk8s-logo-${kind}-${color}.pdf"

        ${INKSCAPE} -D --export-pdf "${dst}.tmp" --export-pdf-version="1.4" -z "${src}"
        mv "${dst}.tmp" "${dst}"
}

mkdir -p generated/

generate_svg wide white '#FFFFFF'
generate_svg vertical black '#000000'
generate_svg wide black '#000000'

generate_png wide white 200

generate_pdf wide black
