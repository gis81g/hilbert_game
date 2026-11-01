import type { Formula, Theorem, Derivation } from './type'
import { Operation, axioms, equivalent, normalise } from './logic'


const variable_shift = (formula: Formula): Formula => {
    switch (formula.type) {
        case 'var':
            return Operation.var(`${formula.name}'`)

        case 'neg':
            return Operation.not(variable_shift(formula.body))

        case 'imp':
            return Operation.imp(variable_shift(formula.prem), variable_shift(formula.conc))
    }
}

const modus_ponens = ([premise, implication]: Formula[]): Formula | null => {
    if (implication.type !== 'imp') return null

    const subst = new Map<string, Formula>()
    const resolve = (formula: Formula): Formula => {
        if (formula.type !== 'var') return formula

        let result: Formula = formula
        const path: string[] = []
        while (result.type === 'var' && subst.has(result.name)) {
            path.push(result.name)
            result = subst.get(result.name)!
        }
        for (const name of path) subst.set(name, result)

        return result
    }

    const occurs_in_resolved = (key: string, formula: Formula): boolean => {
        const resolved = resolve(formula)
        switch (resolved.type) {
            case 'var':
                return resolved.name === key

            case 'neg':
                return occurs_in_resolved(key, resolved.body)

            case 'imp':
                return occurs_in_resolved(key, resolved.prem) || occurs_in_resolved(key, resolved.conc)
        }
    }

    const unify = (left: Formula, right: Formula): boolean => {
        const resolved_left = resolve(left)
        const resolved_right = resolve(right)

        if (resolved_left.type === 'var' && resolved_right.type === 'var' && resolved_left.name === resolved_right.name) return true

        if (resolved_left.type === 'var') {
            if (occurs_in_resolved(resolved_left.name, resolved_right)) return false
            subst.set(resolved_left.name, resolved_right)
            return true
        } else if (resolved_right.type === 'var') {
            if (occurs_in_resolved(resolved_right.name, resolved_left)) return false
            subst.set(resolved_right.name, resolved_left)
            return true
        }

        if (resolved_left.type === 'neg' && resolved_right.type === 'neg') return unify(resolved_left.body, resolved_right.body)
        else if (resolved_left.type === 'imp' && resolved_right.type === 'imp') return unify(resolved_left.prem, resolved_right.prem) && unify(resolved_left.conc, resolved_right.conc)
        else return false
    }

    const final_resolve = (formula: Formula): Formula => {
        const resolved = resolve(formula)
        switch (resolved.type) {
            case 'var':
                return resolved

            case 'neg':
                const new_body = final_resolve(resolved.body)
                return new_body === resolved.body ? resolved : Operation.not(new_body)

            case 'imp':
                const new_prem = final_resolve(resolved.prem)
                const new_conc = final_resolve(resolved.conc)
                return (new_prem === resolved.prem && new_conc === resolved.conc) ? resolved : Operation.imp(new_prem, new_conc)
        }
    }

    if (unify(variable_shift(premise), implication.prem)) return normalise(final_resolve(implication.conc))
    else return null
}

export class Theorems {
    readonly theorems: Theorem[]
    constructor() {
        this.theorems = []
    }

    private invalid = 0

    private construct = (derivation: Derivation[]): Theorem | null => {
        let stack: Formula[] = []
        let count = 0
        const used_theorem = new Map<number, number>()
        for (const step of derivation) {
            const type = step.type
            if (type !== 'modus_ponens') {
                const index = step.index - 1
                switch (type) {
                    case 'axiom':
                        stack.push(axioms[index])
                        break;

                    case 'theorem':
                        const theorem = this.theorems[index - this.invalid]
                        if (!theorem) return null
                        stack.push(theorem.formula)
                        used_theorem.set(index, theorem.steps)
                        break;
                }
            } else if (stack.length >= 2 && type === 'modus_ponens') {
                const conclusion = modus_ponens(stack.splice(stack.length - 2))
                if (!conclusion) return null
                stack.push(conclusion)
                count++
            } else return null
        }
        return stack.length === 1 ? { steps: count + [...used_theorem.values()].reduce((total, value) => total + value, 0), formula: stack[0], derivation: derivation } : null
    }

    examinate = (theorem: Theorem): boolean => {
        const constructed = this.construct(theorem.derivation)
        if (!constructed) {
            this.invalid++
            return false
        }

        const subst = new Map<string, Formula>()
        const is_instance_of = (candidate: Formula, root: Formula): boolean => {
            const type = candidate.type
            switch (root.type) {
                case 'var':
                    const name = root.name

                    const content = subst.get(name)
                    if (content) return equivalent(content, candidate)

                    subst.set(name, candidate)
                    return true

                case 'neg':
                    return type === 'neg' && is_instance_of(candidate.body, root.body)

                case 'imp':
                    return type === 'imp' && is_instance_of(candidate.prem, root.prem) && is_instance_of(candidate.conc, root.conc)
            }
        }

        if (constructed.steps === theorem.steps && is_instance_of(theorem.formula, variable_shift(constructed.formula))) {
            this.theorems.push(constructed)
            return true
        } else {
            this.invalid++
            return false
        }
    }
}