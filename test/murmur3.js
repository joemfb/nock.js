/* eslint-env mocha */
'use strict'

var expect = require('chai').expect
var m = require('../lib/murmur3')

describe('murmer3', function () {
  it('should multiply uint32', function () {
    expect(m.mul_uint32(0xffffffff, 0xffffffff)).to.equal(1)
    expect(m.mul_uint32(10000000000, 2)).to.equal(0xa817c800)
    expect(m.mul_uint32(0x80000000, 2)).to.equal(0)
    expect(m.mul_uint32(0x7fffffff, 2)).to.equal(0xfffffffe)
  })

  // TODO: rol_uint32

  it('should compute murmur3', function () {
    expect(m.murmur3([97], 0xcafebabe)).to.equal(3065443627)
    expect(m.murmur3([232, 3], 0xcafebabe)).to.equal(4256328544)
    expect(m.murmur3([160, 134, 1], 0xcafebabe)).to.equal(3301690449)
    expect(m.murmur3([0, 202, 154, 59], 0xcafebabe)).to.equal(2952922265)
  })
})
