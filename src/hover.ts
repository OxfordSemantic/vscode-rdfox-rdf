import * as vscode from 'vscode';
import { CommandMap } from './types';

export class RDFoxHoverProvider implements vscode.HoverProvider {
    private readonly commandMap: CommandMap

    constructor(commandMap: CommandMap) {
        this.commandMap = commandMap
    }

    provideHover(
        document: vscode.TextDocument,
        position: vscode.Position,
        _cancellationToken: vscode.CancellationToken
    ) {
        var wordRange = document.getWordRangeAtPosition(position)
        var word = document.getText(wordRange)
        if(Object.keys(this.commandMap).includes(word)) {
            var markdownText = new vscode.MarkdownString(this.commandMap[word].html)
            markdownText.supportHtml = true
            return new vscode.Hover(markdownText, wordRange)
        }
        return null
    }
}