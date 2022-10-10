#!/usr/bin/env python

import os
import sys

template_file_name = "bakalari-extension-template.user.js"
userscript_file_name = "bakalari-extension.user.js"
userscript_folder_name = "dist-userscript"

os.system("mkdir -p dist-userscript")

if (not os.path.exists(userscript_file_name)):
    os.system(f"cp userscript/{template_file_name} {userscript_folder_name}/{userscript_file_name}")

with open(f'{userscript_folder_name}/{userscript_file_name}') as f:
    lines = f.read()


def replace(lines, name, directory="", find="", replace=""):
    if (lines.find(name) != -1 and lines.find(name) == lines.rfind(name)):
        with open(f'dist/{directory}{name[2:]}') as f:
            lines2 = f.read()

        if (find == ""):
            return lines.replace(name, lines2)
        else:
            return lines.replace(name, lines2.replace(find, replace))
    else:
        sys.exit(f'"{name}" was not found or found more than once')


lines = replace(lines, "//content_script.js", "js/", "chrome.i18n.getUILanguage()", "language2")

lines = replace(lines, "//content_script_2.js", "js/")

lines = replace(lines, "//content.css")


with open(f'{userscript_folder_name}/{userscript_file_name}', 'w') as f:
    f.write(lines)
