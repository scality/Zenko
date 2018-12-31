# coding: utf-8
"""Helpers to get basic resources (covers, fonts, …)"""


import glob
import os
import string

import scaldoc.paths as paths


def get_cover(name):
    """Return the absolute path to the specified cover (RING, S3C, …)."""
    return os.path.join(paths.SHARED_STATIC, '{0}_cover.png'.format(name))

def get_footer_logo():
    """Return the absolute path to the footer logo."""
    return os.path.join(paths.SHARED_STATIC, 'footer_logo.png')

def get_fonts():
    """Return a list of paths to font files to load."""
    return glob.glob(os.path.join(paths.SHARED_FONTS, '*', '*.ttf'))

def get_latex_preamble(cover, logo, title, title_voffset, version, copyright):
    """Return the content of the LaTeX preamble.

    Args:
        cover         (str): path to the cover image
        logo          (str): path to the logo image
        title         (str): document title
        title_voffset (str): vertical offset of the title on the cover page
        version       (str): document version
        copyright     (str): document copyright
    """
    with open(os.path.join(paths.SHARED_TEMPLATES, 'preamble.tex'), 'r') as fp:
        preamble = string.Template(fp.read())
    return preamble.substitute(
        cover=cover,
        logo=logo,
        title=title,
        title_voffset=title_voffset,
        version=version,
        copyright=copyright
    )

