/* eslint-env mocha */
'use strict'

var expect = require('chai').expect
var nock = require('./nock')
var Cell = require('./lib/cell')

describe('examples', function () {
  var dec1 = [8, [1, 0], 8, [1, 6, [5, [0, 7], 4, 0, 6], [0, 6], 9, 2, [0, 2], [4, 0, 6], 0, 7], 9, 2, 0, 1]
  var dec2 = [7, [0, 1], 8, [1, 0], 8, [1, 6, [5, [0, 7], 4, 0, 6], [0, 6], 9, 2, [0, 2], [4, 0, 6], 0, 7], 9, 2, 0, 1]
  var dec3 = '[7 [1 42] 7 [0 1] 8 [1 0] 8 [1 6 [5 [0 7] 4 0 6] [0 6] 9 2 [0 2] [4 0 6] 0 7] 9 2 0 1]'

  it('should decrement', function () {
    expect(nock.nock(42, dec1)).to.equal(41)
    expect(nock.nock(42, dec2)).to.equal(41)
  })

  it('should err on missing formula', function () {
    expect(nock.nock).to.throw(Error)
  })

  it('should err on invalid formula', function () {
    var fn = function () {
      nock.nock([0, 1], [11, 1])
    }
    expect(fn).to.throw(Error)
  })

  it('should decrement with macros', function () {
    expect(nock.nock(42, dec1)).to.equal(41)
    expect(nock.nock(42, dec2)).to.equal(41)
  })

  it('should parse hoon/nock tape and decrement', function () {
    expect(nock.nock(dec3)).to.equal(41)
  })

  it('should print cell', function () {
    expect(Cell.quad(3, 1, 0, 1).toString()).to.equal('[3 1 0 1]')
    expect(Cell.quad(Cell(3, 4), 1, 0, 1).toString()).to.equal('[[3 4] 1 0 1]')
  })

  it('should statefully cons', function () {
    var s = '[[[[1 0] [0 6] 9 5 0 1] 4 0 6] 0 0]'
    var n = nock.nock(s, '[9 4 [0 2] [5 [[1 1] [4 1 20]] [[1 1] [2 [1 20] [1 0 1]]]] [0 7]]')
    expect(n.hed).to.equal(0)
    expect(n.tal.hed).to.equal(1)
    expect(n.tal.tal).to.equal(2)

    n = nock.nock(s, '[9 4 [0 2] [5 [[1 1] [4 1 20]] [[1 1] [2 [1 21] [1 0 1]]]] [0 7]]')
    expect(n.hed).to.equal(0)
    expect(n.tal.hed).to.equal(0)
    expect(n.tal.tal).to.equal(1)
  })
})

describe('primitive formulas', function () {
  it('should derefence tree axis (0)', function () {
    expect(function () { nock.nock(1, Cell(0, undefined)) }).to.throw(Error)
    expect(function () { nock.nock(1, Cell(0, 0)) }).to.throw(Error)

    expect(nock.nock(0, Cell(0, 1))).to.equal(0)
    var s = Cell(1, 0)
    expect(nock.nock(s, Cell(0, 2))).to.equal(1)
    expect(nock.nock(s, Cell(0, 3))).to.equal(0)
    s = Cell(Cell(2, 0), Cell(3, 1))
    expect(nock.nock(s, Cell(0, 4))).to.equal(2)
    expect(nock.nock(s, Cell(0, 5))).to.equal(0)
    expect(nock.nock(s, Cell(0, 6))).to.equal(3)
    expect(nock.nock(s, Cell(0, 7))).to.equal(1)
  })

  it('should produce constant (1)', function () {
    expect(nock.nock(Cell(1, 2))).to.equal(2)
  })

  it('should evaluate product (2)', function () {
    expect(nock.nock(1, Cell.trel(2, Cell(1, 2), Cell.trel(1, 0, 1)))).to.equal(2)
    expect(nock.nock(77, Cell.trel(2, Cell(1, 42), Cell.trel(1, 1, 153)))).to.equal(153)
  })

  it('should differentiate atoms/cells (3)', function () {
    expect(nock.nock(Cell.trel(3, 1, 0))).to.equal(1)
    expect(nock.nock(Cell.quad(3, 1, 0, 1))).to.equal(0)
  })

  it('should increment (4)', function () {
    expect(nock.nock(Cell.trel(4, 1, 0))).to.equal(1)
    expect(function () { nock.nock(Cell.quad(4, 1, 0, 1)) }).to.throw(Error)
    expect(nock.nock(1, Cell.trel(4, 0, 1))).to.equal(2)
    expect(nock.nock(Cell(1, 1), Cell.quad(4, 3, 0, 1))).to.equal(1)
  })

  it('should test equality (5)', function () {
    expect(nock.nock(Cell.quad(5, 1, 0, 0))).to.equal(0)
    expect(nock.nock(Cell.quad(5, 1, 1, 0))).to.equal(1)
    expect(function () { nock.nock(Cell.trel(5, 1, 0)) }).to.throw(Error)
    expect(nock.nock(Cell(0, 1), Cell.trel(5, Cell(0, 1), Cell(0, 1)))).to.equal(0)
    expect(nock.nock(Cell(0, 1), Cell.trel(5, Cell(0, 1), Cell(1, 1)))).to.equal(1)
    expect(nock.nock(Cell(0, 1), Cell.trel(5, Cell(0, 1), Cell.trel(1, 1, 1)))).to.equal(1)
  })
})

describe('run formulas', function () {
  it('should test 6-10', function () {
    if (typeof nock.useMacros === 'function') {
      macro(false)
      macro(true)
    } else {
      macro(false)
    }
  })
})

function macro (useMacros) {
  describe((useMacros ? 'macro ' : '') + 'formulas', function () {
    it('should eval ife (6)', function () {
      nock.useMacros && nock.useMacros(useMacros)
      expect(nock.nock(Cell(0, 1), '[6 [1 0] [1 8] 1 9]')).to.equal(8)
      expect(nock.nock(Cell(0, 1), '[6 [1 1] [1 8] 1 9]')).to.equal(9)
      expect(nock.nock(Cell(0, 1), '[6 [5 [1 1] 1 1] [1 8] 1 9]')).to.equal(8)
      expect(nock.nock(Cell(0, 1), '[6 [5 [1 1] 1 0] [1 8] 1 9]')).to.equal(9)
      expect(function () {
        nock.nock(Cell(0, 1), '[6 [1 2] [1 8] 1 9]')
      }).to.throw(Error)
    })

    it('should eval compose (7)', function () {
      nock.useMacros && nock.useMacros(useMacros)
      expect(nock.nock(42, '[7 [3 0 1] 4 0 1]')).to.equal(2)
      expect(nock.nock(42, '[7 [4 0 1] 4 0 1]')).to.equal(44)
    })

    it('should eval extend (8)', function () {
      nock.useMacros && nock.useMacros(useMacros)
      var n = nock.nock(42, '[8 [4 0 1] 0 1]')
      expect(n.hed).to.equal(43)
      expect(n.tal).to.equal(42)
      expect(nock.nock(42, '[8 [4 0 1] 4 0 3]')).to.equal(43)
    })

    it('should eval invoke (9)', function () {
      nock.useMacros && nock.useMacros(useMacros)
      // generated via hoon:
      // .*(~ !=(=>(~ |=(a/@ +(a)))))
      var s = '[[4 0 6] 0 0]'
      expect(nock.nock(s, '[9 2 0 1]')).to.equal(1)
      expect(nock.nock(s, '[9 2 [0 2] [1 6] 0 7]')).to.equal(7)

      // generated via hoon:
      // [->+:dec 0 0]
      s = '[[6 [5 [1 0] 0 6] [0 0] 8 [1 0] 8 [1 6 [5 [0 30] 4 0 6] [0 6] 9 2 [0 2] [4 0 6] 0 7] 9 2 0 1] 0 0]'
      expect(nock.nock(s, '[9 2 [0 2] [1 3] 0 7]')).to.equal(2)
      expect(nock.nock(s, '[9 2 [0 2] [1 50] 0 7]')).to.equal(49)
    })

    it('should eval hint (10)', function () {
      nock.useMacros && nock.useMacros(useMacros)
      var s = Cell(132, 19)

      expect(nock.nock(s, '[10 1 1 1]')).to.equal(1)
      expect(nock.nock(s, '[10 37 4 0 3]')).to.equal(20)
      expect(nock.nock(s, '[10 [37 1 0] 4 0 3]')).to.equal(20)

      expect(function () {
        nock.nock(s, '[10 [37 1] 4 0 3]')
      }).to.throw(Error)
    })
  })
}
