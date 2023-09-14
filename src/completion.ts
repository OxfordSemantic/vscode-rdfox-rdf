import * as vscode from 'vscode';
import { CommandMap, FunctionMap } from './types';

export class RDFoxCompletionProvider implements vscode.CompletionItemProvider {
    private readonly commandMap: CommandMap

    constructor(commandMap: CommandMap) {
        this.commandMap = commandMap
    }

    provideCompletionItems(
        document: vscode.TextDocument,
        position: vscode.Position,
        _cancellationToken: vscode.CancellationToken,
        _context: vscode.CompletionContext
    ) {
        const regExp = new RegExp("\\\\\s*$")
        if(position.line > 0 && regExp.test(document.lineAt(position.line-1).text)) {
            return null
        }

        const wordRange = document.getWordRangeAtPosition(position)
        if(
            wordRange?.start?.character &&
            document.lineAt(position.line).firstNonWhitespaceCharacterIndex != wordRange.start.character
        ) {
            return null
        }

        const word = document.getText(wordRange)
        const commandRegex = new RegExp("^[a-zA-Z]+$")
        if (!commandRegex.test(word)) {
            return null
        }

        return Object.entries(this.commandMap).flatMap(([command, details]) => {
            const wordRegExp = new RegExp("^" + word + ".*", "i")
            if(wordRegExp.test(command)) {
                const completion = new vscode.CompletionItem(details.displayName)
                completion.documentation = new vscode.MarkdownString(
                    "RDFox command - " +
                    details.helpText +
                    `\n[[docs](${details.link})]`
                )
                completion.kind = vscode.CompletionItemKind.Keyword
                return [completion]
            }
            else {
                return []
            }
        })
    }
}

export class FunctionCompletionProvider implements vscode.CompletionItemProvider {
    private readonly functionMap: FunctionMap

    constructor(functionMap: FunctionMap) {
        this.functionMap = functionMap
    }

    provideCompletionItems(
        document: vscode.TextDocument,
        position: vscode.Position,
        _cancellationToken: vscode.CancellationToken,
        _context: vscode.CompletionContext
    ) {
        const wordRange = document.getWordRangeAtPosition(position)
        const word = document.getText(wordRange)

        const functionRegex = new RegExp("^[a-zA-Z0-9_]+$")
        if (!functionRegex.test(word)) {
            return null
        }

        return Object.keys(this.functionMap).flatMap(functionName => {
            const wordRegExp = new RegExp("^" + word + ".*", "i")
            if(wordRegExp.test(functionName)) {
                const nextPosition = document.validatePosition(position.translate(0, 1))
                const followedByBracket = (document.getText(new vscode.Range(position, nextPosition)) == "(")
                const completion = new vscode.CompletionItem(functionName + (followedByBracket ? "" : "()"), vscode.CompletionItemKind.Function)
                completion.filterText = functionName
                completion.insertText = new vscode.SnippetString(functionName + (followedByBracket ? "" : this.functionMap[functionName]["snippetEnd"]))
                return [completion]
            }
            else {
                return []
            }
        })
    }
}
