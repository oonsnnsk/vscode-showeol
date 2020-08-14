'use strict';
import * as vscode from 'vscode';

var decChars_eol1: DecChars;
var decChars_eol2: DecChars;
var decChars_eof: DecChars;
var decChars_tab: DecChars;
var decChars_zenkaku: DecChars;
var decChars_space: DecChars;

var config = {
    space: {
        enable: true,
        character: "",
        color: ""
    },
    zenkaku: {
        enable: true,
        character: "",
        color: ""
    },
    tab: {
        enable: true,
        character: "",
        color: ""
    },
    eol: {
        enable: true,
        character: {
            lf: "",
            crlf: ""
        },
        color: ""
    },
    eof: {
        enable: true,
        character: "",
        color: ""
    }
};

export function activate(context: vscode.ExtensionContext) {

    var activeEditor = vscode.window.activeTextEditor;
    if (activeEditor) {
        getConfig();
        decorate();
    }

    vscode.window.onDidChangeActiveTextEditor(editor => {
        activeEditor = editor;
        if (editor) {
            getConfig();
            decorate();
        }
    }, null, context.subscriptions);

    vscode.workspace.onDidChangeTextDocument(event => {
        if (activeEditor && event.document === activeEditor.document) {
            decorate();
        }
    }, null, context.subscriptions);

    vscode.workspace.onDidChangeConfiguration(event => {
        getConfig();
        decorate();
    });

    function getConfig() {
        var configuration = vscode.workspace.getConfiguration('showeol');
        config.space.enable = configuration.get<boolean>("space.enable");
        config.space.character = configuration.get<string>("space.character");
        config.space.color = configuration.get<string>("space.color");
        config.zenkaku.enable = configuration.get<boolean>("zenkaku.enable");
        config.zenkaku.character = configuration.get<string>("zenkaku.character");
        config.zenkaku.color = configuration.get<string>("zenkaku.color");
        config.tab.enable = configuration.get<boolean>("tab.enable");
        config.tab.character = configuration.get<string>("tab.character");
        config.tab.color = configuration.get<string>("tab.color");
        config.eol.enable = configuration.get<boolean>("eol.enable");
        config.eol.character.lf = configuration.get<string>("eol.character.lf");
        config.eol.character.crlf = configuration.get<string>("eol.character.crlf");
        config.eol.color = configuration.get<string>("eol.color");
        config.eof.enable = configuration.get<boolean>("eof.enable");
        config.eof.character = configuration.get<string>("eof.character");
        config.eof.color = configuration.get<string>("eof.color");

        initDecorator();
    }

    function initDecorator() {
        var color: any;

        var eol: vscode.EndOfLine;
        var eolMark: string;
        if (activeEditor) {
            eol = activeEditor.document.eol;
        }
        if (eol == vscode.EndOfLine.LF) {
            eolMark = config.eol.character.lf;
        } else {
            eolMark = config.eol.character.crlf;
        }

        decChars_eol1 = new DecChars();
        color = config.eol.color;
        if (color != "" && color.substring(0, 1) != "#") {
            color = new vscode.ThemeColor(color);
        }
        decChars_eol1.decorator = vscode.window.createTextEditorDecorationType({
            'before': {
                'contentText': eolMark,
                'color': color,
                'width': "0px"
            }
        });
        var pattern: string;
        if (eol == vscode.EndOfLine.LF) {
            pattern = '^\n';
            pattern = '\n';
        } else {
            pattern = '^\r';
            pattern = '\r';
        }
        decChars_eol1.regex = new RegExp(pattern, 'gm');

        decChars_eol2 = new DecChars();
        decChars_eol2.decorator = vscode.window.createTextEditorDecorationType({
            'after': {
                'contentText': eolMark,
                'color': color,
                'width': "0px"
            }
        });
        decChars_eol2.regex = new RegExp('.$', 'gm');

        decChars_eof = new DecChars();
        color = config.eof.color;
        if (color != "" && color.substring(0, 1) != "#") {
            color = new vscode.ThemeColor(color);
        }
        decChars_eof.decorator = vscode.window.createTextEditorDecorationType({
            'after': {
                'contentText': config.eof.character,
                'color': color,
                'width': '0px'
            },
            'before': {
                'contentText': config.eof.character,
                'color': color,
                'width': '0px'
            }
        });

        decChars_tab = new DecChars();
        color = config.tab.color;
        if (color != "" && color.substring(0, 1) != "#") {
            color = new vscode.ThemeColor(color);
        }
        decChars_tab.decorator = vscode.window.createTextEditorDecorationType({
            'before': {
                'contentText': config.tab.character,
                'color': color,
                'width': "0px"
            }
        });
        decChars_tab.regex = new RegExp('\t', 'gm');

        decChars_zenkaku = new DecChars();
        color = config.zenkaku.color;
        if (color != "" && color.substring(0, 1) != "#") {
            color = new vscode.ThemeColor(color);
        }
        decChars_zenkaku.decorator = vscode.window.createTextEditorDecorationType({
            'before': {
                'contentText': config.zenkaku.character,
                'color': color,
                'width': "0px"
            }
        });
        decChars_zenkaku.regex = new RegExp(/\u3000/, 'gm');

        decChars_space = new DecChars();
        color = config.space.color;
        if (color != "" && color.substring(0, 1) != "#") {
            color = new vscode.ThemeColor(color);
        }
        decChars_space.decorator = vscode.window.createTextEditorDecorationType({
            'before': {
                'contentText': config.space.character,
                'color': color,
                'width': "0px"
            }
        });
        decChars_space.regex = new RegExp(/\u0020/, 'gm');
    }

    function decorate() {
        var editor = activeEditor;
        if (!activeEditor) {
            return;
        }

        var src = editor.document.getText();

        var match: RegExpExecArray;
        var startPos: vscode.Position;
        var endPos: vscode.Position;
        var range: vscode.Range;

        // EOL
        if (config.eol.enable) {
            decChars_eol1.chars = [];
            while (match = decChars_eol1.regex.exec(src)) {
                startPos = editor.document.positionAt(match.index);
                endPos = editor.document.positionAt(match.index + match[0].length);
                range = new vscode.Range(startPos, endPos);
                decChars_eol1.chars.push(range);
            }
            editor.setDecorations(decChars_eol1.decorator, decChars_eol1.chars);
        }

        // EOF
        if (config.eof.enable) {
            decChars_eof.chars = [];
            var l = src.length;
            startPos = editor.document.positionAt(l);
            endPos = editor.document.positionAt(l + 1);
            range = new vscode.Range(startPos, endPos);
            decChars_eof.chars.push(range);
            editor.setDecorations(decChars_eof.decorator, decChars_eof.chars);
        }

        // Tab
        if (config.tab.enable) {
            decChars_tab.chars = [];
            while (match = decChars_tab.regex.exec(src)) {
                startPos = editor.document.positionAt(match.index);
                endPos = editor.document.positionAt(match.index + match[0].length);
                range = new vscode.Range(startPos, endPos);
                decChars_tab.chars.push(range);
            }
            editor.setDecorations(decChars_tab.decorator, decChars_tab.chars);
        }

        // Zenkaku Space
        if (config.zenkaku.enable) {
            decChars_zenkaku.chars = [];
            while (match = decChars_zenkaku.regex.exec(src)) {
                startPos = editor.document.positionAt(match.index);
                endPos = editor.document.positionAt(match.index + match[0].length);
                range = new vscode.Range(startPos, endPos);
                decChars_zenkaku.chars.push(range);
            }
            editor.setDecorations(decChars_zenkaku.decorator, decChars_zenkaku.chars);
        }

        // Space
        if (config.space.enable) {
            decChars_space.chars = [];
            while (match = decChars_space.regex.exec(src)) {
                startPos = editor.document.positionAt(match.index);
                endPos = editor.document.positionAt(match.index + match[0].length);
                range = new vscode.Range(startPos, endPos);
                decChars_space.chars.push(range);
            }
            editor.setDecorations(decChars_space.decorator, decChars_space.chars);
        }
    }

}

export function deactivate() {
}

class DecChars {
    chars: vscode.Range[];
    decorator: vscode.TextEditorDecorationType;
    regex: RegExp;
}
