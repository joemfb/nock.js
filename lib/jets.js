'use strict'

var atom = require('./atom')

var box = atom.bn.box
var maybeBox = atom.bn.maybeBox
var maybeUnbox = atom.bn.maybeUnbox
var unboxed = atom.bn.unboxed

var zero = box(0)
var one = box(1)

/*
 *  layer 1.a
 */

function dec (a) {
  if (unboxed(a)) {
    if (a === 0) throw new Error('dec underflow')
    return a - 1
  }

  a = box(a)
  if (a.eq(zero)) throw new Error('dec underflow')
  return maybeUnbox(a.sub(one))
}

function add (a, b) {
  if (unboxed(a) && unboxed(b)) {
    return maybeBox(a + b)
  }

  return box(a).add(box(b))
}

function div (a, b) {
  if (unboxed(a) && unboxed(b)) {
    if (b === 0) throw new Error('div zero')
    return (a / b) | 0
  }

  b = box(b)
  if (b.eq(zero)) throw new Error('div zero')
  return maybeUnbox(box(a).divn(b))
}

// TODO: dvr

function gte (a, b) {
  if (unboxed(a) && unboxed(b)) {
    return +!(a >= b)
  }

  return +!box(a).gte(box(b))
}

function gth (a, b) {
  if (unboxed(a) && unboxed(b)) {
    return +!(a > b)
  }

  return +!box(a).gt(box(b))
}

function lte (a, b) {
  if (unboxed(a) && unboxed(b)) {
    return +!(a <= b)
  }

  return +!box(a).lte(box(b))
}

function lth (a, b) {
  if (unboxed(a) && unboxed(b)) {
    return +!(a < b)
  }

  return +!box(a).lt(box(b))
}

function max (a, b) {
  if (unboxed(a) && unboxed(b)) {
    return a > b ? a : b
  }

  a = box(a)
  b = box(b)
  return maybeUnbox(a.gt(b) ? a : b)
}

function min (a, b) {
  if (unboxed(a) && unboxed(b)) {
    return a < b ? a : b
  }

  a = box(a)
  b = box(b)
  return maybeUnbox(a.lt(b) ? a : b)
}

function mod (a, b) {
  if (unboxed(a) && unboxed(b)) {
    return a % b
  }

  return maybeUnbox(box(a).mod(box(b)))
}

function mul (a, b) {
  if (unboxed(a) && unboxed(b)) {
    var c = a * b
    if (Number.MAX_SAFE_INTEGER >= c) return maybeBox(c)
  }

  return box(a).mul(box(b))
}

function sub (a, b) {
  if (unboxed(a) && unboxed(b)) {
    if (a < b) throw new Error('sub underflow')
    return a - b
  }

  a = box(a)
  b = box(b)
  if (a.lt(b)) throw new Error('sub underflow')
  return maybeUnbox(a.sub(b))
}

module.exports = {
  one: {
    dec: dec,
    add: add,
    div: div,
    gte: gte,
    gth: gth,
    lte: lte,
    lth: lth,
    max: max,
    min: min,
    mod: mod,
    mul: mul,
    sub: sub
  }
}
