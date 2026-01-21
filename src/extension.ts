import * as vscode from 'vscode';

import * as _commandMap from './commandMap.json';
import * as _functionMap from './functionMap.json';
import {
    deleteContentCommandHandler,
    deleteContentFromExplorerCommandHandler,
    deleteContentFromSelectionCommandHandler,
    openInConsoleCommandHandler,
    openSettingsCommandHandler,
    profileQueryCommandHandler,
    profileReasoningCommandHandler,
    uploadContentCommandHandler,
    uploadContentFromExplorerCommandHandler,
    uploadContentFromSelectionCommandHandler,
    withContext,
    withContextEditor
} from './command';
import { RDFoxCompletionProvider, FunctionCompletionProvider } from './completion';
import { RDFoxHoverProvider } from './hover';
import { CommandMap, FunctionMap } from './types';

export function activate(context: vscode.ExtensionContext) {
    const commandMap: CommandMap = _commandMap
    const functionMap: FunctionMap = _functionMap

    context.subscriptions.push(
        vscode.languages.registerHoverProvider('rdfox', new RDFoxHoverProvider(commandMap))
    )
    
    context.subscriptions.push(
        vscode.languages.registerCompletionItemProvider('rdfox', new RDFoxCompletionProvider(commandMap))
    )

    context.subscriptions.push(
        vscode.languages.registerCompletionItemProvider('sparql', new FunctionCompletionProvider(functionMap))
    )
    context.subscriptions.push(
        vscode.languages.registerCompletionItemProvider('datalog', new FunctionCompletionProvider(functionMap))
    )

    context.subscriptions.push(
        vscode.commands.registerTextEditorCommand('rdfox-rdf.open-in-console', openInConsoleCommandHandler)
    )

    // ADD/DELETE RULES

    context.subscriptions.push(
        vscode.commands.registerTextEditorCommand('rdfox-rdf.upload-rule', withContextEditor(context, uploadContentCommandHandler))
    )

    context.subscriptions.push(
        vscode.commands.registerTextEditorCommand('rdfox-rdf.upload-rule-from-selection', withContextEditor(context, uploadContentFromSelectionCommandHandler))
    )

    context.subscriptions.push(
        vscode.commands.registerCommand('rdfox-rdf.upload-rule-from-explorer', withContext(context, uploadContentFromExplorerCommandHandler))
    )

    context.subscriptions.push(
        vscode.commands.registerTextEditorCommand('rdfox-rdf.delete-rule', withContextEditor(context, deleteContentCommandHandler))
    )

    context.subscriptions.push(
        vscode.commands.registerTextEditorCommand('rdfox-rdf.delete-rule-from-selection', withContextEditor(context, deleteContentFromSelectionCommandHandler))
    )

    context.subscriptions.push(
        vscode.commands.registerCommand('rdfox-rdf.delete-rule-from-explorer', withContext(context, deleteContentFromExplorerCommandHandler))
    )

    // ADD/DELETE DATA

    context.subscriptions.push(
        vscode.commands.registerTextEditorCommand('rdfox-rdf.upload-data', withContextEditor(context, uploadContentCommandHandler))
    )

    context.subscriptions.push(
        vscode.commands.registerTextEditorCommand('rdfox-rdf.upload-data-from-selection', withContextEditor(context, uploadContentFromSelectionCommandHandler))
    )

    context.subscriptions.push(
        vscode.commands.registerCommand('rdfox-rdf.upload-data-from-explorer', withContext(context, uploadContentFromExplorerCommandHandler))
    )

    context.subscriptions.push(
        vscode.commands.registerTextEditorCommand('rdfox-rdf.delete-data', withContextEditor(context, deleteContentCommandHandler))
    )

    context.subscriptions.push(
        vscode.commands.registerTextEditorCommand('rdfox-rdf.delete-data-from-selection', withContextEditor(context, deleteContentFromSelectionCommandHandler))
    )

    context.subscriptions.push(
        vscode.commands.registerCommand('rdfox-rdf.delete-data-from-explorer', withContext(context, deleteContentFromExplorerCommandHandler))
    )

    // OTHER

    context.subscriptions.push(
        vscode.commands.registerCommand('rdfox-rdf.open-settings', openSettingsCommandHandler)
    )

    context.subscriptions.push(
        vscode.commands.registerCommand('rdfox-rdf.profile-query', withContext(context, profileQueryCommandHandler))
    )

    context.subscriptions.push(
        vscode.commands.registerCommand('rdfox-rdf.profile-reasoning', withContext(context, profileReasoningCommandHandler))
    )

    const variablePatternString = "(?:\\?(?:[0-9_A-Za-z\\u00C0-\\u00D6\\u00D8-\\u00F6\\u00F8-\\u02FF\\u0370-\\u037D\\u037F-\\u1FFF\\u200C-\\u200D\\u2070-\\u218F\\u2C00-\\u2FEF\\u3001-\\uD7FF\\uF900-\\uFDCF\\uFDF0-\\uFFFD]|(?:[\\uD800-\\uDB7F][\\uDC00-\\uDFFF]))(?:[0-9\\u00B7\\u0300-\\u036F\\u203F-\\u2040_A-Za-z\\u00C0-\\u00D6\\u00D8-\\u00F6\\u00F8-\\u02FF\\u0370-\\u037D\\u037F-\\u1FFF\\u200C-\\u200D\\u2070-\\u218F\\u2C00-\\u2FEF\\u3001-\\uD7FF\\uF900-\\uFDCF\\uFDF0-\\uFFFD]|(?:[\\uD800-\\uDB7F][\\uDC00-\\uDFFF]))*)"
    const iriPatternString = "(?:(?:(?:(?:[A-Za-z\\u00C0-\\u00D6\\u00D8-\\u00F6\\u00F8-\\u02FF\\u0370-\\u037D\\u037F-\\u1FFF\\u200C-\\u200D\\u2070-\\u218F\\u2C00-\\u2FEF\\u3001-\\uD7FF\\uF900-\\uFDCF\\uFDF0-\\uFFFD]|(?:[\\uD800-\\uDB7F][\\uDC00-\\uDFFF]))(?:(?:[\\.\\-0-9\\u00B7\\u0300-\\u036F\\u203F-\\u2040_A-Za-z\\u00C0-\\u00D6\\u00D8-\\u00F6\\u00F8-\\u02FF\\u0370-\\u037D\\u037F-\\u1FFF\\u200C-\\u200D\\u2070-\\u218F\\u2C00-\\u2FEF\\u3001-\\uD7FF\\uF900-\\uFDCF\\uFDF0-\\uFFFD]|(?:[\\uD800-\\uDB7F][\\uDC00-\\uDFFF]))*(?:[-0-9\\u00B7\\u0300-\\u036F\\u203F-\\u2040_A-Za-z\\u00C0-\\u00D6\\u00D8-\\u00F6\\u00F8-\\u02FF\\u0370-\\u037D\\u037F-\\u1FFF\\u200C-\\u200D\\u2070-\\u218F\\u2C00-\\u2FEF\\u3001-\\uD7FF\\uF900-\\uFDCF\\uFDF0-\\uFFFD]|(?:[\\uD800-\\uDB7F][\\uDC00-\\uDFFF])))?)?:)(?:(?:(?:[:0-9_A-Za-z\\u00C0-\\u00D6\\u00D8-\\u00F6\\u00F8-\\u02FF\\u0370-\\u037D\\u037F-\\u1FFF\\u200C-\\u200D\\u2070-\\u218F\\u2C00-\\u2FEF\\u3001-\\uD7FF\\uF900-\\uFDCF\\uFDF0-\\uFFFD]|(?:[\\uD800-\\uDB7F][\\uDC00-\\uDFFF]))|%[0-9A-Fa-f]{2}|\\\\[-_~\\.!$&'()*+,;=\\/?#@%])(?:(?:(?:[:\\.\\-0-9\\u00B7\\u0300-\\u036F\\u203F-\\u2040_A-Za-z\\u00C0-\\u00D6\\u00D8-\\u00F6\\u00F8-\\u02FF\\u0370-\\u037D\\u037F-\\u1FFF\\u200C-\\u200D\\u2070-\\u218F\\u2C00-\\u2FEF\\u3001-\\uD7FF\\uF900-\\uFDCF\\uFDF0-\\uFFFD]|(?:[\\uD800-\\uDB7F][\\uDC00-\\uDFFF]))|%[0-9A-Fa-f]{2}|\\\\[-_~\\.!$&'()*+,;=\\/?#@%])*(?:(?:[-:0-9\\u00B7\\u0300-\\u036F\\u203F-\\u2040_A-Za-z\\u00C0-\\u00D6\\u00D8-\\u00F6\\u00F8-\\u02FF\\u0370-\\u037D\\u037F-\\u1FFF\\u200C-\\u200D\\u2070-\\u218F\\u2C00-\\u2FEF\\u3001-\\uD7FF\\uF900-\\uFDCF\\uFDF0-\\uFFFD]|(?:[\\uD800-\\uDB7F][\\uDC00-\\uDFFF]))|%[0-9A-Fa-f]{2}|\\\\[-_~\\.!$&'()*+,;=\\/?#@%]))?)?)"
    const basicWordPatternString = "(?:\\w+)"

    const wordPattern = RegExp(variablePatternString + "|" + iriPatternString + "|" + basicWordPatternString)

    vscode.languages.setLanguageConfiguration('rdfox', {wordPattern})
    vscode.languages.setLanguageConfiguration('sparql', {wordPattern})
    vscode.languages.setLanguageConfiguration('datalog', {wordPattern})
    vscode.languages.setLanguageConfiguration('turtle', {wordPattern})
    vscode.languages.setLanguageConfiguration('trig', {wordPattern})
    vscode.languages.setLanguageConfiguration('n-triples', {wordPattern})
    vscode.languages.setLanguageConfiguration('n-quads', {wordPattern})
}
