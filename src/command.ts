import { v4 as uuidv4 } from 'uuid';
import * as fs from 'fs';
import * as vscode from 'vscode';
import { ContentResponse, MimeMap } from './types';

import * as _mimeMap from './mimeMap.json';
import { Readable } from 'stream';
import { finished } from 'stream/promises';

const mimeMap: MimeMap = _mimeMap

// HELPER FUNCTIONS

function dateString(date:Date): string {
    return date.getFullYear().toString() + (date.getMonth()+1).toString().padStart(2, "0")+ date.getDate().toString().padStart(2, "0") + "_" + date.getHours().toString().padStart(2, "0") + date.getMinutes().toString().padStart(2, "0") + date.getSeconds().toString().padStart(2, "0")
}

function encodeBasicAuth(credentials: string): string {
    return 'Basic ' + Buffer.from(credentials).toString('base64');
}

function cancelRequest(abortController: AbortController, endpoint: string, requestId: string, authorizationHeaders: Record<string, string> | undefined) {
    var cancellationUrl = `${endpoint}/requests/${requestId}`
    return () => {
            abortController.abort()
            fetch(cancellationUrl, {
                method: 'DELETE',
                headers: authorizationHeaders
            })
        }
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
    var changes = ""

    if (info["processed-rules"] > 0) {
        changes += "Processed " +
            getNumberString(info["processed-rules"], "rule", "rules") +
            ", of which " +
            getNumberString(info["changed-rules"], "was", "were") +
            " updated.\n"
    }
    if (info["processed-facts"] > 0) {
        changes += "Processed " +
            getNumberString(info["processed-facts"], "fact", "facts") +
            ", of which " +
            getNumberString(info["changed-facts"], "was", "were") +
            " updated.\n"
    }
    return changes

}

async function callRDFox(url: string, body: string | fs.ReadStream | undefined, contentType: string | undefined, method: string, progressTitle: string, context: vscode.ExtensionContext, callback: ((response: Response | undefined) => Promise<void>)) {
    const configuration = vscode.workspace.getConfiguration('RDFox')
    const endpoint = configuration.get<string>('URL') ?? ""

    vscode.window.withProgress({
        cancellable: true,
        location: vscode.ProgressLocation.Notification,
        title: progressTitle
    }, async (_progress, token) => {
        const abortController = new globalThis.AbortController();

        var requestId = "Extension-" + uuidv4()
        try {
            var credentials = await context.secrets.get("RDFox.basicAuth")
            var authorizationHeaders = (!!credentials ? {'Authorization': encodeBasicAuth(credentials ?? "")} : undefined)
            
            
            token.onCancellationRequested(cancelRequest(abortController, endpoint, requestId, authorizationHeaders))

            var response = await fetch(url, {
                method,
                body,
                duplex: "half",
                headers: {
                    ...(contentType ? {'Content-Type': contentType} : {}),
                    'RDFox-Request-ID': requestId,
                    ...authorizationHeaders
                },
                signal: abortController.signal
            })

            if(response.status == 401) {
                credentials = await vscode.window.showInputBox({ title: "Unauthorized", prompt: "Enter credentials in format role:password", placeHolder: "role:password", password: true});
                if(!!credentials && credentials.includes(":")) {
                    await context.secrets.store("RDFox.basicAuth", credentials)
                } else {
                    await context.secrets.delete("RDFox.basicAuth")
                }
                authorizationHeaders = (!!credentials ? {'Authorization': encodeBasicAuth(credentials ?? "")} : undefined)
                requestId = requestId + "-Retry"

                token.onCancellationRequested(cancelRequest(abortController, endpoint, requestId, authorizationHeaders))

                response = await fetch(url, {
                    method,
                    body,
                    duplex: "half",
                    headers: {
                        ...(contentType ? {'Content-Type': contentType} : {}),
                        'RDFox-Request-ID': requestId,
                        ...authorizationHeaders
                    },
                    signal: abortController.signal
                })
            }

            const responseOk = response.ok
            if(!responseOk) {
                const responseText = await response.text()
                if(responseText.includes("access token is not valid")) {
                    await context.secrets.delete("RDFox.basicAuth")
                }
                await vscode.window.showInformationMessage(`Error: ${response.status} ${response.statusText}`, {modal: true, detail: responseText})
                return undefined
            }
            else {
                await callback(response)
            }
        }
        catch (e) {
            if (e instanceof Error) {
                cancelRequest(abortController, endpoint, requestId, authorizationHeaders)
                await vscode.window.showInformationMessage("Error", {modal: true, detail: `Is the RDFox endpoint reachable?\n\n${e.name}: ${e.message}\n\nRequest URL: ${url}`})
            }
            else {
                cancelRequest(abortController, endpoint, requestId, authorizationHeaders)
                await vscode.window.showInformationMessage("Unknown Error", {modal: true, detail: "Request URL: " + url})
            }
        }
        return undefined
    })
}

async function changeContent(operation: "add-content" | "delete-content", context: vscode.ExtensionContext, body:  string | fs.ReadStream, langId: string | undefined) {
    const configuration = vscode.workspace.getConfiguration('RDFox')
    const endpoint = configuration.get<string>('URL') ?? ""
    const datastore = configuration.get<string>('datastoreName') ?? ""
    const url = `${endpoint}/datastores/${datastore}/content?operation=${operation}`

    const contentType = mimeMap[langId || ""] || ""
    const operationDesc = (operation == "add-content" ? "Adding" : "Deleting") + " " + (langId == "datalog" ? "Rules" : "Data")
    const operationDescShort = (operation == "add-content" ? "Addition" : "Deletion")
    const progressTitle = operationDesc + "..."

    await callRDFox(url, body, contentType, "PATCH", progressTitle, context, async (response: Response | undefined) => {
        const responseText = await response?.text() || "[No response received]"
        const contentResponse = parseContentResponse(responseText)
        const modalDetail = getChangeModal(contentResponse["information"])

        if(modalDetail != "") {
            await vscode.window.showInformationMessage(`${operationDescShort} Complete`, {modal: true, detail: modalDetail})
        } else {
            await vscode.window.showInformationMessage(`${operationDescShort} Complete`, {modal: true, detail: "Warning: No facts or rules were found"})
        }
    })
}

async function explorerChangeContent(operation: "add-content" | "delete-content", context: vscode.ExtensionContext, resource: vscode.Uri) {
    try {
        const bodyStream = fs.createReadStream(resource.fsPath)
        const languages = context.extension.packageJSON.contributes.languages as {id: string, extensions: string[]}[]
        const langId = languages.find(lang=>lang.extensions.findIndex(ext=>resource.fsPath.endsWith(ext)) > -1)?.id
        await changeContent(operation, context, bodyStream, langId)
    }
    catch (e) {
        if (e instanceof Error) {
            await vscode.window.showInformationMessage("Error", {modal: true, detail: `${e.name}: ${e.message}`})
        }
    }
}

async function editorChangeContent(operation: "add-content" | "delete-content", source: "editor" | "selection", context: vscode.ExtensionContext, textEditor: vscode.TextEditor) {
    const body = (source == "selection" ? textEditor.document.getText(textEditor.selection) : textEditor.document.getText())
    const langId = textEditor.document.languageId
    await changeContent(operation, context, body, langId)
}

export function withContextEditor(context: vscode.ExtensionContext, f: (textEditor: vscode.TextEditor, _edit: vscode.TextEditorEdit, context: vscode.ExtensionContext) => void) {
    return (textEditor: vscode.TextEditor, _edit: vscode.TextEditorEdit) => f(textEditor, _edit, context)
}

export function withContext(context: vscode.ExtensionContext, f: (resource: vscode.Uri, context: vscode.ExtensionContext) => void) {
    return (resource: vscode.Uri) => f(resource, context)
}

// ADD/DELETE CONTENT

export function uploadContentCommandHandler(textEditor: vscode.TextEditor, _edit: vscode.TextEditorEdit, context: vscode.ExtensionContext) {
    editorChangeContent("add-content", "editor", context, textEditor)
}
export function uploadContentFromSelectionCommandHandler(textEditor: vscode.TextEditor, _edit: vscode.TextEditorEdit, context: vscode.ExtensionContext) {
    editorChangeContent("add-content", "selection", context, textEditor)
}
export function uploadContentFromExplorerCommandHandler(resource: vscode.Uri, context: vscode.ExtensionContext) {
    explorerChangeContent("add-content", context, resource)
}

export function deleteContentCommandHandler(textEditor: vscode.TextEditor, _edit: vscode.TextEditorEdit, context: vscode.ExtensionContext) {
    editorChangeContent("delete-content", "editor", context, textEditor)
}
export function deleteContentFromSelectionCommandHandler(textEditor: vscode.TextEditor, _edit: vscode.TextEditorEdit, context: vscode.ExtensionContext) {
    editorChangeContent("delete-content", "selection", context, textEditor)
}
export function deleteContentFromExplorerCommandHandler(resource: vscode.Uri, context: vscode.ExtensionContext) {
    explorerChangeContent("delete-content", context, resource)
}

// SPARQL

export function openInConsoleCommandHandler(textEditor: vscode.TextEditor, _edit: vscode.TextEditorEdit) {
    const configuration = vscode.workspace.getConfiguration('RDFox')
    const endpoint = configuration.get<string>('URL') ?? ""
    const datastore = configuration.get<string>('datastoreName') ?? ""

    const query = encodeURIComponent(textEditor.document.getText())
    const url = `${endpoint}/console/datastores/sparql?datastore=${datastore}&query=${query}`

    // See https://github.com/microsoft/vscode/issues/85930
    // @ts-expect-error
    vscode.env.openExternal(url)
}

// OTHER

export function openSettingsCommandHandler() {
    vscode.commands.executeCommand('workbench.action.openSettings', ' @ext:rdfox.rdfox-rdf')
}

export function profileQueryCommandHandler(resource: vscode.Uri, context: vscode.ExtensionContext) {
    const configuration = vscode.workspace.getConfiguration('RDFox')
    const endpoint = configuration.get<string>('URL') ?? ""
    const datastore = configuration.get<string>('datastoreName') ?? ""
    const url = `${endpoint}/commands`
    const infoUrl = `${endpoint}/datastores/${datastore}`

    const query = fs.readFileSync(resource.fsPath).toString()
    const queryEscaped = query.trim().split(/\s*\r?\n\s*/).join(" \\\n")
    const scriptText = `
        set on-error stop
        active ${datastore}

        set query.monitor profile
        set log-frequency 60

        begin

        evaluate ! ${queryEscaped}

        rollback
    `

    vscode.window.showWarningMessage("Warning", {modal: true, detail: "Query profiling can significantly affect the performance of the system, it is not recommended to run this in a production environment"}, "Continue")
        .then(async (item) => {
            if (item == "Continue") {
                await callRDFox(infoUrl, undefined, undefined, "GET", "Checking datastore access...", context, async (response) => {
                    if(response && response.ok) {
                        callRDFox(url, scriptText, "text/plain", "POST", "Generating query profile...", context, async (response: Response | undefined) => {
                            const profilePath = `${resource.fsPath}-profile-${dateString(new Date)}`
                            const responseStream = response?.body
                            if(!responseStream) {
                                await vscode.window.showInformationMessage("[No response received]", {modal: true, detail: ""})
                            } else {
                                const fileStream = fs.createWriteStream(profilePath)
                                Readable.fromWeb(responseStream).pipe(fileStream)
                                const doc = await vscode.workspace.openTextDocument(profilePath)
                                await vscode.languages.setTextDocumentLanguage(doc, "datalog")
                                vscode.window.showTextDocument(doc)
                            }
                        })
                    }
                })
            }
        })
}

export function profileReasoningCommandHandler(resource: vscode.Uri, context: vscode.ExtensionContext) {
    const configuration = vscode.workspace.getConfiguration('RDFox')
    const endpoint = configuration.get<string>('URL') ?? ""
    const datastore = configuration.get<string>('datastoreName') ?? ""
    const url = `${endpoint}/commands`
    const infoUrl = `${endpoint}/datastores/${datastore}`

    const rules = fs.readFileSync(resource.fsPath).toString()
    const rulesEscaped = rules.trim().split(/\s*\r?\n\s*/).join(" \\\n")
    const scriptText = `
        set on-error stop
        active ${datastore}

        set reason.monitor profile
        set reason.profiler.log-plans true
        set log-frequency 60

        begin

        import ! ${rulesEscaped}

        mat

        rollback
    `
    vscode.window.showWarningMessage("Warning", {modal: true, detail: "Reasoning profiling can significantly affect the performance of the system, it is not recommended to run this in a production environment"}, "Continue")
        .then(async (item) => {
            if (item == "Continue") {
                await callRDFox(infoUrl, undefined, undefined, "GET", "Checking datastore access...", context, async (response) => {
                    if(response && response.ok) {
                        callRDFox(url, scriptText, "text/plain", "POST", "Generating reasoning profile...", context, async (response: Response | undefined) => {
                            const profilePath = `${resource.fsPath}-profile-${dateString(new Date)}`
                            const responseStream = response?.body
                            if(!responseStream) {
                                await vscode.window.showInformationMessage("[No response received]", {modal: true, detail: ""})
                            } else {
                                const fileStream = fs.createWriteStream(profilePath)
                                const streamFinished = finished(Readable.fromWeb(responseStream).pipe(fileStream))

                                const doc = await vscode.workspace.openTextDocument(profilePath)
                                await vscode.languages.setTextDocumentLanguage(doc, "datalog")
                                vscode.window.showTextDocument(doc, {preview: true})

                                await streamFinished
                                fileStream.end()
                            }
                        })
                    }
                })
                
            }
        })
}