import fetch, { FetchError } from 'node-fetch';
import AbortError from 'node-fetch';
import { v4 as uuidv4 } from 'uuid';
import * as vscode from 'vscode';
import { ContentResponse } from './types';

export function openInConsoleCommandHandler(textEditor: vscode.TextEditor, _edit: vscode.TextEditorEdit) {
    var configuration = vscode.workspace.getConfiguration('RDFox')

    var query = encodeURIComponent(textEditor.document.getText())

    var url = (configuration.get<string>('URL') ?? "") +
        "/console/datastores/sparql?datastore=" +
        (configuration.get<string>('datastoreName') ?? "") +
        "&query=" +
        query

    // See https://github.com/microsoft/vscode/issues/85930
    // @ts-expect-error
    vscode.env.openExternal(url)
}

function parseContentResponse(responseText: string): ContentResponse {
    const lines = responseText.split("\n")

    var contentResponse: ContentResponse = {
        error: [],
        prefix: {},
        information: {}
    }

    for (var line of lines.slice(0, -1)) {
        var [category, rest] = line.split(/ (.*)/)
        if (category == "error:") {
            contentResponse.error.push(rest)
        } else {
            var [element, value] = rest.split(/ = (.*)/)
            if (category == "prefix:") {
                contentResponse.prefix[element] = value
            } else if (category == "information:") {
                element = element.substring(1)
                if (element == "aborted") {
                    contentResponse.information[element] = (value == "true")
                } else {
                    contentResponse.information[element] = Number(value)
                }
            }
        }
    }
 
    return contentResponse
}

function getNumberString(n: Number, singular: String, plural: String) {
    return n.toString() + " " + (n != 1 ? plural : singular)
}

function getChangeModal(info: ContentResponse["information"]) {
    const rulesMismatch = info["processed-rules"] > info["changed-rules"]
    const factsMismatch = info["processed-facts"] > info["changed-facts"]

    if (rulesMismatch || factsMismatch) {
        const itemsChangedMentioned = 
            (rulesMismatch ? info["changed-rules"] : 0) +
            (factsMismatch ? info["facts-changed"] : 0)

        return "Processed " +
            (rulesMismatch ? getNumberString(info["processed-rules"], "rule", "rules") : "") +
            ((rulesMismatch && factsMismatch) ? " and " : "") +
            (factsMismatch ? getNumberString(info["processed-facts"], "fact", "facts") : "") + 
            ", but only " +
            (rulesMismatch ? getNumberString(info["changed-rules"], "rule", "rules") : "") +
            ((rulesMismatch && factsMismatch) ? " and " : "") +
            (factsMismatch ? getNumberString(info["changed-facts"], "fact", "facts") : "") +
            (((!rulesMismatch || !factsMismatch) && itemsChangedMentioned == 1) ? " was" : " were") +
            " changed."
    }
    else {
        return ""
    }
}

function changeRule(textEditor: vscode.TextEditor, operation: string, title: string, errorMessage: string, fromSelection: boolean = false) {
    var configuration = vscode.workspace.getConfiguration('RDFox')

    const requestId = uuidv4()

    const url = (configuration.get<string>('URL') ?? "") +
    "/datastores/" +
    (configuration.get<string>('datastoreName') ?? "") +
    "/content?operation=" +
    operation

    const cancellationUrl = (configuration.get<string>('URL') ?? "") +
    "/requests/" +
    requestId

    vscode.window.withProgress({
        cancellable: true,
        location: vscode.ProgressLocation.Notification,
        title
    }, async (_progress, token) => {
        const abortController = new globalThis.AbortController();
        token.onCancellationRequested(() => {
            abortController.abort()
            fetch(cancellationUrl, {
                method: 'DELETE'
            })
        })

        try {
            var body = textEditor.document.getText(fromSelection ? textEditor.selection : undefined)

            var response = await fetch(url, {
                method: 'PATCH',
                body,
                headers: {
                    'Content-Type': 'application/x.datalog',
                    'RDFox-Request-ID': requestId
                },
                signal: abortController.signal
            })

            const responseOk = response.ok
            const responseText = await response.text()

            if(!responseOk) {
                vscode.window.showInformationMessage(errorMessage, {modal: true, detail: responseText})
            }
            else {
                const contentResponse = parseContentResponse(responseText)
                const modalDetail = getChangeModal(contentResponse["information"])

                if(modalDetail != "") {
                vscode.window.showInformationMessage("Warning:", {modal: true, detail: modalDetail})
                }
            }


        }
        catch (e) {
            if(e instanceof AbortError) {
                console.log("Request was aborted.")
            }
            if(e instanceof FetchError) {
                vscode.window.showInformationMessage(errorMessage, {modal: true, detail: e.message})
            }
            else {
                console.error(e)
            }
        }
    })
}

export function uploadRuleCommandHandler(textEditor: vscode.TextEditor, _edit: vscode.TextEditorEdit) {
    changeRule(textEditor, 'add-content', 'Uploading Datalog rules to RDFox...', 'Error uploading Datalog rules to RDFox')
}
export function uploadRuleFromSelectionCommandHandler(textEditor: vscode.TextEditor, _edit: vscode.TextEditorEdit) {
    changeRule(textEditor, 'add-content', 'Uploading Datalog rules to RDFox...', 'Error uploading Datalog rules to RDFox', true)
}

export function deleteRuleCommandHandler(textEditor: vscode.TextEditor, _edit: vscode.TextEditorEdit) {
    changeRule(textEditor, 'delete-content', 'Deleting Datalog rules from RDFox...', 'Error deleting Datalog rules from RDFox')
}

export function deleteRuleFromSelectionCommandHandler(textEditor: vscode.TextEditor, _edit: vscode.TextEditorEdit) {
    changeRule(textEditor, 'delete-content', 'Deleting Datalog rules from RDFox...', 'Error deleting Datalog rules from RDFox', true)
}

export function openSettingsCommandHandler(textEditor: vscode.TextEditor, _edit: vscode.TextEditorEdit) {
    vscode.commands.executeCommand('workbench.action.openSettings', ' @ext:rdfox.rdfox-rdf')
}