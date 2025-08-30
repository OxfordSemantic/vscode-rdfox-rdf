import { Definition, DefinitionProvider, Location, LocationLink, Position, ProviderResult, Range, RelativePattern, TextDocument, Uri, workspace } from 'vscode'

type MatchLocation = ProviderResult<Definition | LocationLink[]> | undefined

export class TurtleDefinitionProvider implements DefinitionProvider {
    provideDefinition(document: TextDocument, position: Position): MatchLocation {
        const word = document.getText(document.getWordRangeAtPosition(position))
        const identifier = new Identifier(word, getPrefixMapping(document.getText()))
        return findTurtleDocuments().then(documents => {
            for (let doc of documents) {
                const result = findMatchInDocument(doc, identifier)
                if (result) {
                    return result
                }
            }
            return undefined
        })
    }
}

class Identifier {
    private readonly prefix: string
    private readonly localName: string
    
    constructor(word: string, mapping: Map<string, string>) {
        const trimmed = word.trim()
        this.prefix = mapping.get(trimmed.substring(0, trimmed.indexOf(':'))) || ''
        this.localName = word.substring(trimmed.indexOf(':') + 1, trimmed.length)
    }
    
    getRegexForMapping(mapping: Map<string, string>): RegExp {
        const entry = Array.from(mapping.entries()).filter(e => e[1] === this.prefix)[0]
        if (!entry) {
            return definitionRegex(`<${this.prefix}${this.localName}>`)
        }
        return definitionRegex(`(${entry[0]}:${this.localName})|(<${this.prefix}${this.localName}>)`)
    }
}

const definitionRegex = (str: string) => new RegExp(`(?<=(\\.|^)\\s*)(${str})`, 'g')

function getPrefixMapping(text: string): Map<string, string> {
    const resultMap = new Map<string, string>()
    prefixes(text)?.map(str => str.trim()).forEach(str => {
        const key = str.substring(0, str.indexOf(':'))
        const value = str.substring(str.indexOf('<') + 1, str.indexOf('>'))
        resultMap.set(key, value)
    })
    return resultMap
}

const prefixes = (str: string) => /(?<=@prefix\s*)[a-zA-z0-9_-]*\s*:\s*<.+>(?=\s*\.)/g.exec(str)

async function findTurtleDocuments(): Promise<TextDocument[]> {
    const folders = workspace.workspaceFolders
    if (!folders) {
        return []
    }

    const files: Uri[] = []
    for (const folder of folders) {
        const pattern = new RelativePattern(folder, '**/*.ttl')
        const folderFiles = await workspace.findFiles(pattern)
        files.push(...folderFiles)
    }

    const documentPromises = files.map(async file => await workspace.openTextDocument(file))
    return await Promise.all(documentPromises)
}

function findMatchInDocument(doc: TextDocument, identifier: Identifier): MatchLocation {
    const text = doc.getText()
    
    const regex = identifier.getRegexForMapping(getPrefixMapping(text))
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
