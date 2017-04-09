'use strict'

var Cell = require('./cell')
var atom = require('./atom')

/**
 * Nock is a combinator interpreter on nouns. A noun is an atom or a cell.
 * An atom is an unsigned integer of any size; a cell is an ordered pair of nouns.
 *
 * @see http://urbit.org/docs/nock/definition/
 * @see http://media.urbit.org/whitepaper.pdf
 */

var useMacros = false
var callbacks = {}

/*
 *  code conventions:
 *
 *    `n` is a noun,
 *    `s` is a subject noun,
 *    `f` is a formula (or cell of formulas)
 */

/*  operators  */

/**
 * wut (?): test for atom (1) or cell (0)
 *
 *   ?[a b]           0
 *   ?a               1
 */
function wut (n) {
  return (n.hed === undefined) ? 1 : 0
}

/**
 * lus (+): increment an atom
 *
 *   +[a b]           +[a b]
 *   +a               1 + a
 */
function lus (n) {
  if (wut(n) === 0) throw new Error('lus cell')
  return atom.incr(n)
}

/**
 * tis (=): test equality
 *
 *   =[a a]           0
 *   =[a b]           1
 *   =a               =a
 */
function tis (n) {
  if (wut(n) === 1) throw new Error('tis atom')
  return +!n.equal()
}

/**
 * fas (/): resolve a tree address
 *
 *   /[1 a]           a
 *   /[2 a b]         a
 *   /[3 a b]         b
 *   /[(a + a) b]     /[2 /[a b]]
 *   /[(a + a + 1) b] /[3 /[a b]]
 *   /a               /a
 */
function fas (addr, n) {
  if (addr === 1) return n
  if (n.slot === undefined) return
  return n.slot(addr)
}

/*  formulas  */

/**
 * slot (0): resolve a tree address
 *
 *   *[a 0 b]         /[b a]
 */
function slot (s, f) {
  var p = fas(f, s)

  if (p === undefined) throw new Error('invalid fas addr: ' + f)

  return p
}

/**
 * constant (1): return the formula regardless of subject
 *
 *   *[a 1 b]  b
 */
function constant (s, f) {
  return f
}

/**
 * evaluate (2): evaluate the product of second formula against the product of the first
 *
 *   *[a 2 b c]  *[*[a b] *[a c]]
 */
function evaluate (s, f) {
  return nock(nock(s, f.hed), nock(s, f.tal))
}

/**
 * deep (3): test if the product is a cell
 *
 *   *[a 3 b]         ?*[a b]
 */
function deep (s, f) {
  return wut(nock(s, f))
}

/**
 *  incr (4): increment the product
 *
 *   *[a 4 b]         +*[a b]
 */
function incr (s, f) {
  return lus(nock(s, f))
}

/**
 * eq (5): test for equality between nouns in the product
 *
 *   *[a 5 b]         =*[a b]
 */
function eq (s, f) {
  return tis(nock(s, f))
}

/*  macro-formulas  */

/**
 * ife (6): if/then/else
 *
 *   *[a 6 b c d]      *[a 2 [0 1] 2 [1 c d] [1 0] 2 [1 2 3] [1 0] 4 4 b]
 */
function macroIfe (s, f) {
  return nock(s,
    Cell.trel(2,
      Cell(0, 1),
      Cell.quad(2,
        Cell.trel(1, f.tal.hed, f.tal.tal),
        Cell(1, 0),
        Cell.trel(2,
          Cell.trel(1, 2, 3),
          Cell.quad(Cell(1, 0), 4, 4, f.hed)
        )
      )
    )
  )
}

function ife (s, f) {
  var cond = nock(s, f.hed)

  if (cond === 0) return nock(s, f.tal.hed)
  if (cond === 1) return nock(s, f.tal.tal)

  throw new Error('invalid ife conditional')
}

/**
 * compose (7): evaluate formulas composed left-to-right
 *
 *   *[a 7 b c]  *[a 2 b 1 c]
 */
function macroCompose (s, f) {
  return nock(s, Cell.quad(2, f.hed, 1, f.tal))
}

function compose (s, f) {
  return nock(nock(s, f.hed), f.tal)
}

/**
 * extend (8): evaluate the second formula against [product of first, subject]
 *
 *   *[a 8 b c]  *[a 7 [[7 [0 1] b] 0 1] c]
 */
function macroExtend (s, f) {
  return nock(s, Cell.trel(7, Cell(Cell.trel(7, Cell(0, 1), f.hed), Cell(0, 1)), f.tal))
}

function extend (s, f) {
  return nock(Cell.pair(nock(s, f.hed), s), f.tal)
}

/**
 * invoke (9): construct a core and evaluate one of its arms against itself
 *
 *   *[a 9 b c]  *[a 7 c 2 [0 1] 0 b]
 */
function macroInvoke (s, f) {
  return nock(s, Cell.quad(7, f.tal, 2, Cell.trel(Cell(0, 1), 0, f.hed)))
}

function invoke (s, f) {
  var core = nock(s, f.tal)
  var next = !callbacks['9'] ? null : callbacks['9'](core, f.hed)

  if (next) return next()
  return nock(core, slot(core, f.hed))
}

/**
 * hint (10): skip first formula, evaluate second
 *
 *   *[a 10 [b c] d]  *[a 8 c 7 [0 3] d]
 *   *[a 10 b c]      *[a c]
 */
function macroHint (s, f) {
  if (wut(f.hed) === 0) return nock(s, Cell.trel(8, f.hed.tal, Cell.trel(7, Cell(0, 3), f.tal)))
  return nock(s, f.tal)
}

function hint (s, f) {
  var next = null

  if (wut(f.hed) === 0) {
    if (wut(f.hed.tal) === 1) throw new Error('invalid hint') // TODO: ???

    if (callbacks['10']) {
      next = callbacks['10'](s, f)
    } else {
      nock(s, f.hed.tal)
    }
  }

  if (next) return next()

  return nock(s, f.tal)
}

/*  indexed formula functions  */
var macroFormulas = [slot, constant, evaluate, deep, incr, eq, macroIfe, macroCompose, macroExtend, macroInvoke, macroHint]
var formulas = [slot, constant, evaluate, deep, incr, eq, ife, compose, extend, invoke, hint]

/**
 * nock (*)
 *
 * the nock function
 *
 *   *[a [b c] d]     [*[a b c] *[a d]]
 *   *a               *a
 */
function nock (s, f) {
  if (wut(f.hed) === 0) return Cell.pair(nock(s, f.hed), nock(s, f.tal))

  var idx = f.hed

  if (idx == null || idx > 10) throw new Error('invalid formula: ' + idx)

  if (useMacros) return macroFormulas[idx](s, f.tal)

  return formulas[idx](s, f.tal)
}

function registerCallbacks (obj) {
  if (useMacros) throw new Error('macros')

  if (obj['9']) {
    if (typeof obj['9'] !== 'function') throw new Error('bad 9 callback')

    callbacks['9'] = obj['9']
  }

  if (obj['10']) {
    if (typeof obj['10'] !== 'function') throw new Error('bad 10 callback')

    callbacks['10'] = obj['10']
  }
}

module.exports = {
  nock: nock,
  useMacros: function (arg) {
    useMacros = arg === undefined || arg
    return this
  },
  callbacks: function (obj) {
    registerCallbacks(obj)
    return this
  },
  operators: {
    wut: wut,
    lus: lus,
    tis: tis,
    fas: fas
  },
  formulas: {
    slot: slot,
    constant: constant,
    evaluate: evaluate,
    deep: deep,
    incr: incr,
    eq: eq,
    macroIfe: macroIfe,
    ife: ife,
    macroCompose: macroCompose,
    compose: compose,
    macroExtend: macroExtend,
    extend: extend,
    macroInvoke: macroInvoke,
    invoke: invoke,
    macroHint: macroHint,
    hint: hint
  }
}
