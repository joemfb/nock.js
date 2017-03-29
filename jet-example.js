'use strict'

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
  var samp = nock.formulas.slot(core, 14)
  return nock.operators.lus(samp)
}

function two (core) {
  console.log('called two!!')
  var samp = nock.formulas.slot(core, 6)
  var doorSamp = nock.formulas.slot(core, 30)
  return [
    // nock.nock(nock.formulas.slot(core, 7), [9, [5, [0, 1]]]),
    nock.operators.lus(doorSamp),
    nock.operators.lus(samp)
  ]
}

/***************************************************/

// instantiate and configure the interpreter
function register (jets) {
  var nock = require('./nock')

  return nock.callbacks({ '9': jets.dispatch, '10': jets.hint })
}

var jets = require('./jets')

// declare jets and register in the interpreter
var nock = register(jets.define({
  name: 'root',
  impl: null,
  children: [
    { name: 'one', impl: one },
    { name: 'two', impl: two }
  ]
}))

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
console.log(nock.nock(core, pullTwo))
console.log('with sample')
console.log(nock.nock(core, sampTwo))
