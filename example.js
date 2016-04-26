'use strict';

var nock = require('./nock')

var f = [8, [1, 0], 8, [1, 6, [5, [0, 7], 4, 0, 6], [0, 6], 9, 2, [0, 2], [4, 0, 6], 0, 7], 9, 2, 0, 1]

console.log('decrementing 42')
console.log('result: ' + nock.nock(42, f))
console.log()
