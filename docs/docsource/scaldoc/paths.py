# coding: utf-8
"""Definitions of some useful paths."""


import os


# Absolute path to this file.
_HERE_DIR = os.path.dirname(os.path.realpath(__file__))
# Absolute path to the root of the repository.
ROOT_DIR = os.path.dirname(_HERE_DIR)
# Absolute path to the static files shared between docs (covers, …).
SHARED_STATIC = os.path.join(ROOT_DIR, 'static')
# Absolute path to the static fonts shared between docs.
SHARED_FONTS = os.path.join(SHARED_STATIC, 'fonts')
# Absolute path to the templates shared between docs (LaTeX preamble, …).
SHARED_TEMPLATES = os.path.join(ROOT_DIR, 'templates')
# Absolute path to the files that can be included into several documents.
SHARED_INCLUDES = os.path.join(ROOT_DIR, 'include')
