/* eslint-env mocha */
'use strict'

var expect = require('chai').expect
var nock = require('./nock')

describe('operators', function () {
  var op = nock.operators

  it('should differentiate nouns (wut ?)', function () {
    expect(op.wut(0)).to.equal(1)
    expect(op.wut([0, 1])).to.equal(0)
  })

  it('should increment (lus +)', function () {
    expect(op.lus(0)).to.equal(1)
    expect(function () { op.lus([0, 1]) }).to.throw(/lus cell/)
  })

  it('should test equality (tis =)', function () {
    expect(op.tis([0, 0])).to.equal(0)
    expect(op.tis([1, 0])).to.equal(1)
    expect(function () { op.tis(0) }).to.throw(/tis atom/)
    // expect(op.tis([[0, 1], [0, 1]])).to.equal(0)
  })

  it('should resolve tree address (fas /)', function () {
    expect(function () { op.fas(0, 1) }).to.throw(/invalid fas addr/)
    expect(op.fas(1, 0)).to.equal(0)
    expect(op.fas(2, [1, 0])).to.equal(1)
    expect(op.fas(3, [1, 0])).to.equal(0)
    expect(op.fas(4, [[2, 0], [3, 1]])).to.equal(2)
    expect(op.fas(5, [[2, 0], [3, 1]])).to.equal(0)
    expect(op.fas(6, [[2, 0], [3, 1]])).to.equal(3)
    expect(op.fas(7, [[2, 0], [3, 1]])).to.equal(1)
  })
})

describe('formulas', function () {
  var f = nock.formulas

  it('should eval slot (0)', function () {
    expect(f.slot([[2, 0], [3, 1]], 4)).to.equal(2)
    expect(function () { f.slot([[2, 0], [3, 1]], 8) }).to.throw(/invalid fas addr: 8/)
  })

  it('should eval constant (1)', function () {
    expect(f.constant(1, 2)).to.equal(2)
  })

  it('should eval evaluate (2)', function () {
    expect(f.evaluate(1, [[1, 2], [1, [0, 1]]])).to.equal(2)
    expect(f.evaluate(77, [[1, 42], [1, [1, 153]]])).to.equal(153)
  })

  it('should eval cell (3)', function () {
    expect(f.cell(1, [0, 1])).to.equal(1)
    expect(f.cell([1, 1], [0, 1])).to.equal(0)
  })

  it('should eval incr (4)', function () {
    expect(f.incr(1, [0, 1])).to.equal(2)
    expect(f.incr([1, 1], [3, [0, 1]])).to.equal(1)
  })

  it('should eval eq (5)', function () {
    expect(f.eq([1, 1], [0, 1])).to.equal(0)
    expect(f.eq([0, 1], [0, 1])).to.equal(1)
  })

  it('should eval ife (6)', function () {
    var n = f.ife([0, 1], [[1, 0], [[1, 8], [1, 9]]])
    expect(n).to.equal(8)

    n = f.ife([0, 1], [[1, 1], [[1, 8], [1, 9]]])
    expect(n).to.equal(9)

    n = f.ife([0, 1], [[5, [[1, 1], [1, 1]]], [[1, 8], [1, 9]]])
    expect(n).to.equal(8)

    n = f.ife([0, 1], [[5, [[1, 1], [1, 0]]], [[1, 8], [1, 9]]])
    expect(n).to.equal(9)

    var fn = function () {
      f.ife([0, 1], [[1, 2], [[1, 8], [1, 9]]])
    }
    expect(fn).to.throw(Error)
  })

  it('should eval compose (7)', function () {
    expect(f.compose(42, [[3, [0, 1]], [4, [0, 1]]])).to.equal(2)
    expect(f.compose(42, [[4, [0, 1]], [4, [0, 1]]])).to.equal(44)
  })

  it('should eval extend (8)', function () {
    var n = f.extend(42, [[4, [0, 1]], [0, 1]])
    expect(n[0]).to.equal(43)
    expect(n[1]).to.equal(42)
    expect(f.extend(42, [[4, [0, 1]], [4, [0, 3]]])).to.equal(43)
  })

  it('should eval invoke (9)', function () {
    // generated via hoon:
    // !=((|=(@ +(a)) 2))
    var subject = [[[4, [0, 6]], [0, [0, 1]]], [0, 1]]
    var formula = [2, [[0, 4], [[7, [[0, 3], [1, 2]]], [0, 11]]]]
    var n = f.invoke(subject, formula)
    expect(n).to.equal(3)

    // generated via hoon (kernel decrement):
    // (dec 10)
    // !=((|=(a/@ ?<(=(0 a) =+(b=0 |-(^-(@ ?:(=(a +(b)) b $(b +(b)))))))) 10))
    subject = [[[6, [[5, [[1, 0], [0, 6]]], [[0, 0], [8, [[1, 0], [8, [[1, [6, [[5, [[0, 30], [4, [0, 6]]]], [[0, 6], [9, [2, [[0, 2], [[4, [0, 6]], [0, 7]]]]]]]]], [9, [2, [0, 1]]]]]]]]]], [0, [0, 1]]], [0, 1]]
    formula = [2, [[0, 4], [[7, [[0, 3], [1, 10]]], [0, 11]]]]
    n = f.invoke(subject, formula)
    expect(n).to.equal(9)
  })

  it('should eval hint (10)', function () {
    var n = f.hint([0, 1], [1, [1, 1]])
    expect(n).to.equal(1)

    n = f.hint([132, 19], [37, [4, [0, 3]]])
    expect(n).to.equal(20)

    n = f.hint([132, 19], [[37, [1, 0]], [4, [0, 3]]])
    expect(n).to.equal(20)

    var fn = function () {
      f.hint([0, 1], [[1, 0], [1, 1]])
    }
    expect(fn).to.throw(Error)
  })
})

describe('macro formulas', function () {
  var f = nock.formulas

  beforeEach(function () {
    nock.useMacros()
  })

  it('should eval ife macro (6)', function () {
    var n = f.macroIfe([0, 1], [[1, 0], [[1, 8], [1, 9]]])
    expect(n).to.equal(8)

    n = f.macroIfe([0, 1], [[1, 1], [[1, 8], [1, 9]]])
    expect(n).to.equal(9)

    n = f.macroIfe([0, 1], [[5, [[1, 1], [1, 1]]], [[1, 8], [1, 9]]])
    expect(n).to.equal(8)

    n = f.macroIfe([0, 1], [[5, [[1, 1], [1, 0]]], [[1, 8], [1, 9]]])
    expect(n).to.equal(9)

    var fn = function () {
      f.macroIfe([0, 1], [[1, 2], [[1, 8], [1, 9]]])
    }
    expect(fn).to.throw(Error)
  })

  it('should eval compose macro (7)', function () {
    expect(f.macroCompose(42, [[3, [0, 1]], [4, [0, 1]]])).to.equal(2)
    expect(f.macroCompose(42, [[4, [0, 1]], [4, [0, 1]]])).to.equal(44)
  })

  it('should eval extend macro (8)', function () {
    var n = f.macroExtend(42, [[4, [0, 1]], [0, 1]])
    expect(n[0]).to.equal(43)
    expect(n[1]).to.equal(42)
    expect(f.macroExtend(42, [[4, [0, 1]], [4, [0, 3]]])).to.equal(43)
  })

  it('should eval invoke macro (9)', function () {
    var subject = [[[4, [0, 6]], [0, [0, 1]]], [0, 1]]
    var formula = [2, [[0, 4], [[7, [[0, 3], [1, 2]]], [0, 11]]]]
    var n = f.macroInvoke(subject, formula)
    expect(n).to.equal(3)

    subject = [[[6, [[5, [[1, 0], [0, 6]]], [[0, 0], [8, [[1, 0], [8, [[1, [6, [[5, [[0, 30], [4, [0, 6]]]], [[0, 6], [9, [2, [[0, 2], [[4, [0, 6]], [0, 7]]]]]]]]], [9, [2, [0, 1]]]]]]]]]], [0, [0, 1]]], [0, 1]]
    formula = [2, [[0, 4], [[7, [[0, 3], [1, 10]]], [0, 11]]]]
    n = f.macroInvoke(subject, formula)
    expect(n).to.equal(9)
  })

  it('should eval hint macro (10)', function () {
    var n = f.macroHint([0, 1], [1, [1, 1]])
    expect(n).to.equal(1)

    n = f.macroHint([132, 19], [37, [4, [0, 3]]])
    expect(n).to.equal(20)

    n = f.macroHint([132, 19], [[37, [1, 0]], [4, [0, 3]]])
    expect(n).to.equal(20)

    var fn = function () {
      f.macroHint([0, 1], [[1, 0], [1, 1]])
    }
    expect(fn).to.throw(Error)
  })
})

describe('nock', function () {
  var dec1 = [8, [1, 0], 8, [1, 6, [5, [0, 7], 4, 0, 6], [0, 6], 9, 2, [0, 2], [4, 0, 6], 0, 7], 9, 2, 0, 1]
  var dec2 = [7, [0, 1], 8, [1, 0], 8, [1, 6, [5, [0, 7], 4, 0, 6], [0, 6], 9, 2, [0, 2], [4, 0, 6], 0, 7], 9, 2, 0, 1]
  var dec3 = '[7 [1 42] 7 [0 1] 8 [1 0] 8 [1 6 [5 [0 7] 4 0 6] [0 6] 9 2 [0 2] [4 0 6] 0 7] 9 2 0 1]'

  it('should decrement', function () {
    nock.useMacros(false)
    expect(nock.nock(42, dec1)).to.equal(41)
    expect(nock.nock(42, dec2)).to.equal(41)
  })

  it('should decrement with macros', function () {
    nock.useMacros()
    expect(nock.nock(42, dec1)).to.equal(41)
    expect(nock.nock(42, dec2)).to.equal(41)
  })

  it('should parse hoon/nock tape and decrement', function () {
    nock.useMacros(false)
    expect(nock.nock(dec3)).to.equal(41)
  })
})
