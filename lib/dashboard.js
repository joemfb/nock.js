'use strict'

var atom = require('./atom')
var toCord = require('./atom').util.toCord



/*
warm state:

map battery -> (trel calf (pair bash cope) club)

++  bane  @tas                                  ::  battery name
++  bash  @uvH                                  ::  label hash
++  calf                                        ::
  $:  jax/@ud                                   ::  hot core index
      hap/(map @ud @ud)                         ::  axis/hot arm index
      lab/path                                  ::  label as path
      jit/*                                     ::  arbitrary data
  ==                                            ::
++  club  (pair corp (map term nock))           ::  battery pattern
++  cope  (trel bane axis (each bash noun))     ::  core pattern
++  corp  (each core batt)                      ::  parent or static

{
  calf: {
    jax: 0,         // hot core index
    hap: { 2: 0 },  // hot axis->arm index
    lab: ?,         // label path
    jit: null
  },
  bash: ?,          // label hash
  cope: {
    bane: 'dec',    // string label from fast hint
    axis: 3,        // parent axis relative to this core
    parent: [
      // either:
      { bash: ? },  // parent core label hash
      { noun: * }   // constant noun
    ]
  },
  club: {
    corp: [
      //either:
      { core: ? }  // dynamic parent?
      { batt: ? }  // static parent?
    ],
    hook: {}       // map hook name -> nock
  }
}


*/
function Dashboard (opts, def) {
  if (!(this instanceof Dashboard)) return new Dashboard(opts, def)

  if (def === undefined) {
    def = opts
    opts = null
  }

  this.options = opts || {}

  this.defined = {}       // "hot" state
  this.registered = {}    // "warm" state
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
    label: atom.util.fromCord(def.name),
    impl: def.impl,
    parent: parent || null
  }

  this.defined['/' + path.join('/')] = jet

  if (def.children && def.children.length) {
    this._init(def.children, jet, path)
  }
}

/*
 *  find jet definition by path (in "hot" state)
 */
Dashboard.prototype.getDef = function (arg) {
  return this.defined[
    typeof arg === 'string' ? arg : ('/' + arg.join('/'))
  ]
}

Dashboard.prototype.find = function (arg) {
  // if ()
}

/*
 *  find registered jet by battery (in "warm" state)
 */
Dashboard.prototype.getJet = function (batt) {
  return this.registered[batt.mug()]                    // u3j_find
}

/*
 *  maybe register hinted core
 */
Dashboard.prototype.register = function (clue, core) {
  var name = toCord(clue.hed)                           // u3j_mine

  // already registered
  if (this.getJet(core.hed)) return

  // console.log('maybe register %s', name)

  var pFol = clue.tal.hed
  var parent = null

  if (!(pFol.hed === 1 && pFol.tal === 0)) {            // _cj_mine 0==q_cey
    if (pFol.hed !== 0) {
      console.log('bad parent formula for %s', name)
      console.log(pFol.toString())
      return
    }
    if (!(parent = this.getJet(core.slot(pFol.tal).hed))) {
      console.log('missing parent for %s at %d', name, pFol.tal)
      return
    }
  }

  var path = !parent ? [name] : parent.path.concat([name])
  var def = this.getDef(path)

  // no jet available
  if (!def) return

  if (def.parent && !parent) {
    console.log('register "/%s" parent not found', path.join('/'))
    return
  }

  // TODO
  if (clue.tal.tal !== 0) {
    console.log('register "/%s" ignore hooks: %s', path.join('/'), clue.tal.tal.toString())
  }

  this.registered[core.hed.mug()] = {
    path: path,
    parent: parent && pFol.tal,
    batt: core.hed,
    // TODO: other axes? named axes?
    arms: def.impl && { 2: def.impl }
  }

  if (this.options.verbose) {
    console.log('register "/%s"', path.join('/'))
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
    console.log('dispath "/%s" missing parent', jet.path.join('/'))
    return null
  }

  // no implementation at this axis
  if (!(jet.arms && jet.arms[axis])) return null        // _cj_kick_z

  if (this.options.verbose) {
    console.log('dispatch "/%s" at /%d', jet.path.join('/'), axis)
  }
  return function () {
    return jet.arms[axis](core)
    // var result = jet.arms[axis](core)
    // if (atom.isAtom(result))
    // if (result.negative === 1 || result < 0) {
    //   console.log('+++++++')
    //   console.log(jet)
    //   console.log(result)
    //   console.log(core.slot(6).toString())
    //   console.log('______')
    // }
    // return result
  }
}

module.exports = Dashboard
