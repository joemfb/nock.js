/* eslint-env mocha */
'use strict'

var expect = require('chai').expect
var atom = require('../lib/atom')
var Cell = require('../lib/cell')

var box = atom.bn.box
var unbox = atom.bn.unbox
var p32 = Math.pow(2, 32)

describe('atom', function () {
  it('should test for atom', function () {
    expect(atom.isAtom(0)).to.be.true
    expect(atom.isAtom(1)).to.be.true
    expect(atom.isAtom(box(0))).to.be.true
    expect(atom.isAtom(Cell(0, 1))).to.be.false
  })

  it('should increment', function () {
    expect(atom.incr(1)).to.equal(2)
    expect(atom.incr(2)).to.equal(3)
    expect(atom.incr(p32)).to.be.an.instanceof(Object)
    expect(unbox(atom.incr(box(p32)))).to.equal(p32 + 1)
  })
})

describe('atom/box', function () {
  var BN = require('bn.js')
  var bn = atom.bn

  it('should fromBytes', function () {
    expect(bn.fromBytes([0x10, 0x5]).toNumber()).to.equal(1296)
  })

  it('should box', function () {
    expect(BN.isBN(bn.box(new BN(1)))).to.be.true
    expect(bn.box(new BN(1)).toNumber()).to.equal(1)
    expect(BN.isBN(bn.box(0))).to.be.true
    expect(bn.box(0).toNumber()).to.equal(0)
  })

  it('should unbox', function () {
    expect(bn.unbox(new BN(1))).to.equal(1)
    expect(bn.unbox(1)).to.equal(1)
    expect(function () {
      bn.unbox((new BN(2)).pow(64))
    }).to.throw(Error)
  })

  it('should boxed', function () {
    expect(bn.boxed(new BN(1))).to.be.true
    expect(bn.boxed(0)).to.be.false
  })

  it('should unboxed', function () {
    expect(bn.unboxed(new BN(1))).to.be.false
    expect(bn.unboxed(0)).to.be.true
  })

  it('should maybeBox', function () {
    expect(bn.maybeBox(0)).to.equal(0)
    expect(bn.unboxed(bn.maybeBox(p32))).to.be.false
    expect(bn.maybeBox(p32).toNumber()).to.equal(p32)
  })

  it('should maybeUnbox', function () {
    expect(bn.maybeUnbox(new BN(0))).to.equal(0)
    expect(bn.unboxed(bn.maybeUnbox(new BN(p32)))).to.be.false
    expect(bn.maybeUnbox(new BN(p32)).toNumber()).to.equal(p32)
  })
})

describe('atom/murmer3', function () {
  it('should multiply uint32', function () {
    expect(atom.util.mul_uint32(0xffffffff, 0xffffffff)).to.equal(1)
    expect(atom.util.mul_uint32(10000000000, 2)).to.equal(0xa817c800)
    expect(atom.util.mul_uint32(0x80000000, 2)).to.equal(0)
    expect(atom.util.mul_uint32(0x7fffffff, 2)).to.equal(0xfffffffe)
  })

  // TODO: rol_uint32

  it('should compute murmer3', function () {
    expect(atom.util.murmer3([97], 0xcafebabe)).to.equal(3065443627)
    expect(atom.util.murmer3([232, 3], 0xcafebabe)).to.equal(4256328544)
    expect(atom.util.murmer3([160, 134, 1], 0xcafebabe)).to.equal(3301690449)
    expect(atom.util.murmer3([0, 202, 154, 59], 0xcafebabe)).to.equal(2952922265)
  })

  it('should compute non-zero murmer3', function () {
    expect(atom.util.mug_trim([97], 0xcafebabe)).to.equal(917959978)
    expect(atom.util.mug_trim([232, 3], 0xcafebabe)).to.equal(2108844897)
    expect(atom.util.mug_trim([160, 134, 1], 0xcafebabe)).to.equal(1154206800)
    expect(atom.util.mug_trim([0, 202, 154, 59], 0xcafebabe)).to.equal(805438616)
  })

  it('should rip bytes', function () {
    var a = atom.util.ripBytes(97)
    expect(a).to.be.an.instanceof(Array)
    expect(a.length).to.equal(1)
    expect(a[0]).to.equal(97)

    a = atom.util.ripBytes(1000)
    expect(a.length).to.equal(2)
    expect(a[0]).to.equal(232)
    expect(a[1]).to.equal(3)

    a = atom.util.ripBytes(1000000000)
    expect(a.length).to.equal(4)
    expect(a[0]).to.equal(0)
    expect(a[1]).to.equal(202)
    expect(a[2]).to.equal(154)
    expect(a[3]).to.equal(59)
  })

  it('should mug', function () {
    expect(atom.mug(0)).to.equal(2046756072)
    expect(atom.mug(1)).to.equal(1901865568)
    expect(atom.mug(97)).to.equal(917959978)
    expect(atom.mug(1000)).to.equal(2108844897)
    expect(atom.mug(100000)).to.equal(1154206800)
    expect(atom.mug(1000000000)).to.equal(805438616)
  })
})
