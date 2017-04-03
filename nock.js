/* global define */
(function (self, factory) {
  'use strict'

  if (typeof define === 'function' && define.amd) {
    define('nock', [], factory)
  } else if (typeof module === 'object' && typeof module.exports === 'object') {
    module.exports = factory()
  } else {
    self.nock = factory()
  }
}(this, function () {
  'use strict'

  function Cell (a, b) {
    if (arguments.length !== 2) throw new Error('bad args')
    if (!(this instanceof Cell)) return new Cell(a, b)

    this.hed = a
    this.tal = b
  }

  Cell.pair = function (a, b) {
    return new Cell(a, b)
  }
  Cell.trel = function (a, b, c) {
    if (arguments.length !== 3) throw new Error('trel requires 3 args')
    return Cell.pair(a, Cell.pair(b, c))
  }
  Cell.quad = function (a, b, c, d) {
    if (arguments.length !== 4) throw new Error('quad requires 4 args')
    return Cell.pair(a, Cell.trel(b, c, d))
  }

  Cell.fromArray = function (a) {
    if (!(a instanceof Array)) throw new Error('bad arg')
    if (!a.length) throw new Error('empty array')
    return (
      function assoc (a) {
        if (!(a instanceof Array)) return a
        if (!a.length) throw new Error('empty array')
        if (a.length === 1) return assoc(a[0])
        return Cell.pair(assoc(a[0]), assoc(a.slice(1)))
      }
    )(a)
  }

  Cell.fromString = function (a) {
    if (typeof a !== 'string') throw new Error('bad arg')

    var b = a.replace(/[\."\n\r']/g, '')
      .replace(/\[\s*/g, '[')
      .replace(/\s*\]/g, ']')
      .split(' ')
      .filter(function (a) {
        return a.length !== 0
      })
      .join(',')

    return Cell.fromArray(JSON.parse(b))
  }

  function cellEqual (a, b) {
    if (a === b) return true
    if (a instanceof Cell && b instanceof Cell) {
      return cellEqual(a.hed, b.hed) && cellEqual(a.tal, b.tal)
    }
    return false
  }

  Cell.prototype.equal = function () {
    return +!cellEqual(this.hed, this.tal)
  }

  Cell.prototype.slot = function (a) {
    if (a === 0) throw new Error('slot 0')

    if (a === 1) return this
    if (a === 2) return this.hed
    if (a === 3) return this.tal

    var b = this.slot((a / 2) | 0)
    if (!(b instanceof Cell)) throw new Error('slot ' + a)
    return b.slot(2 + (a % 2))
  }

  Cell.prototype.toString = function () {
    var a = this
    var b = []

    while (true) {
      b.push(a.hed.toString())
      if (!(a.tal instanceof Cell)) {
        b.push(a.tal.toString())
        break
      }
      a = a.tal
    }
    return '[' + b.join(' ') + ']'
  }

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
    return (n instanceof Cell) ? 0 : 1
  }

  /**
   * lus (+): increment an atom
   *
   *   +[a b]           +[a b]
   *   +a               1 + a
   */
  function lus (n) {
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
  function tis (n) {
    if (wut(n) === 1) throw new Error('tis atom')
    return n.equal()
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

  function nockInterface () {
    var args = [].slice.call(arguments)
    var subject, formula, noun

    function asCell (a) {
      if (a instanceof Array) return Cell.fromArray(a)
      if (typeof a === 'string') return Cell.fromString(a)
      // TODO: instanceof Cell || atom.isAtom
      return a
    }

    if (args.length === 1) {
      formula = asCell(args[0])
    } else if (args.length === 2) {
      subject = asCell(args[0])
      formula = asCell(args[1])
    } else {
      noun = asCell(args)
      subject = noun.hed
      formula = noun.tal
    }

    if (!formula) throw new Error('formula required')

    return nock((subject == null) ? Cell.pair(1, 0) : subject, formula)
  }

  return {
    nock: nockInterface,
    _nock: nock,
    useMacros: function (arg) {
      useMacros = arg === undefined || arg
      return this
    },
    callbacks: function (obj) {
      registerCallbacks(obj)
      return this
    },
    Cell: Cell,
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
}))
