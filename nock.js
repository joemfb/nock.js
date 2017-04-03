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

  var callbacks = {}

  function nock (s, f) {
    var hed, tal

    if (f.hed instanceof Cell) {
      hed = nock(s, f.hed)
      tal = nock(s, f.tal)
      return Cell.pair(hed, tal)
    }

    switch (f.hed) {

      case 0:
        if (f.tal === 1) return s
        return s.slot(f.tal)

      case 1:
        return f.tal

      case 2:
        s = nock(s, f.tal.hed)
        f = nock(s, f.tal.tal)
        return nock(s, f)

      case 3:
        return (nock(s, f.tal) instanceof Cell) ? 0 : 1

      case 4:
        hed = nock(s, f.tal)
        if (hed instanceof Cell) throw new Error('4 cell')
        return 1 + hed  // todo atom.incr

      case 5:
        return nock(s, f.tal).equal()

      case 6:
        hed = nock(s, f.tal.hed)
        if (hed === 0) return nock(s, f.tal.tal.hed)
        if (hed === 1) return nock(s, f.tal.tal.tal)
        throw new Error('ife >1')

      case 7:
        s = nock(s, f.tal.hed)
        return nock(s, f.tal.tal)

      case 8:
        hed = nock(s, f.tal.hed)
        s = Cell.pair(hed, s)
        return nock(s, f.tal.tal)

      case 9:
        // TODO: check callback
        s = nock(s, f.tal.tal)
        return nock(s, s.slot(f.tal.hed))

      case 10:
        // TODO: check callback
        if (f.tal.hed instanceof Cell) nock(s, f.tal.hed.tal)
        return nock(s, f.tal.tal)

      default:
        throw new Error('unknown formula ' + f.hed)
    }
  }

  function registerCallbacks (obj) {
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
    callbacks: function (obj) {
      registerCallbacks(obj)
      return this
    },
    Cell: Cell
  }
}))
