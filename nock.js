'use strict';

/**
 * Nock is a combinator interpreter on nouns. A noun is an atom or a cell.
 * An atom is an unsigned integer of any size; a cell is an ordered pair of nouns.
 *
 * @see http://urbit.org/docs/theory/whitepaper#-nock
 */

var useMacros = false;
var verbose = true;

/*
 *  code conventions:
 *
 *    `n` is a noun,
 *    `s` is a subject noun,
 *    `f` is a formula (or cell of formulas),
 *    `d` is stack depth (for verbose logging)
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
function evaluate(s, f, d) {
  return nock(nock(s, f[0], d + 1), nock(s, f[1], d + 1), d)
}

/**
 * cell (3): test if the product is a cell
 *
 *   *[a 3 b]         ?*[a b]
 */
function cell(s, f, d) {
  return wut(nock(s, f, d))
}

/**
 *  incr (4): increment the product
 *
 *   *[a 4 b]         +*[a b]
 */
function incr(s, f, d) {
  return lus(nock(s, f, d))
}

/**
 * eq (5): test for equality between nouns in the product
 *
 *   *[a 5 b]         =*[a b]
 */
function eq(s, f, d) {
  return tis(nock(s, f, d))
}

/**
 * ife (6): if/then/else
 *
 *   *[a 6 b c d]      *[a 2 [0 1] 2 [1 c d] [1 0] 2 [1 2 3] [1 0] 4 4 b]
 */
function ife_m(s, f, d) {
  return nock(s, [2, [[0, 1], [2, [[1, [f[1][0], f[1][1]]], [[1, 0], [2, [[1, [2, 3]], [[1, 0], [4, [4, f[0]]]]]]]]]]], d)
}

function ife(s, f, d) {
  // TODO: fix; this is the simplified version
  return nock(s, f[0]) === 0 ? nock(s, f[1][0]) : nock(s, f[1][1], d)
}

/**
 * compose (7): evaluate formulas composed left-to-right
 *
 *   *[a 7 b c]  *[a 2 b 1 c]
 */
function compose_m(s, f, d) {
  return nock(s, [2, [f[0], [1, f[1]]]], d)
}

function compose(s, f, d) {
  // alternate form:
  // return nock(nock(s, f[0]), constant(s, f[1]))
  return nock(nock(s, f[0], d + 1), f[1], d)
}

/**
 * extend (8): evaluate the second formula against [product of first, subject]
 *
 *   *[a 8 b c]  *[a 7 [[7 [0 1] b] 0 1] c]
 */
function extend_m(s, f, d) {
  return nock(s, [7, [[[7, [[0, 1], f[0]]], [0, 1]], f[1]]], d)
}

function extend(s, f, d) {
  // alternate form:
  // return nock([compose(s, [[0, 1], f[0]]), s], f[1])
  return nock([nock(s, f[0], d + 1), s], f[1], d)
}

/**
 * invoke (9): construct a core and evaluate one of it's arms against it
 *
 *   *[a 9 b c]  *[a 7 c 2 [0 1] 0 b]
 */
function invoke_m(s, f, d) {
  return nock(s, [7, [f[1], [2, [[0, 1], [0, f[0]]]]]], d)
}

function invoke(s, f, d) {
  var prod = nock(s, f[1], d + 1)
  return nock(prod, slot(prod, f[0]), d)
}

/**
 * hint (10): skip first formula, evaluate second
 *
 *   *[a 10 [b c] d]  *[a 8 c 7 [0 3] d]
 *   *[a 10 b c]      *[a c]
 */
function hint_m(s, f, d) {
  if (wut(f[0]) === 1) return nock(s, [8, [f[0][1], [7, [[0, 3], f[1][1]]]]], d)
  return nock(s, f[1], d)
}

function hint(s, f, d) {
  if (wut(f[0]) === 1) nock(s, f[0][1], d)
  return nock(s, f[1], d)
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
function nock(s, f, d) {
  if (d === undefined) d = 0

  d++

  if (wut(f[0]) === 0) return [nock(s, f[0], d), nock(s, f[1], d)]

  if (verbose) log(s, f, d)

  if (f[0] > 10) throw new Error('invalid formula: ' + f[0])

  if (useMacros) return formulas_m[f[0]](s, f[1], d)

  return formulas[f[0]](s, f[1], d)
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

function pad(d) {
  var p = ''
  var i

  for (i = 0; i < d; i++) {
    p += ' '
  }

  return p
}

function log(s, f, d) {
  var p = pad(d)

  console.log(p + formulas[f[0]].name + ':')
  // console.log(p + JSON.stringify(s))
  // console.log(p + JSON.stringify(f[1]))
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
