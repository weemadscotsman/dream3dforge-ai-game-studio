// Shim to replace @google/genai imports so we don't break the browser build
// with Node.js specific dependencies.

export enum Type {
    UNSPECIFIED = "UNSPECIFIED",
    STRING = "STRING",
    NUMBER = "NUMBER",
    INTEGER = "INTEGER",
    BOOLEAN = "BOOLEAN",
    ARRAY = "ARRAY",
    OBJECT = "OBJECT"
}

export interface Schema {
    type?: Type | string;
    format?: string;
    description?: string;
    nullable?: boolean;
    enum?: string[];
    properties?: { [key: string]: Schema };
    required?: string[];
    items?: Schema;
}
