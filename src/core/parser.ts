import type { Formula, Derivation } from './type'
import { ParserError, SavedDataError } from './error'
import { Operation } from './logic'


const operators = {
    imp: ['->', '=>', '→', '⇒', '>'],
    not: ['~', '¬', '￢'],
    and: ['&&', '&', '∧'],
    or: ['||', '|', '∨'],
    left: ['('],
    right: [')'],
}

const all_operators = Object.values(operators).flat().sort((a, b) => b.length - a.length).map(str => str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))

type ParenthesisTree = string | ParenthesisTree[]

export const string_to_formula = (expression: string): Formula => {
    const root: ParenthesisTree[] = []
    let curent = root
    const stack: ParenthesisTree[][] = []

    const compact = expression.replace(/\s+/g, '')
    const tokens = compact.match(new RegExp(`${all_operators.join('|')}|(\\w+)`, 'g')) || []
    if (tokens.join('') !== compact) throw new ParserError('INVALID_FORMULA', 'the input contains an invalid character')

    for (const token of tokens) {
        if (operators.left.includes(token)) {
            const next: ParenthesisTree[] = []
            curent.push(next)
            stack.push(curent)
            curent = next
        }
        else if (operators.right.includes(token)) {
            if (stack.length === 0) throw new ParserError('INVALID_FORMULA', "token '(' expected")
            else curent = stack.pop()!
        }
        else curent.push(token)
    }
    if (stack.length > 0) throw new ParserError('INVALID_FORMULA', "token ')' expected")

    const tree_to_formula = (root: ParenthesisTree): Formula => {
        if (typeof root === 'string') return Operation.var(root)

        const length = root.length

        if (length === 0) throw new ParserError('NO_FORMULA', 'no formula input')

        if (length === 1) return tree_to_formula(root[0])

        let index: number = 0
        while (index < length) {
            const item: ParenthesisTree = root[index]
            if (typeof item === 'string' && operators.imp.includes(item)) break
            index++
        }
        if (index < length) {
            if (index === 0 || length - index === 1) throw new ParserError('INVALID_FORMULA', 'implication requires one formula before and one after the symbol')

            return Operation.imp(tree_to_formula(root.slice(0, index)), tree_to_formula(root.slice(index + 1)))
        }

        index = 0
        while (index < length) {
            const item = root[index]
            if (typeof item === 'string' && operators.or.includes(item)) break
            index++
        }
        if (index < length) {
            if (index === 0 || length - index === 1) throw new ParserError('INVALID_FORMULA', 'disjunction requires one formula before and one after the symbol')

            return Operation.or(tree_to_formula(root.slice(0, index)), tree_to_formula(root.slice(index + 1)))
        }

        index = 0
        while (index < length) {
            const item = root[index]
            if (typeof item === 'string' && operators.and.includes(item)) break
            index++
        }
        if (index < length) {
            if (index === 0 || length - index === 1) throw new ParserError('INVALID_FORMULA', 'conjunction requires one formula before and one after the symbol')

            return Operation.and(tree_to_formula(root.slice(0, index)), tree_to_formula(root.slice(index + 1)))
        }

        const item = root[0]
        if (typeof item === 'string' && operators.not.includes(item)) {
            if (length === 1) throw new ParserError('INVALID_FORMULA', 'negation requires one formula after the symbol')

            return Operation.not(tree_to_formula(root.slice(1)))
        }

        throw new ParserError('UNKNOWN')
    }

    return tree_to_formula(root)
}

export const formula_to_string = (formula: Formula): string => {
    switch (formula.type) {
        case 'var':
            return formula.name

        case 'neg':
            return `¬${formula_to_string(formula.body)}`

        case 'imp':
            return `(${formula_to_string(formula.prem)} → ${formula_to_string(formula.conc)})`
    }
}

export const string_to_derivation = (expression: string): Derivation[] => {
    const result: Derivation[] = []
    let stack = ''

    for (const token of expression) {
        if ('0' <= token && token <= '9') {
            stack += token
        } else {
            const index = Number(stack)
            stack = ''

            switch (token) {
                case 'A':
                    if (index !== 1 && index !== 2 && index !== 3) throw new SavedDataError('INVALID_SAVED_DATA')
                    result.push({ type: 'axiom', index })
                    break;

                case 'T':
                    if (index === 0) throw new SavedDataError('INVALID_SAVED_DATA')
                    result.push({ type: 'theorem', index })
                    break;

                case 'M':
                    result.push({ type: 'modus_ponens' })
                    break;

                default:
                    throw new SavedDataError('INVALID_SAVED_DATA')
            }
        }
    }
    return result
}

export const derivation_to_string = (derivation: Derivation[]): string => {
    let result = ''
    for (const step of derivation) {
        switch (step.type) {
            case 'axiom':
                result += `${step.index}A`
                break;

            case 'theorem':
                result += `${step.index}T`
                break;

            case 'modus_ponens':
                result += 'M'
                break;
        }
    }
    return result
}