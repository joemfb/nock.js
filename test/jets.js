/* eslint-env mocha */
'use strict'

var expect = require('chai').expect
var jets = require('../lib/jets')
var atom = require('../lib/atom')

var box = atom.bn.box
var unbox = atom.bn.unbox
var p31 = Math.pow(2, 31)
var p32 = Math.pow(2, 32)

describe('jets/one', function () {
  var one = jets.one

  it('should dec', function () {
    expect(one.dec(1)).to.equal(0)
    expect(one.dec(box(p32))).to.equal(0xffffffff)
    expect(function () {
      one.dec(0)
    }).to.throw(Error)
    expect(function () {
      one.dec(box(0))
    }).to.throw(Error)
  })

  it('should add', function () {
    expect(one.add(0, 1)).to.equal(1)
    expect(unbox(one.add(1, box(0xffffffff)))).to.equal(p32)
  })

  it('should div', function () {
    expect(one.div(2, 2)).to.equal(1)
    var x = box(p32)
    expect(one.div(x, 2)).to.equal(p32 / 2)
    expect(unbox(x)).to.equal(p32)
    expect(function () {
      one.div(1, 0)
    }).to.throw(Error)
    expect(function () {
      one.div(box(1), box(0))
    }).to.throw(Error)
  })

  it('should gte', function () {
    expect(one.gte(1, 0)).to.equal(0)
    expect(one.gte(0, 0)).to.equal(0)
    expect(one.gte(box(0), 1)).to.equal(1)
  })

  it('should gth', function () {
    expect(one.gth(1, 0)).to.equal(0)
    expect(one.gth(0, 0)).to.equal(1)
    expect(one.gth(box(0), 1)).to.equal(1)
  })

  it('should lte', function () {
    expect(one.lte(1, 0)).to.equal(1)
    expect(one.lte(0, 0)).to.equal(0)
    expect(one.lte(box(0), 1)).to.equal(0)
  })

  it('should lth', function () {
    expect(one.lth(1, 0)).to.equal(1)
    expect(one.lth(0, 0)).to.equal(1)
    expect(one.lth(box(0), 1)).to.equal(0)
  })

  it('should max', function () {
    expect(one.max(0, 1)).to.equal(1)
    expect(one.max(box(0), 1)).to.equal(1)
    expect(one.max(p32, 2)).to.equal(p32)
    expect(unbox(one.max(box(p32), 2))).to.equal(p32)
  })

  it('should min', function () {
    expect(one.min(0, 1)).to.equal(0)
    expect(one.min(box(0), 1)).to.equal(0)
    expect(one.min(p32, 2)).to.equal(2)
    expect(one.min(box(p32), 2)).to.equal(2)
  })

  it('should mod', function () {
    expect(one.mod(3, 2)).to.equal(1)
    expect(one.mod(box(25), 5)).to.equal(0)
  })

  it('should mul', function () {
    expect(one.mul(2, 3)).to.equal(6)
    expect(unbox(one.mul(box(p32), 2))).to.equal(2 * p32)
    expect(one.mul(0xfffffffffffff, 3)).to.be.an.instanceof(Object)
  })

  it('should sub', function () {
    expect(one.sub(3, 1)).to.equal(2)
    expect(one.sub(box(p32), p31)).to.equal(0x80000000)
    expect(function () {
      one.sub(2, 3)
    }).to.throw(Error)
    expect(function () {
      one.sub(box(2), box(3))
    }).to.throw(Error)
  })
})

describe('jets/two', function () {
  var two = jets.two

  it('should bex', function () {
    expect(two.bex(2)).to.equal(4)
    expect(unbox(two.bex(32))).to.equal(p32)
  })

  it('should cut', function () {
    expect(two.cut(0, 0, 1, 1)).to.equal(1)
    expect(two.cut(0, 0, 1, 2)).to.equal(0)
    expect(two.cut(3, 0, 1, 8)).to.equal(8)
    expect(two.cut(0, 7, 4, 1296)).to.equal(10)
    expect(two.cut(0, 7, 4, box(1296))).to.equal(10)
  })

  it('should met', function () {
    expect(two.met(0, 1)).to.equal(1)
    expect(two.met(0, 10)).to.equal(4)
    expect(two.met(3, 1000)).to.equal(2)
    expect(two.met(0, box(p32))).to.equal(33)
    expect(two.met(5, box(p32))).to.equal(2)
  })

  it('should end', function () {
    expect(two.end(0, 1, 1)).to.equal(1)
    expect(two.end(0, 1, 2)).to.equal(0)
    expect(two.end(3, 1, 8)).to.equal(8)
  })

  it('should rsh', function () {
    expect(two.rsh(0, 1, 8)).to.equal(4)
    expect(two.rsh(3, 1, 8)).to.equal(0)
  })

  it('should rip', function () {
    var x = two.rip(3, 1000)
    expect(x.hed).to.equal(232)
    expect(x.tal.hed).to.equal(3)
    expect(x.tal.tal).to.equal(0)
  })

  it('should rub', function () {
    var x = two.rub(1, 1296)
    expect(x.hed).to.equal(10)
    expect(x.tal).to.equal(10)

    var n = box(1296)
    x = two.rub(1, n)
    expect(unbox(n)).to.equal(1296)

    x = two.rub(3, 4657)
    expect(x.hed).to.equal(3)
    expect(x.tal).to.equal(1)

    x = two.rub(8, 4657)
    expect(x.hed).to.equal(3)
    expect(x.tal).to.equal(0)
  })

  it('should cue', function () {
    expect(two.cue(2)).to.equal(0)
    expect(two.cue(1296)).to.equal(10)

    var x = two.cue(411761)
    expect(x.hed).to.equal(1)
    expect(x.tal.hed).to.equal(2)
    expect(x.tal.tal).to.equal(1)

    x = two.cue(3426417)
    expect(x.hed).to.equal(1)
    expect(x.tal.hed).to.equal(2)
    expect(x.tal.tal).to.equal(3)

    x = two.cue(box(10162991658945))
    expect(x.hed).to.equal(123)
    expect(x.tal.hed).to.equal(456)
    expect(x.tal.tal).to.equal(123)
  })
})
