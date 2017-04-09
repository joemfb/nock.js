'use strict'

function isAtom (a) {
  return typeof a === 'number'
}

function incr (a) {
  return a + 1
}

module.exports = {
  isAtom: isAtom,
  incr: incr
}
