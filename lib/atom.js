'use strict'

function isAtom (a) {
  return typeof a === 'number'
}

function incr (a) {
  return a + 1
}

function mul_uint32 (a, b) {
  var ah = (a >>> 16) & 0xffff
  var al = a & 0xffff
  var bh = (b >>> 16) & 0xffff
  var bl = b & 0xffff
  return ((al * bl) + ((((ah * bl) + (al * bh)) & 0xffff) << 16) >>> 0) >>> 0
}

function rot_uint32 (a, b) {
  return (a << b) | (a >>> 32 - b)
}

// key must be a byte array
function murmer3 (key, h1) {
  var k1 = 0
  var c1 = 0xcc9e2d51
  var c2 = 0x1b873593
  var rem = key.length % 4
  var nbytes = key.length - rem
  var i

  for (i = 0; i < nbytes; i += 4) {
    k1 = key[i] | (key[i + 1] << 8) | (key[i + 2] << 16) | (key[i + 3] << 24)
    k1 = mul_uint32(k1, c1)
    k1 = rot_uint32(k1, 15)
    k1 = mul_uint32(k1, c2)
    h1 ^= k1
    h1 = rot_uint32(h1, 13)
    h1 = mul_uint32(h1, 5) + 0xe6546b64
  }

  k1 = 0

  switch (rem) {
    case 3:
      k1 ^= key[i + 2] << 16
      // falls through
    case 2:
      k1 ^= key[i + 1] << 8
      // falls through
    case 1:
      k1 ^= key[i]
      k1 = mul_uint32(k1, c1)
      k1 = rot_uint32(k1, 15)
      k1 = mul_uint32(k1, c2)
      h1 ^= k1
  }

  h1 ^= key.length
  h1 ^= h1 >>> 16
  h1 = mul_uint32(h1, 0x85ebca6b)
  h1 ^= h1 >>> 13
  h1 = mul_uint32(h1, 0xc2b2ae35)
  h1 ^= h1 >>> 16
  return h1 >>> 0
}

function mug_trim (a, b) {
  var haz = murmer3(a, b)
  var ham = ((haz >>> 31) ^ (haz & 0x7fffffff)) >>> 0

  if (ham === 0) return mug_trim(a, b + 1)
  return ham
}

function ripBytes (a) {
  var b = []
  while (a) {
    b.push(a & 0xff)
    a >>>= 8
  }
  return b
}

function mug (a) {
  var seed = 0xcafebabe
  return mug_trim(ripBytes(a), seed)
}

module.exports = {
  isAtom: isAtom,
  incr: incr,
  mug: mug,
  util: {
    mul_uint32: mul_uint32,
    rot_uint32: rot_uint32,
    murmer3: murmer3,
    mug_trim: mug_trim,
    ripBytes: ripBytes
  }
}
