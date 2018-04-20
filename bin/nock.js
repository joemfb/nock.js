'use strict'

var fs = require('fs')
var nock = require('../lib/nocks')
var atom = require('../lib/atom')
var Cell = require('../lib/cell')
var jets = require('../lib/jets')
var Dashboard = require('../lib/dashboard')
var cue = jets.raw.two.cue

var dash = Dashboard.create(
  // { verbose: true },
  {
  // name: 'main',
  // impl: null,
  // children: [{
    name: 'mood',
    impl: null,
    children: [{
      name: 'lib',
      impl: null,
      children: [
        { name: 'add', impl: jets.one.add },
        { name: 'dec', impl: jets.one.dec },
        { name: 'div', impl: jets.one.div },
        { name: 'gte', impl: jets.one.gte },
        { name: 'gth', impl: jets.one.gth },
        { name: 'lte', impl: jets.one.lte },
        { name: 'lth', impl: jets.one.lth },
        { name: 'max', impl: jets.one.max },
        { name: 'min', impl: jets.one.min },
        { name: 'mod', impl: jets.one.mod },
        { name: 'mul', impl: jets.one.mul },
        { name: 'sub', impl: jets.one.sub },
        { name: 'bex', impl: jets.two.bex },
        { name: 'cut', impl: jets.two.cut },
        // { name: 'end', impl: jets.two.end },
        { name: 'met', impl: jets.two.met },
        { name: 'rip', impl: jets.two.rip },
        { name: 'rsh', impl: jets.two.rsh },
        { name: 'cue', impl: jets.two.cue },
        { name: 'rub', impl: jets.two.rub }
      ]
    }]
  // }]
})

function hint (s, f) {
  var hint = f.hed

  // if (tag === 'fast') {
  if (hint.hed === 0x74736166) {
    // console.log(hint.tal.toString())
    dash.register(nock.nock(s, hint.tal), nock.nock(s, f.tal))
    return null
  }

  try {
    console.log('unknown hint: %s', atom.util.toCord(hint.hed));
    // console.log(nock.nock(s, hint))
  }
  catch (ex) {
    console.log(ex)
    return null
  }

  return null
}

// nock.callbacks({
//   '9': dash.dispatch.bind(dash),
//   '10': hint
// })

function usage () {
  console.log(
    'nock.js                                                  \n\
    evaluate a nock formula from a file with -f path/to/file  \n\
    (optionally include a formula produce a subject with -s)  \n\
    computes .*([1 0] fol) or .*([1 0], [7 sub fol])'
  )
}

function getArg (a) {
  var b = process.argv.indexOf(a)
  if (b !== -1 && b < process.argv.length - 1) return b + 1
  return -1
}

function nockArg (a) {
  var i = (a === -1) ? 3 : args.s + 1
  return Cell.fromString(process.argv.slice(i).join(' '))
}

function nockFile (a) {
  if (/\.pill$/.test(a)) {
    console.time('pill')
    // console.log('*******')
    // console.log(atom.util.fromBytes(fs.readFileSync(a)).toString(16))
    // console.log('*******')
    var b = cue(atom.util.fromBytes(fs.readFileSync(a)))
    console.timeEnd('pill')
    return b
  }

  return Cell.fromString(fs.readFileSync(a, 'utf-8'))
}

if (process.argv.length < 3) return usage()

var args = { s: getArg('-s'), f: getArg('-f') }
var sig = Cell(1, 0)
var sub = (args.s === -1) ? null : nockFile(process.argv[args.s])
var fol = (args.f === -1) ? nockArg(args.s) : nockFile(process.argv[args.f])

// try {
var prod = (sub == null) ? nock.nock(sig, fol) : nock.nock(sig, Cell.trel(7, sub, fol))
// } catch(e) {
//   console.log(dash)
//   throw e
// }

// console.log(sub.toString())
// console.log(fol.toString())

// console.time('nock')
// var prod = nock.nock(sub, fol)
// console.timeEnd('nock')

// console.log('****** PROD *********')
// var x

// if (!(prod instanceof Cell)) {
  console.log(prod.toString())
// } else {
//   x = prod
//   while (x) {
//     console.log(x.hed.toString())
//     console.log(x.hed.tal.tal)
//     console.log(x.hed.tal.tal.hed.tal.hed.toString())
//     console.log(x.hed.tal.tal.tal.tal.hed)
//     console.log(x.hed.tal.tal.equal())
//     console.log(x.hed.tal.tal.hed.toString() === x.hed.tal.tal.tal.toString())
//     x = x.tal
//   }

// }


// console.log(dash)
