# coding: utf-8
"""Custom code for LaTeX."""


from pygments.formatters.latex import LatexFormatter

class Formatter(LatexFormatter):
    """Custom LaTeX formatter to customize the font size in verbatim env."""
    def __init__(self, **options):
        super(Formatter, self).__init__(**options)
        self.verboptions = r"formatcom=\scriptsize"

