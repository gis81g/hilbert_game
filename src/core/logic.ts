import type { Formula } from './type'
import { MPError } from './error'


export const META_VARIABLE_NAMES = ['p', 'q', 'r', 's', 't', 'u', 'v', 'w', 'x', 'y', 'z']

const Var = (name: string): Formula => ({ type: 'var', name })
const Imp = (prem: Formula, conc: Formula): Formula => ({ type: 'imp', prem, conc })
const Not = (body: Formula): Formula => ({ type: 'neg', body })
const And = (left: Formula, right: Formula): Formula => Not(Imp(left, Not(right)))
const Or = (left: Formula, right: Formula): Formula => Imp(Not(left), right)

export const Operation = { var: Var, imp: Imp, not: Not, and: And, or: Or, } as const


const Ax1 = (p: Formula, q: Formula): Formula => Imp(p, Imp(q, p))
const Ax2 = (p: Formula, q: Formula, r: Formula): Formula => Imp(Imp(p, Imp(q, r)), Imp(Imp(p, q), Imp(p, r)))
const Ax3 = (p: Formula, q: Formula): Formula => Imp(Imp(Not(p), Not(q)), Imp(q, p))

export const axioms: Formula[] = [
    Ax1(Operation.var('p'), Operation.var('q')),
    Ax2(Operation.var('p'), Operation.var('q'), Operation.var('r'),),
    Ax3(Operation.var('p'), Operation.var('q'))
]


export const equivalent = (p: Formula, q: Formula): boolean => {
    if (p.type !== q.type) return false

    if (p.type === 'var' && q.type === 'var') return p.name === q.name
    else if (p.type === 'neg' && q.type === 'neg') return equivalent(p.body, q.body)
    else if (p.type === 'imp' && q.type === 'imp') return equivalent(p.prem, q.prem) && equivalent(p.conc, q.conc)
    else return false
}

export const modus_ponens = (prem: Formula, imp: Formula): Formula => {
    if (imp.type !== 'imp') throw new MPError('INVALID_INFERENCE', 'the second argument must be an implication')

    if (equivalent(imp.prem, prem)) return imp.conc
    else throw new MPError('UNMATCHED_PREMISE', 'the premise of the second argument does not match the first one')
}

export const substitute = (formula: Formula, substitution: Map<string, Formula>): Formula => {
    switch (formula.type) {
        case 'var':
            return substitution.get(formula.name) ?? formula

        case 'neg':
            return {
                type: 'neg',
                body: substitute(formula.body, substitution)
            }

        case 'imp':
            return {
                type: 'imp',
                prem: substitute(formula.prem, substitution),
                conc: substitute(formula.conc, substitution)
            }
    }
}

export const get_variables = (formula: Formula): string[] => {
    const variables = new Set<string>()
    const traverse = (f: Formula): void => {
        switch (f.type) {
            case 'var':
                variables.add(f.name)
                break

            case 'neg':
                traverse(f.body)
                break

            case "imp":
                traverse(f.prem)
                traverse(f.conc)
                break
        }
    }

    traverse(formula)
    return Array.from(variables)
}

export const normalise = (formula: Formula): Formula => {
    const variables = get_variables(formula)
    const length = variables.length
    if (length > 11) throw new MPError('TOO_MANY_VARIABLES')

    const subst = new Map<string, Formula>()
    variables.forEach((char, i) => subst.set(char, Var(META_VARIABLE_NAMES[i])))
    return substitute(formula, subst)
}

export const is_tautology = (formula: Formula): boolean => {
    const variables = get_variables(formula)
    const length = variables.length
    if (length > 11) throw new MPError('TOO_MANY_VARIABLES', 'too many variables')

    for (let i = 0; i < 1 << length; i++) {
        const value = new Map<string, boolean>()
        for (let j = 0; j < length; j++) value.set(variables[j], !!((i >> j) & 1))

        const evaluate = (formula: Formula): boolean => {
            switch (formula.type) {
                case 'var':
                    return value.get(formula.name)!

                case 'neg':
                    return !evaluate(formula.body)

                case 'imp':
                    return !evaluate(formula.prem) || evaluate(formula.conc)
            }
        }

        if (!evaluate(formula)) return false
    }

    return true
}