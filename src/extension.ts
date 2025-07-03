import * as vscode from 'vscode';

import * as _commandMap from './commandMap.json';
import * as _functionMap from './functionMap.json';
import {
    deleteRuleCommandHandler,
    deleteRuleFromSelectionCommandHandler,
    openInConsoleCommandHandler,
    openSettingsCommandHandler,
    uploadRuleFromSelectionCommandHandler,
    uploadRuleCommandHandler,
    withContext
} from './command';
import { RDFoxCompletionProvider, FunctionCompletionProvider } from './completion';
import { RDFoxHoverProvider } from './hover';
import { CommandMap, FunctionMap } from './types';
import { TurtleDefinitionProvider } from './definition';

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
        vscode.languages.registerDefinitionProvider('turtle', new TurtleDefinitionProvider())
    )

    context.subscriptions.push(
        vscode.commands.registerTextEditorCommand('rdfox-rdf.open-in-console', openInConsoleCommandHandler)
    )

    context.subscriptions.push(
        vscode.commands.registerTextEditorCommand('rdfox-rdf.upload-rule', withContext(context, uploadRuleCommandHandler))
    )

    context.subscriptions.push(
        vscode.commands.registerTextEditorCommand('rdfox-rdf.upload-rule-from-selection', withContext(context, uploadRuleFromSelectionCommandHandler))
    )

    context.subscriptions.push(
        vscode.commands.registerTextEditorCommand('rdfox-rdf.delete-rule', withContext(context, deleteRuleCommandHandler))
    )

    context.subscriptions.push(
        vscode.commands.registerTextEditorCommand('rdfox-rdf.delete-rule-from-selection', withContext(context, deleteRuleFromSelectionCommandHandler))
    )

    context.subscriptions.push(
        vscode.commands.registerTextEditorCommand('rdfox-rdf.open-settings', openSettingsCommandHandler)
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

var x: vscode.DocumentFilter