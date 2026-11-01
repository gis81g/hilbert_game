export type Formula =
    | { type: 'var', name: string }
    | { type: 'neg', body: Formula }
    | { type: 'imp', prem: Formula, conc: Formula }

export type AxiomIndex = 1 | 2 | 3

export type Theorem = {
    steps: number
    formula: Formula
    derivation: Derivation[]
}

export type Derivation =
    | { type: 'axiom', index: AxiomIndex }
    | { type: 'theorem', index: number }
    | { type: 'modus_ponens' }

export type ProofStep = {
    step: number
    formula: Formula
    justification: Justification
}

export type Justification =
    | { type: 'AX', index: AxiomIndex }
    | { type: 'TH', index: number }
    | { type: 'MP', premise: number, implication: number }