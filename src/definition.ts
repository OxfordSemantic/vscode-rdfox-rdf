import { Definition, DefinitionProvider, Location, LocationLink, Position, ProviderResult, Range, RelativePattern, TextDocument, Uri, workspace } from 'vscode'

type MatchLocation = ProviderResult<Definition | LocationLink[]> | null

export class TurtleDefinitionProvider implements DefinitionProvider {
    provideDefinition(document: TextDocument, position: Position): MatchLocation {
        const symbol = document.getText(document.getWordRangeAtPosition(position))
        const regex = definitionRegex(symbol)
        for (let doc of turtleDocuments()) {
            const result = findMatchInDocument(doc, regex, symbol)
            if (result) {
                return result
            }
        }
        return undefined
    }
}

const definitionRegex = (str: string) => new RegExp(`(?<=\\.\\s*)\\b${str}\\b`, 'g')
const turtleDocuments = () => workspace.textDocuments.filter(d => d.languageId === 'turtle')

function findMatchInDocument(doc: TextDocument, regex: RegExp, symbol: string): MatchLocation {
    const text = doc.getText()
    
    const match = regex.exec(text)
    if (!match) {
        return undefined
    }

    const textBeforeMatch = text.substring(0, match.index)
    const lineNumber = textBeforeMatch.match(/\n/g)?.length || 0

    const startIndex = doc.lineAt(lineNumber).text.indexOf(symbol)
    if (startIndex === -1) {
        return undefined
    }

    const start = new Position(lineNumber, startIndex)
    const end = new Position(lineNumber, startIndex + match[0].length)
    return new Location(doc.uri, new Range(start, end))
}
