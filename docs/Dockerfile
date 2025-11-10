FROM docker.io/ubuntu:22.04

RUN export DEBIAN_FRONTEND=noninteractive && \
    apt-get update && \
    apt-get install --no-install-recommends -y \
        curl \
        emacs \
        enchant-2 \
        ghostscript \
        git \
        graphviz \
        inkscape \
        latexmk \
        less \
        make \
        plantuml \
        python3 \
        python3-buildbot-worker \
        python3-pip \
        texlive-font-utils \
        texlive-fonts-extra \
        texlive-fonts-recommended \
        texlive-latex-extra \
        texlive-latex-recommended \
        texlive-luatex \
        texlive-xetex \
        tox \
        xindy \
    && apt-get clean && \
    rm -rf /var/lib/apt/lists/*

# Override plantuml.jar
RUN curl -f -Lo /usr/share/plantuml/plantuml.jar \
    https://github.com/plantuml/plantuml/releases/download/v1.2025.10/plantuml-1.2025.10.jar

WORKDIR /home/zenko/docs
