'use strict';

/**
 * Nock is a combinator interpreter on nouns. A noun is an atom or a cell.
 * An atom is an unsigned integer of any size; a cell is an ordered pair of nouns.
 *
 * @see http://urbit.org/docs/theory/whitepaper#-nock
 */

var useMacros = false;

/*
 *  code conventions:
 *
 *    `n` is a noun,
 *    `s` is a subject noun,
 *    `f` is a formula (or cell of formulas)
 */

/*** operators ***/

/**
 * wut (?): test for atom (1) or cell (0)
 *
 *   ?[a b]           0
 *   ?a               1
 */
function wut(n) {
  return typeof n === 'number' ? 1 : 0
}

/**
 * lus (+): increment an atom
 *
 *   +[a b]           +[a b]
 *   +a               1 + a
 */
function lus(n) {
  if (wut(n) === 0) throw new Error('lus cell')
  return 1 + n
}

/**
 * tis (=): test equality
 *
 *   =[a a]           0
 *   =[a b]           1
 *   =a               =a
 */
function tis(n) {
  if (wut(n) === 1) throw new Error('tis atom')
  // TODO: s/b recursive?
  return n[0] === n[1] ? 0 : 1
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
function fas(addr, n) {
  if (n === undefined) throw new Error('invalid fas noun')
  if (addr === 0) throw new Error('invalid fas addr: 0')

  if (addr === 1) return n
  if (addr === 2) return n[0]
  if (addr === 3) return n[1]

  return fas(2 + (addr % 2), fas((addr / 2)|0, n))
}

/*** formulas ***/

/**
 * slot (0): resolve a tree address
 *
 *   *[a 0 b]         /[b a]
 */
function slot(s, f) {
  var p, err

  try { p = fas(f, s) }
  catch (ex) { err = ex }

  if (err) throw err
  if (p === undefined) throw new Error ('invalid fas addr: ' + f)

  return p
}

/**
 * constant (1): return the formula regardless of subject
 *
 *   *[a 1 b]  b
 */
function constant(s, f) {
  return f
}

/**
 * evaluate (2): evaluate the product of second formula against the product of the first
 *
 *   *[a 2 b c]  *[*[a b] *[a c]]
 */
function evaluate(s, f) {
  return nock(nock(s, f[0]), nock(s, f[1]))
}

/**
 * cell (3): test if the product is a cell
 *
 *   *[a 3 b]         ?*[a b]
 */
function cell(s, f) {
  return wut(nock(s, f))
}

/**
 *  incr (4): increment the product
 *
 *   *[a 4 b]         +*[a b]
 */
function incr(s, f) {
  return lus(nock(s, f))
}

/**
 * eq (5): test for equality between nouns in the product
 *
 *   *[a 5 b]         =*[a b]
 */
function eq(s, f) {
  return tis(nock(s, f))
}

/**
 * ife (6): if/then/else
 *
 *   *[a 6 b c d]      *[a 2 [0 1] 2 [1 c d] [1 0] 2 [1 2 3] [1 0] 4 4 b]
 */
function ife_m(s, f) {
  return nock(s, [2, [[0, 1], [2, [[1, [f[1][0], f[1][1]]], [[1, 0], [2, [[1, [2, 3]], [[1, 0], [4, [4, f[0]]]]]]]]]]])
}

function ife(s, f) {
  // TODO: fix; this is the simplified version
  return nock(s, f[0]) === 0 ? nock(s, f[1][0]) : nock(s, f[1][1])
}

/**
 * compose (7): evaluate formulas composed left-to-right
 *
 *   *[a 7 b c]  *[a 2 b 1 c]
 */
function compose_m(s, f) {
  return nock(s, [2, [f[0], [1, f[1]]]])
}

function compose(s, f) {
  // alternate form:
  // return nock(nock(s, f[0]), constant(s, f[1]))
  return nock(nock(s, f[0]), f[1])
}

/**
 * extend (8): evaluate the second formula against [product of first, subject]
 *
 *   *[a 8 b c]  *[a 7 [[7 [0 1] b] 0 1] c]
 */
function extend_m(s, f) {
  return nock(s, [7, [[[7, [[0, 1], f[0]]], [0, 1]], f[1]]])
}

function extend(s, f) {
  // alternate form:
  // return nock([compose(s, [[0, 1], f[0]]), s], f[1])
  return nock([nock(s, f[0]), s], f[1])
}

/**
 * invoke (9): construct a core and evaluate one of it's arms against it
 *
 *   *[a 9 b c]  *[a 7 c 2 [0 1] 0 b]
 */
function invoke_m(s, f) {
  return nock(s, [7, [f[1], [2, [[0, 1], [0, f[0]]]]]])
}

function invoke(s, f) {
  var prod = nock(s, f[1])
  return nock(prod, slot(prod, f[0]))
}

/**
 * hint (10): skip first formula, evaluate second
 *
 *   *[a 10 [b c] d]  *[a 8 c 7 [0 3] d]
 *   *[a 10 b c]      *[a c]
 */
function hint_m(s, f) {
  if (wut(f[0]) === 1) return nock(s, [8, [f[0][1], [7, [[0, 3], f[1][1]]]]])
  return nock(s, f[1])
}

function hint(s, f) {
  if (wut(f[0]) === 1) nock(s, f[0][1])
  return nock(s, f[1])
}

/*** indexed formula functions ***/
var formulas_m = [slot, constant, evaluate, cell, incr, eq, ife_m, compose_m, extend_m, invoke_m, hint_m]
var formulas = [slot, constant, evaluate, cell, incr, eq, ife, compose, extend, invoke, hint]

/**
 * nock (*)
 *
 * the nock function
 *
 *   *[a [b c] d]     [*[a b c] *[a d]]
 *   *a               *a
 */
function nock(s, f) {
  if (wut(f[0]) === 0) return [nock(s, f[0]), nock(s, f[1])]

  if (f[0] > 10) throw new Error('invalid formula: ' + f[0])

  if (useMacros) return formulas_m[f[0]](s, f[1])

  return formulas[f[0]](s, f[1])
}

/* construct a JS noun (group an array into pairs, associating right) */
function assoc(x) {
  if (!x.length) return x

  if (x.length === 1) return assoc(x[0])

  return [assoc(x[0]), assoc(x.slice(1))]
}

/* parse a hoon-serialized nock formula and construct a JS noun */
function parseNoun(x) {
  var str = x.replace(/[\."']/g, '').split(' ').join(',')
  return assoc(JSON.parse(str))
}

function nockInterface() {
  var args = [].slice.call(arguments)
  var noun

  if (args.length === 1 && typeof args[0] === 'string') {
    // `[0, 1]` is the default subject (`!=(.)` in Hoon/Dojo)
    noun = [[0, 1], parseNoun(args[0])]
  } else {
    noun = assoc(args)
  }

  return nock(noun[0], noun[1])
}

module.exports = {
  nock: nockInterface,
  _nock: nock,
  useMacros: function(arg) {
    useMacros = arg === undefined || arg
    return this
  },
  util: {
    assoc: assoc,
    parseNoun: parseNoun
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
    cell: cell,
    incr: incr,
    eq: eq,
    ife_m: ife_m,
    ife: ife,
    compose_m: compose_m,
    compose: compose,
    extend_m: extend_m,
    extend: extend,
    invoke_m: invoke_m,
    invoke: invoke,
    hint_m: hint_m,
    hint: hint
  }
}
