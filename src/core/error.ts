type ErrorCode =
    | 'MODUS_PONENS'
    | 'PARSER'
    | 'SAVED_DATA'

abstract class BaseError extends Error {
    abstract readonly brand: ErrorCode
    constructor(message: string) {
        super(message);
        this.name = this.constructor.name
    }
}

type MPErrorCode =
    | 'UNMATCHED_PREMISE'
    | 'INVALID_INFERENCE'
    | 'TOO_MANY_VARIABLES'
    | 'UNKNWON'

export class MPError extends BaseError {
    readonly brand: ErrorCode = 'MODUS_PONENS'
    readonly code: MPErrorCode
    constructor(code: MPErrorCode, message: string = 'failed to apply modus ponens') {
        super(`MODUS PONENS ERROR: ${message}`)
        this.code = code
    }
}

type ParserErrorCode =
    | 'INVALID_FORMULA'
    | 'NO_FORMULA'
    | 'UNKNOWN'

export class ParserError extends BaseError {
    readonly brand: ErrorCode = 'PARSER'
    readonly code: ParserErrorCode
    constructor(code: ParserErrorCode, message: string = 'failed to analyse the syntax') {
        super(`PARSER ERROR: ${message}`)
        this.code = code
    }
}

type SavedDataErrorCode =
    | 'INVALID_SAVED_DATA'
    | 'UNKNOWN'

export class SavedDataError extends BaseError {
    readonly brand: ErrorCode = 'SAVED_DATA'
    readonly code: SavedDataErrorCode
    constructor(code: SavedDataErrorCode, message: string = 'invalid saved data') {
        super(`SAVED DATA ERROR: ${message}`)
        this.code = code
    }
}