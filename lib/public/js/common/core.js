import "babel-polyfill"

import
  { Map    as IMap
  , List   as IList
  , Set    as ISet
  , fromJS as IfromJS
  } from "immutable"

export
  { Map as IMap
  , List as IList
  , Set as ISet
  } from "immutable"

export const ImmuneNS = Symbol("ImmuneNS")

export function Type (name, spec) {
  const CustomType = function Type (...args) {
    if (!(this instanceof CustomType))
      return new CustomType(...args)

    this._tag  = name
    this._args = args

    spec.forEach((val, idx) => this[val] = args[idx])

    this.toString = function () {
      return this._tag + "(" + this._args.join(", ") + ")"
    }
    this.inspect = function () {
      return this._tag + "(" + this._args.join(", ") + ")"
    }
  }
  return CustomType
}

export function Union (name, spec) {
  const UnionType = Type(name, [])

  UnionType.prototype._tag = name

  Object.keys(spec).forEach(key => {
    var T = spec[key]

    UnionType[key] = Type(key, T)
    UnionType[key].prototype = new UnionType()
    UnionType[key].constructor = UnionType

    UnionType[key].prototype.match = function (_spec) {
      return _spec[this._tag](...T.map(key => this[key]))
    }
  })

  return UnionType
}

export const match = (v, spec) => v.match(spec)

const constrainArity = (f, n) => {
  switch (n) {
    case 1  : return (a) => f(a)
    case 2  : return (a, b) => f(a, b)
    case 3  : return (a, b, c) => f(a, b, c)
    case 4  : return (a, b, c, d) => f(a, b, c, d)
    case 5  : return (a, b, c, d, e) => f(a, b, c, d, e)
    case 6  : return (a, b, c, d, e, f) => f(a, b, c, d, e, f)
    case 7  : return (a, b, c, d, e, f, g) => f(a, b, c, d, e, f, g)
    case 8  : return (a, b, c, d, e, f, g, h) => f(a, b, c, d, e, f, g, h)
    case 9  : return (a, b, c, d, e, f, g, h, i) => f(a, b, c, d, e, f, g, h, i)
    case 10 : return (a, b, c, d, e, f, g, h, i, j) => f(a, b, c, d, e, f, g, h, i, j)
    default: return f
  }
}

export const constrainedArgs = (arityConstraint, args) =>
  (arityConstraint ? args.map((arg, i) => arityConstraint[i + 1] ? constrainArity(arg, arityConstraint[i + 1].limit) : arg) : args)

export const dispatch = (name, arityConstraint) => (xs, ...args) => {
  if (xs !== null) {
    let namespaced = xs.constructor && xs.constructor[ImmuneNS]
    if (namespaced && typeof(namespaced[name]) === 'function') return namespaced[name](xs, ...constrainedArgs(arityConstraint, args))
    if (typeof(xs[name]) === 'function') return xs[name](...constrainedArgs(arityConstraint, args))
  }

  throw new TypeError(`No implementation of ${name} found for ${xs}`)
}

Object[ImmuneNS] =
  { clear: self =>
      IMap({})

  , map: (self, f) =>
     map(IfromJS(self), f)

  , mapKeys: (self, f) =>
      mapKeys(IfromJS(self), f)

  , mapEntries: (self, f) =>
      mapEntries(IfromJS(self), f)

  , filter: (self, f) =>
      filter(IfromJS(self), f)

  , some: (self, f) =>
      some(IfromJS(self), f)

  , every: (self, f) =>
      every(IfromJS(self), f)

  , reduce: (self, f, acc) =>
      (acc == null) ? foldl(IfromJS(self), f) : foldl(IfromJS(self), f, acc)

  , reduceRight: (self, f, acc) =>
      (acc == null) ? foldr(IfromJS(self), f) : foldr(IfromJS(self), f, acc)

  , merge: (self, other) =>
      merge(IfromJS(self), IfromJS(other))

  , mergeDeep: (self, other) =>
      mergeDeep(IfromJS(self), IfromJS(other))

  , keySeq: self =>
      keys(IfromJS(self))

  , valSeq: self =>
      vals(IfromJS(self))

  , get: (self, k, defaultValue) =>
      defaultValue == null ? get(IfromJS(self), k) : get(IfromJS(self), k, defaultValue)

  , getIn: (self, path, defaultValue) =>
      defaultValue == null ? getIn(IfromJS(self), path) : getIn(IfromJS(self), path, defaultValue)

  , set: (self, key, val) =>
      set(IfromJS(self), key, val)

  , setIn: (self, path, value) =>
      setIn(IfromJS(self), path, value)

  , update: (self, key, f) =>
      update(IfromJS(self), key, f)

  , updateIn: (self, path, f) =>
      updateIn(IfromJS(self), path, f)
  }

Array[ImmuneNS] =
  { clear: () =>
      IList()

  , map: (self, f) =>
      map(IfromJS(self), f)

  , mapKeys: (self, f) =>
      mapKeys(IfromJS(self), f)

  , mapEntries: (self, f) =>
      map(IfromJS(self), f)

  , concat: (self, other) =>
      concat(IfromJS(self), IfromJS(other))

  , keySeq: self =>
      keys(IfromJS(self))

  , valSeq: self =>
      vals(IfromJS(self))

  , get: (self, k, defaultValue) =>
      defaultValue == null ? get(IfromJS(self), k) : get(IfromJS(self), k, defaultValue)

  , getIn: (self, path, defaultValue) =>
      defaultValue == null ? getIn(IfromJS(self), path) : getIn(IfromJS(self), path, defaultValue)

  , set: (self, key, val) =>
      set(IfromJS(self), key, val)

  , setIn: (self, path, val) =>
      setIn(IfromJS(self), path, val)

  , update: (self, key, f) =>
      update(IfromJS(self), key, f)

  , updateIn: (self, path, f) =>
      updateIn(IfromJS(self), path, f)

  , ap: (self, x) =>
      andThen(IfromJS(self), y => map(y, x))

  , andThen: (self, f) =>
      foldl(map(IfromJS(self), f), (xs, ys) => xs.concat(ys), IList())
  }

/*
 * Maybe
 */

export const Maybe = Union('Maybe',
  { Just    : ['x']
  , Nothing : []
  }
)

Maybe.of = Maybe.prototype.of = function (x) { return Maybe.Just(x) }

export const maybe = x =>
  (x === null || x === void(0)) ? Maybe.Nothing() : Maybe.Just(x)

Maybe.prototype.map = function (f) {
  return match(this,
    { Just    : x  => maybe(f(x))
    , Nothing : () => this
    }
  )
}

Maybe.prototype.ap = function (m) {
  return match(this,
    { Just    : f  => m.map(f)
    , Nothing : () => this
    }
  )
}

Maybe.prototype.andThen = function (f) {
  return match(this,
    { Just    : x  => f(x)
    , Nothing : () => this
    }
  )
}

Maybe.prototype.toResult = function (err) {
  return match(this,
    { Just    : x  => Result.Ok(x)
    , Nothing : () => Result.Err(err)
    }
  )
}

/* Result
 *
 */

export const Result = Union('Result',
  { Ok  : ['val']
  , Err : ['err']
  }
)

Result.of = Result.prototype.of = function (x) { return Result.Ok(x) }

export const result = (val, err) =>
  (val === null || val === void(0)) ? Result.Err(err) : Result.Ok(val)

Result.prototype.map = function (f) {
  return match(this,
    { Ok  : val => Result.Ok(f(val))
    , Err : ___ => this
    }
  )
}

Result.prototype.mapError = function (f) {
  return match(this,
    { Ok  : ___ => this
    , Err : err => Result.Err(f(err))
    }
  )
}

Result.prototype.ap = function (r) {
  return match(this,
    { Ok   : f => r.map(f)
    , Err  : _ => this
    }
  )
}

Result.prototype.andThen = function (f) {
  return match(this,
    { Ok  : val => f(val)
    , Err : ___ => this
    }
  )
}

Result.prototype.toMaybe = function () {
  return match(this,
    { Ok  : val => Maybe.Just(val)
    , Err : ___ => Maybe.Nothing()
    }
  )
}

/* Task
 *
 */

export const Task = Type('Task', ['fork'])

Task.succeed = x => Task((_, succeed) => succeed(x))
Task.fail    = e => Task((fail, _)    => fail(e))
Task.none    = Task(() => {})

Task.of = Task.prototype.of = Task.succeed

Task.perform = (task, error, success) =>
  Task((_, succeed) =>
    task.fork(err => succeed(error(err)), val => succeed(success(val)))
  )

Task.prototype.map = function (f) {
  return this.andThen(x => Task.of(f(x)))
}

Task.prototype.ap = function (t) {
  return this.andThen(f => t.map(f))
  // return Task((fail, succeed) =>
  //   this.fork(fail, f => map(t, f).fork(fail, succeed))
  // )
}

Task.prototype.andThen = function (f) {
  return Task((fail, succeed) =>
    this.fork(fail, x => f(x).fork(fail, succeed))
  )
}

Task.fromPromise = p =>
  Task((fail, succeed) => p.then(succeed).catch(fail))

Task.toPromise = t =>
  new Promise((succeed, fail) => t.fork(fail, succeed))

Task.all = tasks =>
  Task.fromPromise(Promise.all(map(tasks, Task.toPromise)))

/* Generator
 *
 */

 export const Generator = (function* () {}).prototype.constructor

 Generator.prototype.map = function* (f) {
   for (let x of this)
     yield f(x)
 }

 Generator.prototype.filter = function* (f) {
   for (let x of this)
     if (f(x))
       yield x
 }

 Generator.prototype.take = function (n) {
   let ret = []

   let next = this.next();

   while (n-- > 1) {
     ret.push(next.value)
     if (next.done) break;
     next = this.next()
   }

   return ret
}

// Utils

export const identity   = x => x

export const map        = dispatch('map'         , { 1: { limit: 1 }})
export const mapKeys    = dispatch('mapKeys'     , { 1: { limit: 1 }})
export const mapEntries = dispatch('mapEntries'  , { 1: { limit: 1 }})
export const ap         = dispatch('ap'                              )
export const andThen    = dispatch('andThen'                         )
export const filter     = dispatch('filter'      , { 1: { limit: 1 }})
export const some       = dispatch('some'        , { 1: { limit: 1 }})
export const every      = dispatch('every'       , { 1: { limit: 1 }})
export const foldl      = dispatch('reduce'      , { 1: { limit: 2 }})
export const foldr      = dispatch('reduceRight' , { 1: { limit: 2 }})

export const empty      = dispatch('clear')
export const concat     = dispatch('concat')
export const join       = m => m::andThen(identity)
export const merge      = dispatch('merge')
export const mergeDeep  = dispatch('mergeDeep')
export const take       = dispatch('take')

export const keys       = dispatch('keySeq')
export const vals       = dispatch('valSeq')

export const fromJS     = IfromJS
export const toJS       = x => x != null && typeof(x.toJS) === "function" ? x.toJS() : x
export const asString   = x => x == null ? 'null' : x.toString()
export const log        = (...xs) => console.log(xs.map(toJS))

export const _get = dispatch('get')

export const get = (xs, k, defaultValue) => {
  const res = _get(xs, k, defaultValue)

  if (res == null)
    return Maybe.Nothing()
  else
    return defaultValue == null ? Maybe.Just(res) : res
}

export const _getIn = dispatch('getIn')

export const getIn = (xs, path, defaultValue) => {
  const res = _getIn(xs, path, defaultValue)

  if (res == null)
    return Maybe.Nothing()
  else
    return defaultValue == null ? Maybe.Just(res) : res
}

export const set   = dispatch('set')
export const setIn = dispatch('setIn')

export const update = (xs, key, f) =>
  dispatch('update')(xs, key, val => f(maybe(val)))

export const updateIn = (xs, path, f) =>
  dispatch('updateIn')(xs, path, val => f(maybe(val)))

export const evolve = (map, transformations) =>
  foldl(keys(map), (acc, k) => {
    let maybeTransformation = get(transformations, k)
    return match(maybeTransformation,
      { Just: transformation => {
          let type = typeof transformation

          return set(acc, k,
              type === 'function'
            ? transformation(get(map, k, undefined))
            : transformation.constructor === Object
            ? evolve(get(map, k, undefined), transformations[k])
            : transformation != null ? transformation : get(map, k, undefined))
        }
      , Nothing: () => acc
      }
    )
  }, IMap({}))


export const lift = (f, ...applicatives) => {
  switch (applicatives.length) {
    case 0  : return f()
    case 1  : return map(applicatives[0], curry(f, 1))
    default : return foldl(applicatives.slice(1), (acc, applicative) => ap(acc, applicative), map(applicatives[0], curry(f, applicatives.length)))
  }
}

export const withMeta = (f, meta) => {
  var keys = Object.keys(meta)

  keys.forEach(name =>
    Object.defineProperty(f, '__' + name, { value: meta[name] })
  )

  return f;
}

/*
* curry :: (a ... -> b) -> (a1 -> (a2 -> (aN -> b)))
*
* Given any fixed arity function it returns a new function that can be partially applied.
*
* Usage:
*
*   times    := curry(fun (a, b) -> a * b);
*   timesTwo := times(2);
*   mod2     := mod(__, 2); // __ can be used as a placeholder for partial application
*
*   times(2, 4) //=> 8
*   times(2)(4) //=> 8
*   timesTwo(4) //=> 8
*
*   mod2(2)     //=> 0
*   mod2(3)     //=> 1
*/
export const curry = function (f, n) {
  let arity = typeof (n) !== "undefined" ? n : (typeof(f.__arity) !== "undefined" ? f.__arity : f.length)
    , name  = f.name || f.__name

  if (arity < 2) return f

  const curriedFn = withMeta(function () {
    let args      = [].slice.call(arguments, 0, arity)
      , realArity = args.length
      , self      = this

    if (realArity >= arity)
      return f.apply(self, arguments)
    else {
      const g = withMeta(function () {
        let partialArgs = [].slice.call(arguments)
          , newArgs     = []

        for (let i = 0; i < args.length; i++)
          newArgs[i] = args[i]

        return curriedFn.apply(self, newArgs.concat(partialArgs))
      }, { name: name, arity : arity - realArity, curried: true })

      g.toString  = curriedFn.toString.bind(curriedFn)

      return g
    }
  }, { name: name, arity: arity, curried: true })

  curriedFn.toString = f.toString.bind(f)

  return curriedFn
}
