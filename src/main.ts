import { Proof } from './ui/proof'
import { initiate, add_theorem } from './ui/theorem'
import { set_modal, open_modal } from './ui/dialog'

const proof = new Proof(open_modal, add_theorem)

initiate(proof.add_step)
set_modal(proof.set_goal)
open_modal()