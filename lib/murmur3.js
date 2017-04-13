'use strict'

/* eslint camelcase: 0 */

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
function murmur3 (key, h1) {
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

module.exports = {
  mul_uint32: mul_uint32,
  rot_uint32: rot_uint32,
  murmur3: murmur3
}
