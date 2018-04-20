'use strict'

var fs = require('fs')
var s = fs.readFileSync('./layer-1a.txt', 'utf-8')

// implement jets

function dec (core) {
  console.log('jet dec')
  var samp = core.slot(6)
  if (samp === 0) throw new Error('dec underflow')
  return samp - 1
}

/***************************************************/

var nock = require('./index')
var Dashboard = require('./lib/dashboard')

// create a dashboard and define our jets
var dash = Dashboard.create({ verbose:true }, {
  name: 'one',
  impl: null,
  children: [
    { name: 'dec', impl: dec }
  ]
})

// create a general hint callback
function hint (s, f) {                                  // _n_hint
  var hint = f.hed

  // if (tag === 'fast') {
  if (hint.hed === 0x74736166) {
    dash.register(nock.nock(s, hint.tal), nock.nock(s, f.tal))
    return null
  }

  console.log('unknown hint: %s', hint.hed);
  console.log(nock.nock(s, hint))

  return null
}

nock.callbacks({
  '9': dash.dispatch.bind(dash),
  '10': hint
})

/***************************************************/

// "install" core
var core = nock.nock(s)

// console.log(core.toString())

// console.log('\ntry dec')
console.log(nock.nock(core, '[8 [9 1.516 0 1] 9 2 [0 4] [7 [0 3] 1 999] 0 11]'))
console.log()
console.log(dash)
