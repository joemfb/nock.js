'use strict'

var atom = require('./atom')

function Cell (a, b) {
  if (arguments.length !== 2) throw new Error('bad args')
  if (!(this instanceof Cell)) return new Cell(a, b)

  this.hed = a
  this.tal = b
  this._mug = null
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

  if (a._mug && b._mug && a._mug !== b._mug) return false

  if (a instanceof Cell && b instanceof Cell) {
    return cellEqual(a.hed, b.hed) && cellEqual(a.tal, b.tal)
  }
  return false
}

Cell.prototype.equal = function () {
  return cellEqual(this.hed, this.tal)
}

Cell.prototype.slowSlot = function (a) {
  if (a === 0) throw new Error('slowSlot 0')

  if (a === 1) return this
  if (a === 2) return this.hed
  if (a === 3) return this.tal

  var b = this.slowSlot((a / 2) | 0)
  if (!(b instanceof Cell)) throw new Error('slowSlot ' + a)
  return b.slowSlot(2 + (a % 2))
}

Cell.prototype.slot = function (a) {
  if (a === 0) throw new Error('slot 0')

  var n = atom.met(0, a) - 1
  var ret = this

  while (n) {
    if (!(ret instanceof Cell)) throw new Error('slot ' + a)
    ret = atom.bit(a, --n) ? ret.tal : ret.hed
  }

  return ret
}

Cell.prototype.mug = function () {
  if (this._mug !== null) return this._mug

  var hed = (this.hed instanceof Cell) ? this.hed.mug() : atom.mug(this.hed)
  var tal = (this.tal instanceof Cell) ? this.tal.mug() : atom.mug(this.tal)

  this._mug = atom.mug((hed ^ (0x7fffffff ^ tal)) >>> 0)
  return this._mug
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

module.exports = Cell
