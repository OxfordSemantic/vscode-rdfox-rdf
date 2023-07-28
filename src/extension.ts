import * as vscode from 'vscode';

import * as hoverMapTyped from './hoverMap.json';

const hoverMap: { [key: string]: string } = hoverMapTyped

export function activate(context: vscode.ExtensionContext) {
    vscode.languages.registerHoverProvider('rdfox', {
        provideHover(document, position, cancellationToken) {
            var wordRange = document.getWordRangeAtPosition(position)
            var word = document.getText(wordRange)
            if(Object.keys(hoverMap).includes(word)) {
                var markdownText = new vscode.MarkdownString(hoverMap[word])
                markdownText.supportHtml = true
                return new vscode.Hover(markdownText, wordRange)
            }
            return null
        }
    })
}