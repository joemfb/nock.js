'use strict'

var Cell = require('./cell')
var pair = Cell.pair
var atom = require('./atom')

function nock (s, f) {
  var a

  if (f.hed instanceof Cell) {
    return pair(nock(s, f.hed), nock(s, f.tal))
  }

  switch (f.hed) {
    case 0:
      if (f.tal === 1) return s
      return s.slot(f.tal)

    case 1:
      return f.tal

    case 2:
      return nock(nock(s, f.tal.hed), nock(s, f.tal.tal))

    case 3:
      return (nock(s, f.tal) instanceof Cell) ? 0 : 1

    case 4:
      a = nock(s, f.tal)
      if (a instanceof Cell) throw new Error('4 cell')
      return atom.incr(a)

    case 5:
      return +!nock(s, f.tal).equal()

    case 6:
      a = nock(s, f.tal.hed)
      if (a === 0) return nock(s, f.tal.tal.hed)
      if (a === 1) return nock(s, f.tal.tal.tal)
      throw new Error('ife >1')

    case 7:
      return nock(nock(s, f.tal.hed), f.tal.tal)

    case 8:
      return nock(pair(nock(s, f.tal.hed), s), f.tal.tal)

    case 9:
      // TODO: dispatch callback
      return nock(nock(s, f.tal.tal), s.slot(f.tal.hed))

    case 10:
      // TODO: hint callback
      if (f.tal.hed instanceof Cell) nock(s, f.tal.hed.tal)
      return nock(s, f.tal.tal)

    default:
      throw new Error('unknown formula ' + f.hed)
  }
}

module.exports.nock = nock
