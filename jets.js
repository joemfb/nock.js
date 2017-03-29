/* global define */
(function (self, factory) {
  'use strict'

  if (typeof define === 'function' && define.amd) {
    define('jets', ['nock'], factory)
  } else if (typeof module === 'object' && typeof module.exports === 'object') {
    module.exports = factory(require('./nock'))
  } else {
    self.jets = factory(self.nock)
  }
}(this, function (nock) {
  'use strict'

  // note: no "cold" (persistent) state
  var state = {
    defined: [],      // "hot" state
    registered: []    // "warm" state
  }

  /* find registered jet by battery (in "warm" state) */
  function lookupWarm (batt) {                            // u3j_find
    var reg = state.registered.filter(function (r) {
      return nock.util.deepEqual(r.batt, batt)
    })

    if (!reg.length) return null
    if (reg.length > 1) console.log('found >1 jets for battery \n%s', JSON.stringify(batt))
    return reg[0]
  }

  /* find defined jet by path (in "hot" state) */
  function lookupHot (arg) {
    return state.defined[ typeof arg === 'string' ? arg : printPath(arg) ]
  }

  /* maybe dispatch jet in place of nock 9 */
  function dispatch (core, axis) {                        // u3j_kick
    var jet = lookupWarm(core[0])

    // battery not registered
    if (!jet) return null

    // validate parent, if set
    if (jet.parent) {                                     // _cj_fine
      var parent = nock.formulas.slot(core, jet.parent)

      if (!lookupWarm(parent[0])) {
        console.log('dispath "%s" missing parent', printPath(jet.path))
        return null
      }
    }

    // no implementation at this axis
    if (!(jet.arms && jet.arms[axis])) return null        // _cj_kick_z

    console.log('dispatch "%s" at /%d', printPath(jet.path), axis)
    return function () {
      return jet.arms[axis](core)
    }
  }

  /* validate parent before registering jetted core */
  function validateParent (core, slot) {                  // _cj_mine (partial)
    if (slot[0] !== 0) {
      console.log('bad parent slot in clue: %s', JSON.stringify(slot))
      return null
    }

    var axis = slot[1]
    var parent = nock.formulas.slot(core, axis)
    var jet = lookupWarm(parent[0])

    if (!jet) return null

    return { axis: axis, path: jet.path.slice() }
  }

  /* maybe register hinted core */
  function register (clue, core) {                        // u3j_mine
    var name = cord(clue[0])

    // already registered
    if (lookupWarm(core[0])) return null

    var parent = null
    var slot = clue[1][0]

    if (!nock.util.deepEqual(slot, [1, 0])) {              // _cj_mine 0==q_cey
      if (!(parent = validateParent(core, slot))) return null
    }

    var path = !parent ? [name] : parent.path.unshift(name) && parent.path
    var def = lookupHot(path)

    // no jet available
    if (!def) return null

    if (def.parent && !parent) {
      console.log('register "%s" parent not found', printPath(path))
      return null
    }

    // TODO
    if (clue[1][1] !== 0) {
      console.log('register "%s" ignore hooks: %s', printPath(path), JSON.stringify(clue[1][1]))
    }

    state.registered.push({
      path: path,
      parent: parent && parent.axis,
      batt: core[0],
      // TODO: other axes? named axes?
      arms: def.impl && { 2: def.impl }
    })

    console.log('register "%s"', printPath(path))

    // continue nocking
    return null
  }

  /* maybe intercept hint for jet registration */
  function hint (s, f) {                                  // _n_hint
    var hint = f[0]
    var tag = cord(hint[0])

    if (tag === 'fast') return register(nock.nock(s, hint[1]), nock.nock(s, f[1]))

    console.log('unknown hint: %s', tag);
    console.log(nock.nock(s, hint))

    return null
  }

  /* convert tree(s) of jet definitions in array with parents linked */
  function define (def, parent, _path) {                  // u3j_boot
    if (Array.isArray(def)) {
      return def.forEach(function (kid) { define(kid, parent, _path) })
    }

    var path

    if (!parent) {
      path = [def.name]
    } else {
      path = _path.slice()
      path.unshift(def.name)
    }

    var jet = {
      name: def.name,
      impl: def.impl,
      parent: parent || null
    }

    state.defined[printPath(path)] = jet

    if (def.children && def.children.length) {
      define(def.children, jet, path)
    }
  }

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
    return  '/' + path.slice().reverse().join('/')
  }

  return {
    dispatch: dispatch,
    register: register,
    hint: hint,
    define: function () {
      define.apply(null, arguments)
      return this
    },
    state: state,
    util: {
      cord: cord,
      path: printPath
    }
  }
}))
