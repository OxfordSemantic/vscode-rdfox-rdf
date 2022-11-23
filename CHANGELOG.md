# Changelog

## 1.0.3 (23 November 2022)
- Account for RDFox 6.0 syntax
- Fix highlighting of prefixed IRIs with escaped "#"
- Remove highlighting of SPARQL-only keywords in Datalog

## 1.0.2 (15 September 2022)
- Fix multi-line literal support in Turtle and other languages ([Issue #1](https://github.com/OxfordSemantic/vscode-rdfox-rdf/issues/1))
- Add query command (`select`, `insert`...) and `serverinfo` highlighting in RDFox scripts
- Fix unnecessary highlighting after `echo` and `grant` commands in RDFox scripts
- Tweak comment highlighting in RDFox scripts

## 1.0.1 (21 July 2022)
- Recognize SPARQL operators followed directly by "?"

## 1.0.0 (20 July 2022)
- Initial release