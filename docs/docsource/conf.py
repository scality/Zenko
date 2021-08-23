# Configuration file for the Sphinx documentation builder.
#
# This file only contains a selection of the most common options. For a
# full list see the documentation:
# http://www.sphinx-doc.org/en/master/config

import os
import pathlib
import sys

from sphinx.highlighting import PygmentsBridge

# -- Path setup --------------------------------------------------------------

# If extensions (or modules to document with autodoc) are in another directory,
# add these directories to sys.path here. If the directory is relative to the
# documentation root, use os.path.abspath to make it absolute, like shown here.
#
# sys.path.insert(0, os.path.abspath('.'))
doc_dir = pathlib.Path(__file__).parent
sys.path.append(os.path.dirname(doc_dir))

import scaldoc.latex
import scaldoc.paths
import scaldoc.resources

# -- Project information -----------------------------------------------------

# REBRAND: Change the following to "Zenko" or "XDM". There is one more switch
# below.

project = 'Zenko'
project_identifier = 'Zenko'
author = 'Scality Technical Publications'
copyright = '2021, Scality, Inc'

# Load VERSION info
VERSION_FILE = (doc_dir / "../../VERSION").resolve()

VERSION_INFO = {
    "VERSION": "",
    "VERSION_SUFFIX": "",
    "VERSION_FULL": "",
}
with VERSION_FILE.open("r", encoding="utf-8") as fp:
    for line in fp:
        name, _, value = line.strip().partition("=")
        var = name.strip()
        if var in VERSION_INFO:
            VERSION_INFO[var] = value.strip('"')


version = "{VERSION}".format(**VERSION_INFO)
# The full version, including alpha/beta/rc tags.
release = "{VERSION}{VERSION_SUFFIX}".format(**VERSION_INFO)

# -- General configuration ---------------------------------------------------

# If your documentation needs a minimal Sphinx version, state it here.
# needs_sphinx = '1.0'

# Add any Sphinx extension module names here, as strings. They can be
# extensions coming with Sphinx (named 'sphinx.ext.*') or your custom
# ones.

# Setting up readthedocs variable to change build behavior
READTHEDOCS = os.environ.get('READTHEDOCS', False) == 'True'

# Adding readthedocs tag to use with only annotations when required.
if READTHEDOCS:
   tags.add('readthedocs')

extensions = [
            'sphinx.ext.todo',
            'sphinx.ext.ifconfig',
            'sphinxcontrib.plantuml',
            'sphinxcontrib.spelling',
            'sphinxcontrib.inkscapeconverter',
	    'sphinx_version_ref',
]

plantuml_output_format = 'svg'
plantuml_latex_output_format = 'pdf'

autosectionlabel_prefix_document = True

# Add any paths that contain templates here, relative to this directory.
templates_path = ['_templates']

# Adding readthedocs templates
if READTHEDOCS:
   templates_path.append('_templates_rtd')
# The suffix(es) of source filenames.
# You can specify multiple suffix as a list of string:

source_suffix = '.rst'

# The master toctree document.

master_doc = 'index'

# The language for content autogenerated by Sphinx. Refer to documentation
# for a list of supported languages.
#
# This is also used if you do content translation via gettext catalogs.
# Usually you set "language" from the command line for these cases.

language = None

# List of patterns, relative to source directory, that match files and
# directories to ignore when looking for source files.
# This pattern also affects html_static_path and html_extra_path.

exclude_patterns = ['_build', 'Thumbs.db', '.DS_Store']

if tags.has('html') or READTHEDOCS:
   master_doc = 'index'
   exclude_patterns.extend(['index_pdf.rst', '*/index_pdf.rst'])
else:
   master_doc = 'index_pdf'
   exclude_patterns.extend(['*/index.rst', 'index.rst', '*/glossary.rst'])

# The name of the Pygments (syntax highlighting) style to use.

pygments_style = 'sphinx'


# -- rst prolog ---------------------------------------------------------

# This section contains text substitution for custom variables and link
# substitution, mostly for MSFT doc links. As we become more complete in our
# documentation, we can replace these with references to our own documentation.

# REBRAND: Change the first definition, "|product|", to "Zenko" or "XDM".
rst_prolog = """

   .. |product| replace:: Zenko
   .. |min_kubernetes| replace:: 1.11.3
   .. |aws_cli_guide| replace:: For usage examples, see `Pagination <https://docs.aws.amazon.com/cli/latest/userguide/pagination.html>`__ in the `AWS Command Line Interface User Guide <https://aws.amazon.com/cli/>`__.
   .. |set-blob-timeouts| replace:: `Setting Timeouts for Blob Service Operations <https://docs.microsoft.com/en-us/rest/api/storageservices/setting-timeouts-for-blob-service-operations>`__
   .. |authorize-requests| replace:: `Authorize requests to Azure Storage <https://docs.microsoft.com/en-us/rest/api/storageservices/authorize-requests-to-azure-storage>`__
   .. |azure-versioning| replace:: `Versioning for the Azure Storage services <https://docs.microsoft.com/en-us/rest/api/storageservices/versioning-for-the-azure-storage-services>`__
   .. |analytics-log| replace:: `Azure Storage Analytics Logging <https://docs.microsoft.com/en-us/azure/storage/common/storage-analytics-logging>`__
   .. |storage-tracking| replace:: `Windows Azure Logging: Using Logs to Track Storage Requests <https://blogs.msdn.microsoft.com/windowsazurestorage/2011/08/02/windows-azure-storage-logging-using-logs-to-track-storage-requests/>`__
   .. |api-troubleshoot| replace:: `Troubleshooting API operations <https://docs.microsoft.com/en-us/rest/api/storageservices/troubleshooting-api-operations>`__
   .. |cors-support| replace:: `Cross-Origin Resource Sharing (CORS) support for Azure Storage <https://docs.microsoft.com/en-us/rest/api/storageservices/cross-origin-resource-sharing--cors--support-for-the-azure-storage-services>`__
   .. |conditional-headers| replace:: `Specifying conditional headers for Blob service operations <https://docs.microsoft.com/en-us/rest/api/storageservices/specifying-conditional-headers-for-blob-service-operations>`__
   .. |create-sas| replace:: `Create a service SAS <https://docs.microsoft.com/en-us/rest/api/storageservices/create-service-sas>`__
   .. |define-access| replace:: `Define a stored access policy <https://docs.microsoft.com/en-us/rest/api/storageservices/define-stored-access-policy>`__
   .. |date-time-headers| replace:: `Representation of date/time values in headers <https://docs.microsoft.com/en-us/rest/api/storageservices/representation-of-date-time-values-in-headers>`__
   .. |geo-redundant| replace:: `Windows Azure Storage Redundancy Options and Read Access Geo Redundant Storage <https://blogs.msdn.microsoft.com/windowsazurestorage/2013/12/11/windows-azure-storage-redundancy-options-and-read-access-geo-redundant-storage/>`__
   .. |list-blob-storage| replace:: `Listing Blob storage resources <https://docs.microsoft.com/en-us/rest/api/storageservices/enumerating-blob-resources>`__
   .. |range-header| replace:: `Specifying the Range Header for Blob Service Operations <https://docs.microsoft.com/en-us/rest/api/storageservices/specifying-the-range-header-for-blob-service-operations>`__
   .. |manage-access| replace:: `Manage anonymous read access to containers and blobs <https://docs.microsoft.com/en-us/azure/storage/blobs/storage-manage-access-to-resources>`__
   .. |scalability-perf| replace:: `Azure Storage scalability and performance targets for storage accounts <https://docs.microsoft.com/en-us/azure/storage/common/storage-scalability-targets>`__ 
   .. |naming-referencing| replace:: `Naming and Referencing Containers, Blobs, and Metadata <https://docs.microsoft.com/en-us/rest/api/storageservices/naming-and-referencing-containers--blobs--and-metadata>`__

"""



# -- Options for HTML output -------------------------------------------------

# The theme to use for HTML and HTML Help pages.  See the
# documentation for a list of builtin themes.

html_theme = 'sphinx_scality'

# Theme options are theme-specific and customize the look and feel of a theme
# further.  For a list of options available for each theme, see the
# documentation.
#
html_theme_options = {
   'social_links': [
      ("linkedin", "https://www.linkedin.com/company/scality/"),
      ("twitter", "https://twitter.com/scality"),
      ("instagram", "https://instagram.com/scalitylife"),
      ("facebook", "https://www.facebook.com/scality/"),
   ],
   'footer_links': [
      ("Support", "https://support.scality.com"),
      ("Knowledge Base", "https://support.scality.com/hc/en-us"),
      ("Training", "https://training.scality.com"),
      ("Privacy Policy", "https://www.scality.com/privacy-policy/"),
   ],
   'kblink': 'https://support.scality.com/hc/en-us',
   # Color link definition
   "sidebarlinkactivecolor": "#763C8E",
   "visitedlink": "#876A93",
   "defaultlink": "#763C8E",
}

# add logo  (your logo goes in _static directory)

# html_logo = '_static/Zenko-Logo-Wide-white-on-sitegray.png'
html_logo = '_static/{}_logo.png'.format(project_identifier)

# Add any paths that contain custom static files (such as style sheets) here,
# relative to this directory. They are copied after the builtin static files,
# so a file named "default.css" will overwrite the builtin "default.css".

html_static_path = ['_static']

html_last_updated_fmt = '%B %d, %Y'

# Extra variables to pass to templates

html_context = {
    'project_identifier': project_identifier,
}

# Custom sidebar templates must be a dictionary that maps document names
# to template names.
#
# The default sidebars (for documents that don't match any pattern) are
# defined by theme itself.  Builtin themes are using these templates by
# default: ``['localtoc.html', 'relations.html', 'sourcelink.html',
# 'searchbox.html']``.
#

# html_sidebars = {
#     '**': ['globaltoc.html', 'relations.html', 'searchbox.html'],
# }

html_show_sphinx = False
html_show_source = False

# -- Options for HTMLHelp output ---------------------------------------------

# Output file base name for HTML help builder.

htmlhelp_basename = 'Zenko'


# -- Options for LaTeX output ------------------------------------------------

latex_engine = 'xelatex'

latex_contents = r"""
    \thispagestyle{empty}
    \clearpage
    \sphinxtableofcontents
    \setcounter{page}{1}
"""

latex_logo = scaldoc.resources.get_footer_logo()
latex_cover = scaldoc.resources.get_cover('Zenko')

latex_title = ''
if tags.has('install'):
     latex_title = 'Installation'
elif tags.has('operation'):
     latex_title = 'Operation'
elif tags.has('reference'):
     latex_title = 'Reference'

latex_elements = {
     'extraclassoptions': 'openany,oneside',

    # The paper size ('letterpaper' or 'a4paper').
    #
     'papersize': 'letterpaper',

    # The font size ('10pt', '11pt' or '12pt').
    #
     'pointsize': '11pt',

    # Additional stuff for the LaTeX preamble.
    'preamble': scaldoc.resources.get_latex_preamble(
        cover=os.path.basename(latex_cover),
        logo=os.path.basename(latex_logo),
        title=latex_title,
        title_voffset='85pt',
        version=release,
        copyright=copyright
     ),

   'tableofcontents': latex_contents,
   
    # Latex figure (float) alignment
    #
    # 'figure_align': 'htbp',
}

latex_additional_files = [
   latex_logo,
   latex_cover,
   os.path.join(scaldoc.paths.SHARED_INCLUDES, 'legal_notice.txt'),
]
latex_additional_files.extend(scaldoc.resources.get_fonts())

# Grouping the document tree into LaTeX files. List of tuples
# (source start file, target name, title,
#  author, documentclass [howto, manual, or own class]).

if tags.has('install'):
   latex_documents = [(
      'installation/index_pdf',
      'Zenko_Installation.tex',
      'Zenko Installation',
      'Scality Technical Publications',
      'manual'
   )]
elif tags.has('operation'):
   latex_documents = [(
      'operation/index_pdf',
      'Zenko_Operation.tex',
      'Zenko Operation',
      'Scality Technical Publications',
      'manual'
   )]
elif tags.has('reference'):
   latex_documents = [(
      'reference/index_pdf',
      'Zenko_Reference.tex',
      'Zenko Reference',
      'Scality Technical Publications',
      'manual'
   )]

# Override the default formatter with our custom one.

PygmentsBridge.latex_formatter = scaldoc.latex.Formatter
 
def setup(app):
     app.add_stylesheet('custom.css')
     app.add_stylesheet('screenshot.css')
# REBRAND: Change the middle term of the next tuple to "XDM" or "Zenko".
# This swaps XDM/Zenko images.
     app.add_config_value('product', 'Zenko', 'env')


