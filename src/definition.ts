import { Definition, DefinitionProvider, Location, LocationLink, Position, ProviderResult, Range, RelativePattern, TextDocument, Uri, workspace } from 'vscode'

type MatchLocation = ProviderResult<Definition | LocationLink[]> | null

export class TurtleDefinitionProvider implements DefinitionProvider {
    provideDefinition(document: TextDocument, position: Position): MatchLocation {
        const symbol = document.getText(document.getWordRangeAtPosition(position))
        const regex = definitionRegex(symbol)
        return findTurtleDocuments().then(documents => {
            for (let doc of documents) {
                const result = findMatchInDocument(doc, regex)
                if (result) {
                    return result
                }
            }
            return undefined
        })
    }
}

const definitionRegex = (str: string) => new RegExp(`(?<=\\.\\s*)\\b${str}\\b`, 'g')

async function findTurtleDocuments(): Promise<TextDocument[]> {
    const folders = workspace.workspaceFolders;
    if (!folders) {
        return [];
    }

    const files: Uri[] = [];
    for (const folder of folders) {
        const folderFiles = await workspace.findFiles(new RelativePattern(folder, '**/*.ttl'));
        files.push(...folderFiles);
    }

    const documentPromises = files.map(async file => await workspace.openTextDocument(file));
    return await Promise.all(documentPromises);
}

function findMatchInDocument(doc: TextDocument, regex: RegExp): MatchLocation {
    const text = doc.getText()
    
    const match = regex.exec(text)
    if (!match) {
        return undefined
    }

    const textBeforeMatch = text.substring(0, match.index)
    const lineNumber = textBeforeMatch.match(/\n/g)?.length || 0
    
    const symbol = match[0]
    const startIndex = doc.lineAt(lineNumber).text.indexOf(symbol)
    if (startIndex === -1) {
        return undefined
    }

    const start = new Position(lineNumber, startIndex)
    const end = new Position(lineNumber, startIndex + symbol.length)
    return new Location(doc.uri, new Range(start, end))
}
