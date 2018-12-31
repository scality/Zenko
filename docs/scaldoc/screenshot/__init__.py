# -*- coding: utf-8 -*-
#
# Sphinx configuration for screenshot code-block
#
from pygments.lexer import RegexLexer, bygroups
from pygments.token import *

Color = Token.Color
Black = Color.Black
Red = Color.Red
Green = Color.Green
Yellow = Color.Yellow
Blue = Color.Blue
Magenta = Color.Magenta
Cyan = Color.Cyan
White = Color.White
Invert = Color.Invert_bgb
Invert = Color.Invert_bgw

COLOR_TOKENS = {
    Color.Invert_bgb: 'inv_b',
    Color.Invert_bgw: 'inv_w',

    Color.Black: 'black',
    Color.Red: 'red',
    Color.Green: 'green',
    Color.Yellow: 'yellow',
    Color.Blue: 'blue',
    Color.Magenta: 'magenta',
    Color.Cyan: 'cyan',
    Color.White: 'white',

    Color.BrightBlack: 'bright_black',
    Color.BrightRed: 'bright_red',
    Color.BrightGreen: 'bright_green',
    Color.BrightYellow: 'bright_yellow',
    Color.BrightBlue: 'bright_blue',
    Color.BrightMagenta: 'bright_magenta',
    Color.BrightCyan: 'bright_cyan',
    Color.BrightWhite: 'bright_white',
}

STANDARD_TYPES.update(COLOR_TOKENS)


class ScreenshotLexer(RegexLexer):
    name = 'SCCREENSHOT'
    aliases = ['screenshot', 'screenshot_w']
    filenames = ['*.txt']

    tokens = {
        'root': [
            # (r'(<red>)(.*?)(</red>)', bygroups(None, Color.Red, None)),
            (r'.+?', Text),
        ]
    }
    for cls, str in COLOR_TOKENS.items():
        tokens['root'].insert(
            0, (
                r'(<{0}>)(.*?)(</{0}>)'.format(str),
                bygroups(None, cls, None))
        )

import sphinx.highlighting

# sphinx.highlighting.lexers['screenshot'] = sphinx.highlighting.lexers['none']
sphinx.highlighting.lexers['screenshot'] = ScreenshotLexer()
sphinx.highlighting.lexers['screenshot_w'] = sphinx.highlighting.lexers['screenshot']
