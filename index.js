'use strict'

var Cell = require('./lib/cell')
var libnock = require('./lib/nock')

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

  return libnock.nock((subject == null) ? Cell.pair(1, 0) : subject, formula)
}

module.exports = {
  nock: nockInterface,
  useMacros: libnock.useMacros,
  callbacks: libnock.callbacks
}
