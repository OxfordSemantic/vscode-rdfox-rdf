# Changelog

## 1.4.4 (23 June 2025)
- Add highlighting for RDFox's STREX function
- Add highlighting for GRAPH keyword in TriG files

## 1.4.3 (24 February 2025)
- Update RDFox shell commands for RDFox 7.3
- Improve basic authentication experience

## 1.4.2 (5 November 2024)
- Add basic authentication for rule upload (uses VS Code's SecretStorage)
- Display modal for every rule upload

## 1.4.1 (4 September 2024)
- Fix RDFox console URL building
- Fix highlighting for new RDFox commands

## 1.4.0 (28 August 2024)
- Update RDFox shell commands for RDFox 7.2
- Update console URLs for RDFox 7.2
- Add ability to upload/delete Datalog rules from selection

## 1.3.3 (15 April 2024)
- Replace function ROLE with AGENT for RDFox version 7.1

## 1.3.2 (9 February 2024)
- Update configuration defaults to match new setting names in VS Code

## 1.3.1 (8 February 2024)
- Fix extension build to include dependencies

## 1.3.0 (6 February 2024)
- Add highlighting for RDFox built-in tuple tables
- Improve highlighting of function names directly preceded by '!'
- Improve autocompletion for GROUP_CONCAT
- Update SPARQL functions and RDFox commands for RDFox 7.0

## 1.2.0 (14 September 2023)
- Add autocompletion and help text for RDFox commands
- Add autocompletion for SPARQL functions
- Add button to open a query in RDFox console
- Add buttons to add/delete a Datalog rule
- Add settings that determine an RDFox datastore to target with the above
- Add configuration defaults for better word-based autocompletion when working with RDF data
- Update SPARQL functions for RDFox 6.3

## 1.1.0 (28 July 2023)
- Add hover functionality for command documentation in RDFox shell scripts
- Fix highlighting of line continuation symbol when followed by whitespace in RDFox shell scripts
- Update commands highlighted in RDFox shell scripts for RDFox 6.3

## 1.0.4 (15 December 2022)
- Fix highlighting of single-quoted literals with double quotes inside ([Issue #4](https://github.com/OxfordSemantic/vscode-rdfox-rdf/issues/4))

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