import fetch, { FetchError } from 'node-fetch';
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

function encodeBasicAuth(credentials: string) {
    return 'Basic ' + Buffer.from(credentials).toString('base64');
}

function getChangeModal(info: ContentResponse["information"]) {
    var changes = ""

    if (info["processed-rules"] > 0) {
        changes += "Processed " +
            getNumberString(info["processed-rules"], "rule", "rules") +
            ", of which " +
            info["changed-rules"].toString() +
            (info["changed-rules"] == 1 ? " was" : " were") +
            " updated.\n"
    }
    if (info["processed-facts"] > 0) {
        changes += "Processed " +
            getNumberString(info["processed-facts"], "fact", "facts") +
            ", of which " +
            info["changed-facts"].toString() +
            (info["changed-facts"] == 1 ? " was" : " were") +
            " updated.\n"
    }
    return changes

}

async function changeRule(textEditor: vscode.TextEditor, operation: string, title: string, errorMessage: string, context: vscode.ExtensionContext, fromSelection: boolean = false) {
    var configuration = vscode.workspace.getConfiguration('RDFox')

    var credentials = await context.secrets.get("RDFox.basicAuth")
    var authorizationHeaders = (!!credentials ? {'Authorization': encodeBasicAuth(credentials ?? "")} : undefined)

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
                method: 'DELETE',
                headers: authorizationHeaders
            })
        })

        try {
            var body = textEditor.document.getText(fromSelection ? textEditor.selection : undefined)

            var response = await fetch(url, {
                method: 'PATCH',
                body,
                headers: {
                    'Content-Type': 'application/x.datalog',
                    'RDFox-Request-ID': requestId,
                    ...authorizationHeaders
                },
                signal: abortController.signal
            })

            const responseOk = response.ok
            const responseText = await response.text()

            if(response.status == 401) {
                credentials = await vscode.window.showInputBox({ title: "Unauthorized", prompt: "Enter credentials, then try again", placeHolder: "username:password"});
                if(!!credentials) {
                    await context.secrets.store("RDFox.basicAuth", credentials)
                }
            }
            else if(!responseOk) {
                vscode.window.showInformationMessage(errorMessage, {modal: true, detail: responseText})
            }
            else {
                const contentResponse = parseContentResponse(responseText)
                const modalDetail = getChangeModal(contentResponse["information"])

                if(modalDetail != "") {
                    vscode.window.showInformationMessage("Import Complete", {modal: true, detail: modalDetail})
                } else {
                    vscode.window.showInformationMessage("Import Complete (Warning)", {modal: true, detail: "No facts or rules were found"})
                }
            }


        }
        catch (e) {
            if (e instanceof FetchError) {
                vscode.window.showInformationMessage(e.name, {modal: true, detail: e.message})
            }
            else if (e instanceof Error) {
                vscode.window.showInformationMessage(e.name, {modal: true, detail: e.message + "\n\nRequest URL: " + url})
            }
            else {
                console.error(e)
            }
        }
    })
}

export function uploadRuleCommandHandler(textEditor: vscode.TextEditor, _edit: vscode.TextEditorEdit, context: vscode.ExtensionContext) {
    changeRule(textEditor, 'add-content', 'Uploading Datalog rules to RDFox...', 'Import Error', context)
}
export function uploadRuleFromSelectionCommandHandler(textEditor: vscode.TextEditor, _edit: vscode.TextEditorEdit, context: vscode.ExtensionContext) {
    changeRule(textEditor, 'add-content', 'Uploading Datalog rules to RDFox...', 'Import Error', context, true)
}

export function deleteRuleCommandHandler(textEditor: vscode.TextEditor, _edit: vscode.TextEditorEdit, context: vscode.ExtensionContext) {
    changeRule(textEditor, 'delete-content', 'Deleting Datalog rules from RDFox...', 'Deletion Error', context)
}

export function deleteRuleFromSelectionCommandHandler(textEditor: vscode.TextEditor, _edit: vscode.TextEditorEdit, context: vscode.ExtensionContext) {
    changeRule(textEditor, 'delete-content', 'Deleting Datalog rules from RDFox...', 'Deletion Error', context, true)
}

export function openSettingsCommandHandler(textEditor: vscode.TextEditor, _edit: vscode.TextEditorEdit) {
    vscode.commands.executeCommand('workbench.action.openSettings', ' @ext:rdfox.rdfox-rdf')
}

export function withContext(context: vscode.ExtensionContext, f: (textEditor: vscode.TextEditor, _edit: vscode.TextEditorEdit, context: vscode.ExtensionContext) => void) {
    return (textEditor: vscode.TextEditor, _edit: vscode.TextEditorEdit) => f(textEditor, _edit, context)
}