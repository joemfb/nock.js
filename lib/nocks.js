'use strict'

var Cell = require('./cell')
var pair = Cell.pair
var atom = require('./atom')

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
          // TODO: dispatch callback
          stack.push({ t: PULL, axis: f.tal.hed })
          f = f.tal.tal
          break

        case 10:
          // TODO: hint callback
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
          result = pair(result, stash.pop())
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
          result = atom.incr(result)
          break

        case EQAl:
          result = +!result.equal()
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
          s = pair(result, top.s)
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

module.exports.nock = nock
