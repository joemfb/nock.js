'use strict'

var atom = require('./atom')
var Cell = require('./cell')

var bit = atom.bit
var box = atom.bn.box
var maybeBox = atom.bn.maybeBox
var unbox = atom.bn.unbox
var maybeUnbox = atom.bn.maybeUnbox
var unboxed = atom.bn.unboxed

var zero = box(0)
var one = box(1)
var two = box(2)

function assert (a, b) {
  if (!a) throw new Error(b)
}

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

/*
 *  layer 2.c
 */

function bex (a) {
  // TODO: uint32max exp?
  if (unboxed(a) && a < 31) return Math.pow(2, a)
  return two.pow(box(a))
}

// TODO: can, cat

function cut (a, b, c, d) {
  if (a === 0 && c === 1) return +bit(d, b)
  return end(a, c, rsh(a, b, d))
}

function end (a, b, c) {
  return mod(c, bex(mul(bex(a), b)))
}

// TODO: fil, lsh

function met (a, b) {
  var c = unboxed(b) ? (32 - Math.clz32(b)) : b.bitLength()
  if (a === 0) return c
  return Math.ceil(c / bex(a))
}

function rsh (a, b, c) {
  return maybeUnbox(box(c).ushrn(unbox(mul(bex(a), b))))
  // TODO: mul(bex(a), b) > max safe int?
  // return div(c, bex(mul(bex(a), b)))
}

// TODO: rap, rep

function rip (a, b) {
  if (b === 0) return 0
  return Cell(end(a, 1, b), rip(a, rsh(a, 1, b)))
}

/*
 *  layer 2.p
 */

function cue (a) {
  var m = {}
  a = box(a)

  function _cue (b) {
    var c, d, u, v, w

    // atom
    if (!a.testn(b)) {
      c = rub(b + 1, a)
      m[b] = c.tal
      return Cell.pair(1 + c.hed, c.tal)
    }

    c = b + 2

    // cell
    if (!a.testn(b + 1)) {
      u = _cue(c)
      v = _cue(c + u.hed)
      w = Cell.pair(u.tal, v.tal)
      m[b] = w
      return Cell.pair(2 + u.hed + v.hed, w)
    }

    // cached
    d = rub(c, a)
    if (m[d.tal] != null) return Cell.pair(2 + d.hed, m[d.tal])
    throw new Error('bad index')
  }

  return _cue(0).tal
}

// TODO: jam, mat

function rub (a, b) {
  var c = 0
  var e

  b = box(b)
  var m = met(0, b)

  while (!bit(b, a + c)) {
    assert(lth(m, c))
    ++c
  }

  if (c === 0) return Cell.pair(1, 0)

  a += c + 1
  e = add(bex(c - 1), cut(0, a, c - 1, b))
  return Cell.pair(c + c + e, cut(0, a + c - 1, e, b))
}

module.exports = {
  one: {
    dec: dec,
    add: add,
    div: div,
    // dvr: dvr,
    gte: gte,
    gth: gth,
    lte: lte,
    lth: lth,
    max: max,
    min: min,
    mod: mod,
    mul: mul,
    sub: sub
  },
  two: {
    bex: bex,
    // can: can,
    // cat: cat,
    cut: cut,
    end: end,
    // fil: fil,
    // lsh: lsh,
    met: met,
    // rap: rap,
    // rep: rep,
    rsh: rsh,
    rip: rip,
    cue: cue,
    // jam: jam,
    // mat: mat,
    rub: rub
  }
}
