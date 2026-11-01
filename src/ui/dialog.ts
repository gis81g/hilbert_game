import type { Formula } from '../core/type'
import { is_tautology } from '../core/logic'
import { formula_to_string, string_to_formula } from '../core/parser'


const modal = document.createElement('dialog')
modal.addEventListener('cancel', (event: Event) => event.preventDefault())

const head = document.createElement('div')
head.className = 'modal-head'
head.innerHTML = '<h2>Proof Goal</h2>'

const desc = document.createElement('p')
head.appendChild(desc)

const form = document.createElement('form')

const input = document.createElement('input')
input.type = 'text'
input.id = 'inp-goal'
input.placeholder = 'A → A'
input.addEventListener('keydown', (event: KeyboardEvent) => {
    if (event.key === 'Enter') {
        event.preventDefault()
        ok.click()
    }
})

const msg = document.createElement('span')

const buttons = document.createElement('div')
buttons.className = 'buttons'

const cancel = document.createElement('button')
cancel.textContent = 'cancel'
cancel.addEventListener('click', (event: Event) => {
    event.preventDefault()
    modal.close()
})

const ok = document.createElement('button')
ok.textContent = 'OK'

buttons.appendChild(ok)

form.append(input, msg, buttons)

modal.append(head, form)
document.body.appendChild(modal)


export const set_modal = (set_goal: (goal: Formula) => void): void => {
    ok.addEventListener('click', (event: Event) => {
        event.preventDefault()
        const goal = string_to_formula(input.value)
        if (is_tautology(goal)) {
            set_goal(goal)
            modal.close()
            form.reset()
        } else msg.innerText = 'input must be a tautology'

    })

    open_modal()
}

export const open_modal = (stored?: Formula): void => {
    if (!stored) {
        desc.innerText = 'set a goal to prove'
    } else {
        desc.innerText = 'change the goal to prove'
        input.value = formula_to_string(stored)
        buttons.appendChild(cancel)
    }

    modal.showModal()
    input.focus()
}