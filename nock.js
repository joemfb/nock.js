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

  // stack frame types
  var CONS = 0
  var SAVE = 1
  var AGAINST = 2 // TODO: rename
  var DEEP = 3
  var SUCC = 4
  var EQAl = 5
  var FORK = 6
  var EVAL = 7
  var WRAP = 8
  var PULL = 9
  var ROOT = 10

  function nock (s, f) {
    var stack = [ROOT]
    var stash = []
    var push = true
    var result, top

    while (true) {
      if (push) {
        // consume the nock formula, pushing stack frames or producing a result
        // (and then switching to popping off the stack)
        // never changes the subject
        if (f.hed instanceof Cell) {
          stack.push(CONS)
          stack.push({ t: EVAL, s: s, f: f.hed })
          stack.push(SAVE)
          f = f.tal
          continue
        }

        switch (f.hed) {
          case 0:
            if (f.tal === 1) {
              result = s
            } else {
              if (s.slot === undefined) throw new Error('slot atom')
              result = s.slot(f.tal)
            }
            push = false
            break

          case 1:
            result = f.tal
            push = false
            break

          case 2:
            stack.push(AGAINST)
            stack.push({ t: EVAL, s: s, f: f.tal.tal })
            stack.push(SAVE)
            f = f.tal.hed
            break

          case 3:
            stack.push(DEEP)
            f = f.tal
            break

          case 4:
            stack.push(SUCC)
            f = f.tal
            break

          case 5:
            stack.push(EQAl)
            f = f.tal
            break

          case 6:
            stack.push({ t: FORK, s: s, then: f.tal.tal.hed, else: f.tal.tal.tal })
            f = f.tal.hed
            break

          case 7:
            stack.push({ t: EVAL, f: f.tal.tal })  // TODO: rename?
            f = f.tal.hed
            break

          case 8:
            stack.push({ t: WRAP, s: s, f: f.tal.tal })
            f = f.tal.hed
            break

          case 9:
            // TODO: check callback
            stack.push({ t: PULL, axis: f.tal.hed })
            f = f.tal.tal
            break

          case 10:
            // TODO: check callback
            if (f.tal.hed instanceof Cell) {
              stack.push({ t: EVAL, s: s, f: f.tal.tal })
              f = f.tal.hed.tal
            } else {
              f = f.tal.tal
            }
            break

          default:
            throw new Error('unknown formula ' + f.hed)
        }
      } else {
        // consume the top stack node and
        // produce a new result, update the subject OR the formula
        // return when we're done
        // never pushes on to the stack
        top = stack.pop()
        switch (typeof top === 'number' ? top : top.t) {
          case CONS:
            result = Cell.pair(result, stash.pop())
            break

          case SAVE:
            stash.push(result)
            break

          case AGAINST:
            s = stash.pop()
            f = result
            push = true
            break

          case DEEP:
            result = (result instanceof Cell) ? 0 : 1
            break

          case SUCC:
            if (result instanceof Cell) throw new Error('succ cell')
            result++  // todo atom.incr
            break

          case EQAl:
            result = result.equal()
            break

          case FORK:
            s = top.s
            if (result === 0) {
              f = top.then
            } else if (result === 1) {
              f = top.else
            } else {
              throw new Error('ife')
            }
            push = true
            break

          case EVAL:
            s = (top.s !== undefined) ? top.s : result
            f = top.f
            push = true
            break

          case WRAP:
            s = Cell.pair(result, top.s)
            f = top.f
            push = true
            break

          case PULL:
            s = result
            f = result.slot(top.axis)
            push = true
            break

          case ROOT:
            return result
        }
      }
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
