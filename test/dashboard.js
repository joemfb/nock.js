/* eslint-env mocha */
'use strict'

var expect = require('chai').expect
var Dashboard = require('../lib/dashboard')
var Cell = require('../lib/cell')

describe('dashboard', function () {
  it('should initialize', function () {
    var dash = Dashboard.create({
      name: 'root',
      impl: null,
      children: [
        { name: 'one', impl: null },
        { name: 'two', impl: null }
      ]
    })

    expect(dash.getDef('/root')).not.to.be.undefined
    expect(dash.getDef('/root').parent).to.equal(null)
    expect(dash.getDef('/root/one')).not.to.be.undefined
    expect(dash.getDef('/root/one').parent).to.equal(dash.defined['/root'])
    expect(dash.getDef('/root/two')).not.to.be.undefined
    expect(dash.getDef('/root/two').parent).to.equal(dash.defined['/root'])
  })

  it('should register', function () {
    var dash = Dashboard.create({
      name: 'root',
      impl: null
    })

    //  ~%(%root ~ ~ |.(1))
    //  full hint would be
    //  [10 [1.953.718.630 1 1.953.460.082 [1 0] 0] 0 1]
    var clue = Cell.fromString('[1.953.460.082 [1 0] 0]')
    var core = Cell.fromString('[[1 1] 0]')
    dash.register(clue, core)

    expect(dash.registered.length).to.equal(1)
    expect(dash.registered[0].path[0]).to.equal('root')
    expect(dash.getJet(core.hed)).to.equal(dash.registered[0])
  })

  it('should dispatch', function () {
    var count = 0
    var thunk = function () { return count++ }
    var dash = Dashboard.create({
      name: 'root',
      impl: thunk
    })

    var clue = Cell.fromString('[1.953.460.082 [1 0] 0]')
    var core = Cell.fromString('[[1 1] 0]')
    dash.register(clue, core)

    var jet = dash.dispatch(core, 2)
    expect(jet).not.to.be.null
    expect(count).to.equal(0)
    expect(jet()).to.equal(0)
    expect(count).to.equal(1)
  })

  // TODO: bad clue, missing parent
})
