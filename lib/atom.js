'use strict'

var BN = require('bn.js')
var m = require('./murmur3')

// constants
var zero = box(0)
var one = box(1)
var two = box(2)
var p32 = box(0xffffffff)

/*
 *  Atom 'primitives'
*/

function isAtom (a) {
  return typeof a === 'number' || boxed(a)
}

function incr (a) {
  if (unboxed(a)) {
    return maybeBox(a + 1)
  }
  return box(a).add(one)
}

function bit (a, b) {
  if (unboxed(a) && unboxed(b)) {
    return !!((a >>> b) & 1)
  }

  // TODO b > max safe int
  return box(a).testn(unbox(b))
}

function bex (a) {
  // TODO: uint32max exp?
  if (unboxed(a) && a < 31) return Math.pow(2, a)
  // TODO: maybeUnbox?
  return two.pow(box(a))
}

function met (a, b) {
  var c = unboxed(b) ? (32 - Math.clz32(b)) : b.bitLength()
  if (a === 0) return c
  // TODO: unbox? div()?
  return Math.ceil(c / bex(a))
}

/*
 *  Number/BN utils
 */

function boxed (a) {
  return BN.isBN(a)
}

function unboxed (a) {
  return typeof a === 'number'
}

function box (a) {
  return boxed(a) ? a : (new BN(a))
}

function unbox (a) {
  // TODO: assert a < 2^53
  return unboxed(a) ? a : a.toNumber()
}

function maybeBox (a) {
  return unboxed(a) && a > 0xffffffff ? box(a) : a
}

function maybeUnbox (a) {
  return boxed(a) && a.lte(p32) ? unbox(a) : a
}

// little-endian
function fromBytes (a) {
  return maybeUnbox(new BN(a, 10, 'le'))
}

function toBytes (a) {
  var b = []
  var c

  if (unboxed(a)) {
    while (a) {
      b.push(a & 0xff)
      a >>>= 8
    }
  } else {
    c = box(0xff)
    while (a.gt(zero)) {
      b.push(unbox(a.uand(c)))
      a.iushrn(8)
    }
  }

  return b
}

function fromCord () {
  var args = Array.prototype.slice.call(arguments).reverse()

  if (args.length === 1 && typeof args[0] === 'string') {
    args = Array.from(args[0]).reverse()
  }

  if (args.length <= 4) {
    return args.reduce(function (acc, arg, i) {
      var byt = arg.charCodeAt(0) & 0xff
      var pos = 8 * (args.length - i - 1)
      return (byt << pos) | acc
    }, 0)
  }

  return args.reduce(function (acc, arg, i) {
    var byt = box(arg.charCodeAt(0) & 0xff)
    var pos = 8 * (args.length - i - 1)
    return byt.iushln(pos).iuor(acc)
  }, 0)
}

function toCord (a) {
  return toBytes(a).map(function (b) {
    return String.fromCharCode(b)
  })
  .join('')
}

function mugTrim (a, b) {
  var haz = m.murmur3(a, b)
  var ham = ((haz >>> 31) ^ (haz & 0x7fffffff)) >>> 0

  if (ham === 0) return mugTrim(a, b + 1)
  return ham
}

function mug (a) {
  var seed = 0xcafebabe

  if (a._mug) return a._mug

  var haz = mugTrim(toBytes(a), seed)
  if (boxed(a)) {
    a._mug = haz
  }
  return haz
}

module.exports = {
  isAtom: isAtom,
  incr: incr,
  bit: bit,
  bex: bex,
  met: met,
  mug: mug,
  bn: {
    box: box,
    unbox: unbox,
    boxed: boxed,
    unboxed: unboxed,
    maybeBox: maybeBox,
    maybeUnbox: maybeUnbox
  },
  util: {
    fromBytes: fromBytes,
    toBytes: toBytes,
    fromCord: fromCord,
    toCord: toCord,
    mugTrim: mugTrim
  }
}
