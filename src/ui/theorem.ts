import type { Formula, AxiomIndex, Theorem, Justification, ProofStep } from '../core/type'
import { META_VARIABLE_NAMES, axioms, get_variables, substitute } from '../core/logic'
import { formula_to_string, string_to_formula, derivation_to_string, string_to_derivation } from '../core/parser'
import { Theorems } from '../core/derivation'


type Cache = {
    steps: number
    formula: string
    derivation: string
}

type AddStep = (step: ProofStep) => void

const STORAGE_KEY = 'hilbert_proof_game_saved_theorems'
const cache = localStorage.getItem(STORAGE_KEY)

const DEFAULT_SUBSTITUTION_NAMES = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K']

const body = document.querySelector('#left-body-proved') as HTMLDivElement

let saved = Array<Theorem>()
let add_step: AddStep

if (cache) (JSON.parse(cache) as Cache[]).forEach(data => saved.push({
    steps: data.steps,
    formula: string_to_formula(data.formula),
    derivation: string_to_derivation(data.derivation)
}))


const reset = (callback: AddStep): void => {
    body.innerHTML = ''
    add_step = callback
}

const create_node = (type: 'AX' | 'TH', index: number, theorem: Theorem): void => {
    const node = document.createElement('div')
    node.className = 'node'

    const head = document.createElement('div')
    head.className = 'node-head'
    head.innerHTML = `
        <div class="${type.toLowerCase()}-tag tag">${type}${index}</div>
        ${type == 'AX' ? '' : `<div class="step-tag">(${theorem.steps})</div>`}
        <span class="formula preview">${formula_to_string(theorem.formula)}</span>
        <div class="arrow">▶</div>
    `
    head.addEventListener('click', () => {
        node.classList.toggle('opened')
        if (node.classList.contains('opened') && inputs[0]) inputs[0].focus({preventScroll: true})
    })

    const folder = document.createElement('form')
    folder.className = 'node-folder'

    let inputs = Array<HTMLInputElement>()
    for (let i = 0; i < get_variables(theorem.formula).length; i++) {
        const id = `inp-${type.toLowerCase()}${index}-${i}`
        const group = document.createElement('div')
        group.className = 'form-group'
        group.innerHTML = `<label for="${id}">${META_VARIABLE_NAMES[i]}:</label>`

        const input = document.createElement('input')
        input.type = 'text'
        input.className = 'inp-subst'
        input.id = id
        input.placeholder = DEFAULT_SUBSTITUTION_NAMES[i]
        input.addEventListener('keydown', (event: KeyboardEvent) => {
            if (event.key === 'Enter') {
                event.preventDefault()
                const next = inputs[i + 1]
                if (next) next.focus()
                else {
                    input.blur()
                    button.click()
                }
            }
        })

        inputs.push(input)
        group.appendChild(input)
        folder.appendChild(group)
    }

    const button = document.createElement('button')
    button.className = 'btn-subst'
    button.textContent = 'APPLY'
    button.addEventListener('click', (event: Event) => {
        event.preventDefault()
        const subst = new Map<string, Formula>()
        inputs.forEach((input, i) => subst.set(
            META_VARIABLE_NAMES[i],
            string_to_formula(input.value || DEFAULT_SUBSTITUTION_NAMES[i])
        ))
        add_step({
            step: theorem.steps,
            formula: substitute(theorem.formula, subst),
            justification: { type: type, index: index } as Justification
        })
        folder.reset()
    })
    folder.appendChild(button)

    node.append(head, folder)
    body.appendChild(node)
}


export const initiate = (callback: AddStep): void => {
    reset(callback)

    for (let index = 1; index <= 3; index++) {
        create_node('AX', index, {
            steps: 0,
            formula: axioms[index - 1],
            derivation: [{ type: 'axiom', index: index as AxiomIndex }]
        })
    }

    const initial = new Theorems
    let i = 0

    saved.forEach((data) => {
        if (initial.examinate(data)) create_node('TH', ++i, data)
        else console.error('invalid saved data')
    })

    saved = initial.theorems
}

export const add_theorem = (theorem: Theorem): void => {
    saved.push(theorem)
    create_node('TH', saved.length, theorem)

    const cache = Array<Cache>()

    saved.forEach(data => cache.push({
        steps: data.steps,
        formula: formula_to_string(data.formula),
        derivation: derivation_to_string(data.derivation)
    }))

    localStorage.setItem(STORAGE_KEY, JSON.stringify(cache))
}