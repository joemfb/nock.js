var nock = require('./lib/nocks')
var Cell = require('./lib/cell')
var jets = require('./lib/jets')

// Ackermann function from
// https://github.com/frodwith/jaque/blob/c5395c79e69b3e18382ab459f300017759ec82ca/src/clojure/ack.clj
var ack = '[7 [1 7.037.793] 8 [1 [7 [8 [1 0] [1 6 [5 [1 0] 0 6] [0 0] 8 [1 0] 8 [1 6 [5 [4 0 6] 0 30] [0 6] 9 2 [0 2] [4 0 6] 0 7] 9 2 0 1] 0 1] 10 [1.953.718.630 1 6.514.020 [0 7] 0] 0 1] 7 [8 [1 0 0] [1 6 [5 [1 0] 0 12] [4 0 13] 6 [5 [1 0] 0 13] [9 2 [0 2] [[8 [9 4 0 7] 9 2 [0 4] [0 28] 0 11] 1 1] 0 7] 9 2 [0 2] [[8 [9 4 0 7] 9 2 [0 4] [0 28] 0 11] 9 2 [0 2] [[0 12] 8 [9 4 0 7] 9 2 [0 4] [0 29] 0 11] 0 7] 0 7] 0 1] 10 [1.953.718.630 1 7.037.793 [0 7] 0] 0 1] 10 [1.953.718.630 1 1.852.399.981 [1 0] 0] 0 1]'

// var counter = 0

var Dashboard = require('./lib/dashboard')
var dash = Dashboard.create({
  name: 'main',
  impl: null,
  children: [{
    name: 'dec',
    impl: jets.one.dec
  }]
})

function hint (s, f) {
  if (f.hed.hed === 0x74736166) {
    dash.register(nock.nock(s, f.hed.tal), nock.nock(s, f.tal))
    return null
  }
  return null
}

nock.callbacks({
  '9': dash.dispatch.bind(dash),
  '10': hint
})

var s = nock.nock(0, Cell.fromString(ack))

window.ack = function () {

console.time('A(3,7)-jet')
console.log(nock.nock(s, Cell.fromString('[7 [9 5 0 1] 9 2 [0 2] [1 3 9] 0 7]')))
console.timeEnd('A(3,7)-jet')

console.log(dash)

// console.log('jet invoked %d times', counter)
}