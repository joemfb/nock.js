'use strict'

var nock = require('./nock')

var f = [8, [1, 0], 8, [1, 6, [5, [0, 7], 4, 0, 6], [0, 6], 9, 2, [0, 2], [4, 0, 6], 0, 7], 9, 2, 0, 1]

console.log('decrementing 42')
console.log('result: ' + nock.nock(42, f))
console.log()

f = '[7 [1 42] 7 [0 1] 8 [1 0] 8 [1 6 [5 [0 7] 4 0 6] [0 6] 9 2 [0 2] [4 0 6] 0 7] 9 2 0 1]'
console.log('decrementing 42 (from a string formula)')
console.log('result: ' + nock.nock(f))
console.log()

console.log(nock.nock('[8 [[7 [0 1] 8 [1 1 97 98 99 0] 9 2 0 1] 7 [0 1] 8 [1 1 99 100 101 0] 9 2 0 1] 8 [1 6 [5 [1 0] 0 12] [0 13] [0 24] 9 2 [0 2] [[0 25] 0 13] 0 7] 9 2 0 1]').toString())
