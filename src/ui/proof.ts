import type { Formula, Theorem, Derivation, ProofStep } from '../core/type'
import { modus_ponens, equivalent, normalise } from '../core/logic'
import { formula_to_string } from '../core/parser'


const goalDiv = document.querySelector('#proof-goal') as HTMLDivElement
const goalMsg = goalDiv.querySelector('#msg-goal') as HTMLDivElement
const goalDisp = goalDiv.querySelector('#goal-formula') as HTMLDivElement
const goalBtn = goalDiv.querySelector('#btn-goal') as HTMLButtonElement

const startMsg = document.querySelector('#msg-start') as HTMLPreElement
const proofBox = document.querySelector('#proof-box') as HTMLDivElement
const mpBtn = document.querySelector('#btn-mp') as HTMLButtonElement

const proofMsg = document.querySelector('#right-foot') as HTMLDivElement
const registed = document.querySelector('#regist-formula') as HTMLSpanElement
const registBtn = document.querySelector('#btn-regist') as HTMLButtonElement


const reset = (goal: Formula): void => {
    goalMsg.hidden = true
    goalDisp.textContent = formula_to_string(goal)
    startMsg.hidden = false
    proofBox.innerHTML = ''
    proofMsg.hidden = true
}

const create_node = (index: number, step: ProofStep, on_clicked: (index: number) => void): void => {
    const expression = formula_to_string(step.formula)
    const just = step.justification

    startMsg.hidden = true

    const node = document.createElement('div')
    node.className = 'node-step'
    node.innerHTML = `
        <div class="step-tag">(${index})</div>
        <span class="formula preview">${expression}</span>
    `
    node.addEventListener('click', () => {
        on_clicked(index)
        node.classList.toggle('selected')
    })

    const copy = document.createElement('div')
    copy.className = 'copy'
    copy.textContent = '❏'
    copy.addEventListener('click', async (event: Event) => {
        event.stopPropagation()
        await navigator.clipboard.writeText(expression);
        popup.hidden = false
        setTimeout(() => popup.hidden = true, 1500)
    })

    const popup = document.createElement('div')
    popup.className = 'popup'
    popup.innerText = 'coppied'
    popup.hidden = true
    copy.appendChild(popup)

    const tag = document.createElement('div')
    tag.className = 'just-tag'
    tag.innerText = just.type === 'MP' ? `MP<${just.premise},${just.implication}>` : `${just.type}${just.index}`

    node.append(copy, tag)
    proofBox.appendChild(node)
}


export class Proof {
    goal!: Formula
    steps = Array<ProofStep>()
    selected = Array<number>()
    implication: Formula | null = null

    constructor(open_modal: (stored?: Formula) => void, add_theorem: (theorem: Theorem) => void) {
        goalBtn.addEventListener('click', () => open_modal(this.goal))

        mpBtn.addEventListener('click', () => {
            const result = this.implication!

            this.add_step({
                step: 1,
                formula: result,
                justification: { type: 'MP', premise: this.selected[0], implication: this.selected[1] }
            })

            this.selected = []
            this.implication = null
            proofBox.querySelectorAll('.selected').forEach(dom => dom.classList.remove('selected'))



            mpBtn.disabled = true
        })
        mpBtn.disabled = true

        registBtn.addEventListener('click', () => {
            const derivations = Array<Derivation[]>()
            const costs = Array<{ mp: number, th: Map<number, number> }>()

            this.steps.forEach(step => {
                switch (step.justification.type) {
                    case 'AX':
                        derivations.push([{ type: 'axiom', index: step.justification.index }])
                        costs.push({ mp: 0, th: new Map<number, number>() })
                        break

                    case 'TH':
                        derivations.push([{ type: 'theorem', index: step.justification.index }])
                        costs.push({ mp: 0, th: new Map([[step.justification.index, step.step]]) })
                        break

                    case 'MP':
                        const premise_index = step.justification.premise - 1
                        const implication_index = step.justification.implication - 1
                        derivations.push([...derivations[premise_index], ...derivations[implication_index], { type: 'modus_ponens' }])
                        costs.push({ mp: costs[premise_index].mp + costs[implication_index].mp + 1, th: new Map([...costs[premise_index].th, ...costs[implication_index].th]) })
                        break
                }
            })

            const goal_index = this.steps.findIndex(step => equivalent(step.formula, this.goal))

            add_theorem({
                steps: costs[goal_index].mp + [...costs[goal_index].th.values()].reduce((total, value) => total + value, 0),
                formula: normalise(this.goal),
                derivation: derivations[goal_index]
            })

            open_modal()
        })
    }

    set_goal = (goal: Formula): void => {
        this.goal = goal
        this.steps = []
        this.selected = []
        this.implication = null
        reset(goal)
    }

    add_step = (step: ProofStep): void => {
        this.steps.push(step)
        create_node(
            this.steps.length,
            step,
            (index: number) => {
                const region = this.selected.indexOf(index)
                if (region >= 0) this.selected.splice(region, 1)
                else this.selected.push(index)

                this.implication = this.apply_mp()
                mpBtn.disabled = !this.implication
            }
        )

        if (equivalent(step.formula, this.goal)) {
            proofMsg.hidden = false
            registed.textContent = formula_to_string(step.formula)
        }
    }

    private apply_mp = (): Formula | null => {
        if (this.selected.length !== 2) return null

        const [left, right] = [this.steps[this.selected[0] - 1].formula, this.steps[this.selected[1] - 1].formula]
        let result: Formula

        try {
            result = modus_ponens(left, right)
        } catch {
            try {
                this.selected.reverse()
                result = modus_ponens(right, left)
            } catch { return null }
        }

        return result
    }
}