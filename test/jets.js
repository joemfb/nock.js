/* eslint-env mocha */
'use strict'

var expect = require('chai').expect
var jets = require('../lib/jets')
var atom = require('../lib/atom')
var Cell = require('../lib/cell')

var box = atom.bn.box
var unbox = atom.bn.unbox
var p31 = Math.pow(2, 31)
var p32 = Math.pow(2, 32)

describe('jets/one', function () {
  var one = jets.raw.one

  it('should dec', function () {
    expect(one.dec(1)).to.equal(0)
    expect(one.dec(box(p32))).to.equal(0xffffffff)
    expect(function () {
      one.dec(0)
    }).to.throw(Error)
    expect(function () {
      one.dec(box(0))
    }).to.throw(Error)

    var x = jets.one.dec(Cell.trel(0, 1, 2))
    expect(x).to.equal(one.dec(1))
  })

  it('should add', function () {
    expect(one.add(0, 1)).to.equal(1)
    expect(unbox(one.add(1, box(0xffffffff)))).to.equal(p32)

    var x = jets.one.add(Cell.trel(0, Cell(0, 1), 2))
    expect(x).to.equal(one.add(0, 1))
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

    var x = jets.one.div(Cell.trel(0, Cell(2, 2), 2))
    expect(x).to.equal(one.div(2, 2))
  })

  it('should gte', function () {
    expect(one.gte(1, 0)).to.equal(0)
    expect(one.gte(0, 0)).to.equal(0)
    expect(one.gte(box(0), 1)).to.equal(1)

    var x = jets.one.gte(Cell.trel(0, Cell(1, 0), 2))
    expect(x).to.equal(one.gte(1, 0))
  })

  it('should gth', function () {
    expect(one.gth(1, 0)).to.equal(0)
    expect(one.gth(0, 0)).to.equal(1)
    expect(one.gth(box(0), 1)).to.equal(1)

    var x = jets.one.gth(Cell.trel(0, Cell(1, 0), 2))
    expect(x).to.equal(one.gth(1, 0))
  })

  it('should lte', function () {
    expect(one.lte(1, 0)).to.equal(1)
    expect(one.lte(0, 0)).to.equal(0)
    expect(one.lte(box(0), 1)).to.equal(0)

    var x = jets.one.lte(Cell.trel(0, Cell(1, 0), 2))
    expect(x).to.equal(one.lte(1, 0))
  })

  it('should lth', function () {
    expect(one.lth(1, 0)).to.equal(1)
    expect(one.lth(0, 0)).to.equal(1)
    expect(one.lth(box(0), 1)).to.equal(0)

    var x = jets.one.lth(Cell.trel(0, Cell(1, 0), 2))
    expect(x).to.equal(one.lth(1, 0))
  })

  it('should max', function () {
    expect(one.max(0, 1)).to.equal(1)
    expect(one.max(box(0), 1)).to.equal(1)
    expect(one.max(p32, 2)).to.equal(p32)
    expect(unbox(one.max(box(p32), 2))).to.equal(p32)

    var x = jets.one.max(Cell.trel(0, Cell(0, 1), 2))
    expect(x).to.equal(one.max(0, 1))
  })

  it('should min', function () {
    expect(one.min(0, 1)).to.equal(0)
    expect(one.min(box(0), 1)).to.equal(0)
    expect(one.min(p32, 2)).to.equal(2)
    expect(one.min(box(p32), 2)).to.equal(2)

    var x = jets.one.min(Cell.trel(0, Cell(0, 1), 2))
    expect(x).to.equal(one.min(0, 1))
  })

  it('should mod', function () {
    expect(one.mod(3, 2)).to.equal(1)
    expect(one.mod(box(25), 5)).to.equal(0)

    var x = jets.one.mod(Cell.trel(0, Cell(3, 2), 2))
    expect(x).to.equal(one.mod(3, 2))
  })

  it('should mul', function () {
    expect(one.mul(2, 3)).to.equal(6)
    expect(unbox(one.mul(box(p32), 2))).to.equal(2 * p32)
    expect(one.mul(0xfffffffffffff, 3)).to.be.an.instanceof(Object)

    var x = jets.one.mul(Cell.trel(0, Cell(2, 3), 2))
    expect(x).to.equal(one.mul(2, 3))
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

    var x = jets.one.sub(Cell.trel(0, Cell(3, 1), 2))
    expect(x).to.equal(one.sub(3, 1))
  })
})

describe('jets/two', function () {
  var two = jets.raw.two

  it('should bex', function () {
    expect(two.bex(2)).to.equal(4)
    expect(unbox(two.bex(32))).to.equal(p32)

    var x = jets.two.bex(Cell.trel(0, 2, 2))
    expect(x).to.equal(two.bex(2))
  })

  it('should cut', function () {
    expect(two.cut(0, 0, 1, 1)).to.equal(1)
    expect(two.cut(0, 0, 1, 2)).to.equal(0)
    expect(two.cut(3, 0, 1, 8)).to.equal(8)
    expect(two.cut(0, 7, 4, 1296)).to.equal(10)
    expect(two.cut(0, 7, 4, box(1296))).to.equal(10)
    expect(two.cut(0, 0, 2, box(p32 - 1))).to.equal(3)
    expect(two.cut(0, 25, 2, box(p32 - 1))).to.equal(3)

    // (jam [123 456 123])
    expect(two.cut(0, 27, 9, box(10162991658945))).to.equal(456)
    expect(two.cut(0, 42, 2, box(10162991658945))).to.equal(2)

    // (jam %fast)
    var n = atom.util.fromBytes([192, 55, 11, 155, 163, 3])
    expect(two.cut(0, 11, 31, n)).to.equal(1953718630)

    // (jam %foobars)
    n = atom.util.fromBytes([128, 215, 236, 237, 77, 44, 76, 110, 14])
    expect(atom.equal(
      // `@`%foobars
      atom.util.fromBytes([102, 111, 111, 98, 97, 114, 115]),
      two.cut(0, 13, 55, n)
    )).to.be.true

    // (rip 3 (jam [0x1.dead.beef.cede.deae 0]))
    n = atom.util.fromBytes([1, 12, 92, 189, 189, 157, 223, 125, 91, 189, 11])
    expect(atom.equal(
      atom.util.fromBytes([174, 222, 222, 206, 239, 190, 173, 222, 1]),
      two.cut(0, 17, 65, n)
    )).to.be.true

    n = atom.util.fromBytes([239, 190, 175, 222, 173, 250, 0, 0, 205, 171, 239, 190, 175, 222, 173, 250])
    expect(unbox(two.cut(6, 0, 1, n))).to.equal(275624672345839)

    var one = jets.raw.one

    // (jam [1 (reap 2 (gulf 'a' 'c'))])
    n = one.add(0xc1c3c171,
      one.add(
        one.mul(0x36c7c1c5, p32),
        one.mul(642, one.mul(p32, p32))
      )
    )
    expect(two.cut(0, 49, 7, n)).to.equal(99)

    var x = jets.two.cut(Cell.trel(0, Cell.trel(0, Cell(0, 1), 1), 4))
    expect(x).to.equal(two.cut(0, 0, 1, 1))
  })

  it('should met', function () {
    expect(two.met(0, 1)).to.equal(1)
    expect(two.met(0, 10)).to.equal(4)
    expect(two.met(3, 1000)).to.equal(2)
    expect(two.met(0, box(p32))).to.equal(33)
    expect(two.met(5, box(p32))).to.equal(2)

    var x = jets.two.met(Cell.trel(0, Cell(0, 1), 4))
    expect(x).to.equal(two.met(0, 1))
  })

  it('should end', function () {
    expect(two.end(0, 1, 1)).to.equal(1)
    expect(two.end(0, 1, 2)).to.equal(0)
    expect(two.end(3, 1, 8)).to.equal(8)
    expect(two.end(0, 12, box(p32 - 1))).to.equal(Math.pow(2, 12) - 1)
    expect(two.end(0, 26, box(p32 - 1))).to.equal(Math.pow(2, 26) - 1)
    expect(two.end(0, 26, box(p32 - 1))).to.equal(box(p32 - 1).words[0])
    expect(two.end(0, 31, p32)).to.equal(0)
    expect(two.end(0, 31, p32 - 1)).to.equal(p31 - 1)
    expect(two.end(0, 31, box(p32))).to.equal(0)
    expect(two.end(0, 31, box(p32 - 1))).to.equal(p31 - 1)

    var x = jets.two.end(Cell.trel(0, Cell.trel(0, 1, 1), 4))
    expect(x).to.equal(two.end(0, 1, 1))
  })

  it('should rsh', function () {
    expect(two.rsh(0, 1, 8)).to.equal(4)
    expect(two.rsh(3, 1, 8)).to.equal(0)

    var x = jets.two.rsh(Cell.trel(0, Cell.trel(0, 1, 8), 4))
    expect(x).to.equal(two.rsh(0, 1, 8))
  })

  it('should rip', function () {
    var x = two.rip(3, 1000)
    expect(x.hed).to.equal(232)
    expect(x.tal.hed).to.equal(3)
    expect(x.tal.tal).to.equal(0)

    x = jets.two.rip(Cell.trel(0, Cell(3, 1000), 4))
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

    x = jets.two.rub(Cell.trel(0, Cell(1, 1296), 4))
    expect(x.hed).to.equal(10)
    expect(x.tal).to.equal(10)
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

    x = jets.two.cue(Cell.trel(0, 2, 4))
    expect(x).to.equal(two.cue(2))
  })
})

describe('jets/wrap', function () {
  it('should wrap a lone sample', function () {
    var f = jets.wrap.lone(function (a) {
      return a
    })

    var x = f(Cell.trel(0, 1, 2))
    expect(x).to.equal(1)
  })

  it('should wrap a pair sample', function () {
    var f = jets.wrap.pair(function (a, b) {
      return Cell(a, b)
    })

    var x = f(Cell.trel(0, Cell(1, 2), 3))

    expect(x.hed).to.equal(1)
    expect(x.tal).to.equal(2)
  })

  it('should wrap a trel sample', function () {
    var f = jets.wrap.trel(function (a, b, c) {
      return Cell.trel(a, b, c)
    })

    var x = f(Cell.trel(0, Cell.trel(1, 2, 3), 4))

    expect(x.hed).to.equal(1)
    expect(x.tal.hed).to.equal(2)
    expect(x.tal.tal).to.equal(3)
  })
})
