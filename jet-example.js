'use strict'

var Cell = require('./lib/cell')

// hoon core (run as a generator)

/*
:-  %say  |=  *  :-  %noun                              ::  generator prelude
!.  !=                                                  ::  nock w/out debug
=>  ~                                                   ::  ~ context
~%  %root  ~  ~
|_  samp/@
++  one
  =<  $
  ~%  %one  +  ~
  |.  +(samp)
++  two
  ~/  %two
  |=  a/@
  [one +(a)]
--
*/

// compiled nock

var s = '\
[ 7 \
  [8 [1 0] [1 [7 [8 [1 0] [1 [9 5 0 7] 4 0 6] 0 1] 10 [1.953.718.630 1 7.305.076 [0 7] 0] 0 1] 7 [8 [1 4 0 14] 10 [1.953.718.630 1 6.647.407 [0 3] 0] 0 1] 9 2 0 1] 0 1] \
  10 \
  [1.953.718.630 1 1.953.460.082 [1 0] 0] \
  0 \
  1]'

/***************************************************/

// implement jets

function one (core) {
  console.log('called one!!')
  var samp = core.slot(14)
  return 1 + samp
}

function two (core) {
  console.log('called two!!')
  var samp = core.slot(6)
  var doorSamp = core.slot(30)
  return Cell(
    // nock.nock(core.slot(7), [9, [5, [0, 1]]]),
    1 + doorSamp,
    1 + samp
  )
}

/***************************************************/

var nock = require('./index')
var Dashboard = require('./lib/dashboard')

// create a dashboard and define our jets
var dash = Dashboard.create({ verbose:true }, {
  name: 'root',
  impl: null,
  children: [
    { name: 'one', impl: one },
    { name: 'two', impl: two }
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

// make the formula .(+6 x)
function samp (x) {
  return [[0, 2], [[1, x], [0, 7]]]
}

var pullOne = [9, [5, [0, 1]]]
var sampOne = [9, [5, samp(25)]]

console.log()
console.log('one')
console.log(nock.nock(core, pullOne))
console.log('with sample')
console.log(nock.nock(core, sampOne))

var pullTwo = [7, [[9, [4, [0, 1]]], [9, [2, [0, 1]]]]]
var sampTwo = [7, [[9, [4, samp(24)]], [9, [2, samp(25)]]]]

console.log()
console.log('two')
console.log(nock.nock(core, pullTwo).toString())
console.log('with sample')
console.log(nock.nock(core, sampTwo).toString())
