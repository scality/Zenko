FROM docker.io/ubuntu:18.04

RUN export DEBIAN_FRONTEND=noninteractive && \
    apt-get update && \
    apt-get install --no-install-recommends -y \
        xindy \
        enchant \
        git \
        graphviz \
        curl \
        latexmk \
        make \
        ghostscript \
        inkscape \
        plantuml \
        python3 \
        python3-buildbot-worker \
        texlive-font-utils \
        python3-pip \
        texlive-fonts-extra \
        texlive-fonts-recommended \
        texlive-latex-extra \
        texlive-luatex \
        texlive-xetex \
        texlive-latex-recommended \
        tox \
	emacs \
	less \
        && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

# Override plantuml.jar
RUN curl -f -Lo /usr/share/plantuml/plantuml.jar \
	https://sourceforge.net/projects/plantuml/files/plantuml.1.2019.9.jar

WORKDIR /home/zenko/docs
