'use strict'

var Cell = require('./cell')

function Dashboard (opts, def) {
  if (!(this instanceof Dashboard)) return new Dashboard(opts, def)

  if (def === undefined) {
    def = opts
    opts = null
  }

  this.options = opts || {}

  this.defined = {}       // "hot" state
  this.registered = []    // "warm" state
  // note: no "cold" (persistent) state

  this._init(def)
}

Dashboard.create = function (opts, def) {
  return Dashboard(opts, def)
}

/*
 *  initialize hot state
 *
 *  convert tree(s) of jet definitions to an object keyed by path
 *  with parents linked
 */
Dashboard.prototype._init = function (def, parent, path) {
  var self = this                                       // u3j_boot

  if (Array.isArray(def)) {
    return def.forEach(function (kid) {
      self._init(kid, parent, path)
    })
  }

  // TODO: validate def

  path = !parent ? [def.name] : path.concat([def.name])

  var jet = {
    name: def.name,
    impl: def.impl,
    parent: parent || null
  }

  this.defined[printPath(path)] = jet

  if (def.children && def.children.length) {
    this._init(def.children, jet, path)
  }
}

/*
 *  find jet definition by path (in "hot" state)
 */
Dashboard.prototype.getDef = function (arg) {
  return this.defined[
    typeof arg === 'string' ? arg : printPath(arg)
  ]
}

/*
 *  find registered jet by battery (in "warm" state)
 */
Dashboard.prototype.getJet = function (batt) {
  // TODO: use hash
  var reg = this.registered.filter(function (r) {       // u3j_find
    return Cell(r.batt, batt).equal()
  })

  if (!reg.length) return null
  if (reg.length > 1) console.log('found >1 jets for battery \n%s', JSON.stringify(batt))
  return reg[0]
}

/*
 *  maybe register hinted core
 */
Dashboard.prototype.register = function (clue, core) {
  var name = cord(clue.hed)                             // u3j_mine

  // already registered
  if (this.getJet(core.hed)) return

  var pFol = clue.tal.hed
  var parent = null

  if (!(pFol.hed === 1 && pFol.tal === 0)) {            // _cj_mine 0==q_cey
    if (pFol.hed !== 0) throw new Error('bad parent formula')
    if (!(parent = this.getJet(core.slot(pFol.tal).hed))) return
  }

  var path = !parent ? [name] : parent.path.concat([name])
  var def = this.getDef(path)

  // no jet available
  if (!def) return

  if (def.parent && !parent) {
    console.log('register "%s" parent not found', printPath(path))
    return
  }

  // TODO
  if (clue.tal.tal !== 0) {
    console.log('register "%s" ignore hooks: %s', printPath(path), clue.tal.tal.toString())
  }

  // TODO: by hash
  this.registered.push({
    path: path,
    parent: parent && pFol.tal,
    batt: core.hed,
    // TODO: other axes? named axes?
    arms: def.impl && { 2: def.impl }
  })

  if (this.options.verbose) {
    console.log('register "%s"', printPath(path))
  }
  return
}

/*
 *  maybe dispatch jet in place of nock 9
 */
Dashboard.prototype.dispatch = function (core, axis) {
  var jet = this.getJet(core.hed)                       // u3j_kick

  // battery not registered
  if (!jet) return null

  // validate parent, if set                            // _cj_fine
  if (jet.parent && !this.getJet(core.slot(jet.parent).hed)) {
    console.log('dispath "%s" missing parent', printPath(jet.path))
    return null
  }

  // no implementation at this axis
  if (!(jet.arms && jet.arms[axis])) return null        // _cj_kick_z

  if (this.options.verbose) {
    console.log('dispatch "%s" at /%d', printPath(jet.path), axis)
  }
  return function () {
    return jet.arms[axis](core)
  }
}

// TODO: move to atom lib
/* string from atom, caching */
var cordCache = {}
function cord (x) {
  if (typeof x !== 'number') throw new Error('bad cord')

  return cordCache[x] = cordCache[x] ||
  x.toString(16)
  .match(/(..)/g)
  .map(function (a) {
    return String.fromCharCode(parseInt(a, 16))
  })
  .reverse()
  .join('')
}

function printPath (path) {
  if (!Array.isArray(path)) throw new Error('bad path')
  return  '/' + path.slice().join('/')
}

module.exports = Dashboard
