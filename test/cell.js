/* eslint-env mocha */
'use strict'

var expect = require('chai').expect
var Cell = require('../lib/cell')

describe('Cell', function () {
  it('should pair', function () {
    var x = Cell.pair(1, 2)
    expect(x).to.be.an.instanceof(Cell)
    expect(x.hed).to.equal(1)
    expect(x.tal).to.equal(2)
  })

  it('should trel', function () {
    var x = Cell.trel(1, 2, 3)
    expect(x).to.be.an.instanceof(Cell)
    expect(x.hed).to.equal(1)
    expect(x.tal).to.be.an.instanceof(Cell)
    expect(x.tal.hed).to.equal(2)
    expect(x.tal.tal).to.equal(3)
  })

  it('should quad', function () {
    var x = Cell.quad(1, 2, 3, 4)
    expect(x).to.be.an.instanceof(Cell)
    expect(x.hed).to.equal(1)
    expect(x.tal).to.be.an.instanceof(Cell)
    expect(x.tal.hed).to.equal(2)
    expect(x.tal.tal).to.be.an.instanceof(Cell)
    expect(x.tal.tal.hed).to.equal(3)
    expect(x.tal.tal.tal).to.equal(4)
  })

  it('should equal', function () {
    var x = Cell.pair(1, 2)
    expect(x.equal()).to.be.false

    x = Cell.pair(2, 2)
    expect(x.equal()).to.be.true

    x = Cell.pair(Cell.pair(3, 3), Cell.pair(3, 3))
    expect(x.equal()).to.be.true

    x = Cell.pair(Cell.pair(4, 5), Cell.pair(6, 7))
    expect(x.equal()).to.be.false
  })

  it('should slot', function () {
    var x = Cell.pair(1, 2)
    expect(x.slot(1)).to.equal(x)
    expect(x.slot(2)).to.equal(1)
    expect(x.slot(3)).to.equal(2)

    x = Cell.quad(1, 2, 3, 4)
    expect(x.slot(1)).to.equal(x)
    expect(x.slot(2)).to.equal(1)
    expect(x.slot(3)).to.be.an.instanceof(Cell)
    expect(x.slot(6)).to.equal(2)
    expect(x.slot(7)).to.be.an.instanceof(Cell)
    expect(x.slot(14)).to.equal(3)
    expect(x.slot(15)).to.equal(4)
  })

  it('should mug', function () {
    expect(Cell(1, 0).mug()).to.equal(757997067)
  })

  it('should print', function () {
    var x = Cell.pair(1, 2)
    expect(x.toString()).to.equal('[1 2]')

    x = Cell.trel(1, 2, 3)
    expect(x.toString()).to.equal('[1 2 3]')

    x = Cell.pair(Cell.pair(1, 2), 3)
    expect(x.toString()).to.equal('[[1 2] 3]')
  })

  // TODO: fromString, fromArray
})
