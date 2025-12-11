export interface CommandMap {
    [key: string]: {
        displayName: string,
        link: string,
        html: string,
        helpText: string
    }
}

export interface FunctionMap {
    [key: string]: {
        snippetEnd: string
    }
}

export interface MimeMap {
    [key: string]: string
}

export interface ContentResponse {
    error: string[],
    prefix: {
        [key: string]: string
    },
    information: {
        aborted?: boolean,
    } & {
        [key: string]: number
    }
}