'use strict'

var atom = require('./atom')
var Cell = require('./cell')

// externally defined jets
var bex = atom.bex
var met = atom.met

var bit = atom.bit
var box = atom.bn.box
var maybeBox = atom.bn.maybeBox
var unbox = atom.bn.unbox
var maybeUnbox = atom.bn.maybeUnbox
var unboxed = atom.bn.unboxed

var zero = box(0)
var one = box(1)

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
  return maybeUnbox(box(a).div(b))
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

// TODO: can, cat

function cut (a, b, c, d) {
  // TODO: if a, b, or c is boxed?
  // return end(a, c, rsh(a, b, d))
  if (a === 0 && c === 1) return +bit(d, b)

  var exp = bex(a)
  var low = mul(exp, b)
  var high = mul(exp, c)

  if (unboxed(d)) return ((d >>> low) & dec(bex(high))) >>> 0

  var il = (low / 26) >>> 0
  var ih = ((low + high) / 26) >>> 0

  if (il === ih) return ((d.words[il] >>> (low % 26)) & dec(bex(high))) >>> 0

  var ret = d.clone()
  ret.words = d.words.slice(il + 1, ih)

  var lowBits = 26 - (low % 26)
  var highBits = ((high + 26) - lowBits) % 26
  var rem = d.words[il] >>> (low % 26)
  var last = (d.words[ih] & dec(bex(highBits))) >>> 0

  // the subsequent shift seems to makes this condition unnecessary
  // but i'm not entirely sure ...
  if ((il + 1) === ih || last > 0) {
    ret.words.push(last)
  }
  ret.length = ret.words.length

  return maybeUnbox(ret.iushln(lowBits).iaddn(rem))
}

function end (a, b, c) {
  // TODO: if a or b is boxed?
  // return mod(c, bex(mul(bex(a), b)))
  var d = mul(bex(a), b)

  if (unboxed(c)) {
    // TODO: is >32 enough?
    if (d > 52) return c
    return (c & dec(bex(d))) >>> 0
  }

  if (d < 26) return (c.words[0] & dec(bex(d))) >>> 0

  if (d === 26) return c.words[0]

  var i = (d / 26) >>> 0

  var ret = c.clone()
  ret.words = c.words.slice(0, i)

  var last = (c.words[i] & dec(bex(d % 26))) >>> 0
  if (i === 0 || last > 0) {
    ret.words.push(last)
    ret.length = i + 1
  } else {
    ret.length = i
  }

  return maybeUnbox(ret)
}

// TODO: fil, lsh

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

/*
 *  jet interface wrappers
 */

function lone (f) {
  return function (core) {
    return f(core.slot(6))
  }
}

function pair (f) {
  return function (core) {
    var s = core.slot(6)
    return f(s.hed, s.tal)
  }
}

function trel (f) {
  return function (core) {
    var s = core.slot(6)
    return f(s.hed, s.tal.hed, s.tal.tal)
  }
}

module.exports = {
  wrap: {
    lone: lone,
    pair: pair,
    trel: trel
  },
  raw: {
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
      rip: rip,
      rsh: rsh,
      cue: cue,
      // jam: jam,
      // mat: mat,
      rub: rub
    }
  },
  one: {
    dec: lone(dec),
    add: pair(add),
    div: pair(div),
    gte: pair(gte),
    gth: pair(gth),
    lte: pair(lte),
    lth: pair(lth),
    max: pair(max),
    min: pair(min),
    mod: pair(mod),
    mul: pair(mul),
    sub: pair(sub)
  },
  two: {
    bex: lone(bex),
    cut: function (core) {
      var s = core.slot(6)
      return cut(s.hed, s.tal.hed.hed, s.tal.hed.tal, s.tal.tal)
    },
    end: trel(end),
    met: pair(met),
    rip: pair(rip),
    rsh: trel(rsh),
    cue: lone(cue),
    rub: pair(rub)
  }
}
