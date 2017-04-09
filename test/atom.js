/* eslint-env mocha */
'use strict'

var expect = require('chai').expect
var atom = require('../lib/atom')
var Cell = require('../lib/cell')

describe('atom', function () {
  it('should test for atom', function () {
    expect(atom.isAtom(0)).to.be.true
    expect(atom.isAtom(1)).to.be.true
    expect(atom.isAtom(Cell(0, 1))).to.be.false
  })

  it('should increment', function () {
    expect(atom.incr(1)).to.equal(2)
    expect(atom.incr(2)).to.equal(3)
  })
})
