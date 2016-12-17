import 'whatwg-fetch'

import
  { CALL
  } from './effects'

import
  { throttle
  , debounce
  } from './events'

// -- GLOBAL STATE STORE

let state = IMap()

// -- ACTION CONSTANTS

const INIT              = 'INIT'
const REGISTER_HANDLERS = 'REGISTER_HANDLERS'
const DISPATCH          = 'DISPATCH'

// -- ACTION CREATORS

const init = payload => (
  { type: INIT, payload }
)

const registerHandlers = payload => (
  { type: REGISTER_HANDLERS, payload }
)

const dispatch = (type, args = []) => (
  { type: DISPATCH, payload: { type, args } }
)

// -- WRITE/READ

const write = (data, worker) => {
  data = JSON.stringify(data)

  worker ? worker.postMessage(data) : postMessage(data)
}

const read = data =>
  JSON.parse(data)

// -- EFFECT INTERPRETER

const interpretEffect = effect => {
  switch (effect.type) {
    case CALL:
      return effect.fn(...effect.args)
  }
}

// -- EFFECT EXECUTOR

const executeEffects = (effectGen, currentEffect = effectGen.next()) => {
  if (currentEffect.done) return

  let ret = interpretEffect(currentEffect.value)

  if (ret instanceof Task)
    ret.fork(
      err => executeEffects(effectGen, effectGen.throw (err)),
      res => executeEffects(effectGen, effectGen.next  (res))
    )
  else
    executeEffects(effectGen, effectGen.next(res))
}

// -- SUBSCRIPTION STORE

const populateSubscriptionStore = (store, subs) => {
  subs.reduce((acc, { event: [ selector, eventType ], msg, opts }) => {
    if (!eventType) {
      eventType = selector
      selector  = void(0)
    }

    if (!acc[eventType])
      acc[eventType] = []

    acc[eventType] = acc[eventType].concat({ selector, msg, opts })

    return acc
  }, store)
}

// -- REGISTER MODULE

export const registerModule = ({ init = state => [state, function * () {}], update = () => {}, subscriptions = [] }) => {
  if (typeof importScripts === 'function') {
    let subscriptionStore = {}

    onmessage = e => {
      let workerMsg = read(e.data)
      switch (workerMsg.type) {
        case INIT: {
          state = fromJS(workerMsg.payload)

          if (Object.keys(subscriptionStore).length === 0) {
            populateSubscriptionStore(subscriptionStore, subscriptions)
            write(registerHandlers(subscriptions.map(({ event, opts }) => ({ event, opts }))))
          }

          let [newState, effect] = init(state)
          state = newState
          executeEffects(effect(state))

          return
        }

        case DISPATCH:
          let handlers = subscriptionStore[workerMsg.payload.type]
          if (handlers)
            handlers.forEach(({ selector, msg, opts }) => {
              let [newState, effect] = update(state, msg(...workerMsg.payload.args))
              state = newState
              executeEffects(effect(state))
            })
      }
    }
  }
}

// -- START APP

const eventTransformers =
  { resize : evt => [evt.target.innerWidth, evt.target.innerHeight]
  , click  : evt => [evt]
  }

const eventInterceptors =
  { throttle       : ( handler, wait    ) => throttle(handler, wait)
  , debounce       : ( handler, wait    ) => debounce(handler, wait)
  , preventDefault : ( handler, prevent ) => evt => (console.log('preventDefault'), evt.preventDefault(), handler(evt))
  , log            : ( handler, msg     ) => evt => (console.log(msg + ':', evt), handler(evt))
  }

const bindEventListeners = (worker, listeners) => {
  let domHandlers = {}

  const createHandlerFn = (eventType, opts) => {
    let handler = event => write(dispatch(eventType, eventTransformers[eventType](event)), worker)

    handler = Object.keys(opts).reduce((acc, key) =>
      eventInterceptors[key] ? eventInterceptors[key](acc, opts[key]) : acc
    , handler)

    return handler
  }

  listeners.forEach(({ event: [selector, eventType], opts = {} }) => {
    if (!eventType) {
      eventType = selector
      selector  = void(0)
    }
    if (eventType === 'init')
      write(dispatch(eventType, state), worker)
    else {
      if (!eventTransformers[eventType])
        throw new Error('Couldn\'t find any event transformer for event ' + eventType)

      const handler = createHandlerFn(eventType, opts)

      switch (selector) {
        case 'window':
          window.addEventListener(eventType, handler)
          break
        case 'document':
          document.addEventListener(eventType, handler)
          break
        default:
          domHandlers[eventType] = domHandlers[eventType] || []
          domHandlers[eventType] = domHandlers[eventType].concat({ selector, opts })
          break
      }
    }
  })

  let domHandlerKeys = Object.keys(domHandlers)

  if (domHandlerKeys.length)
    domHandlerKeys.forEach(type => {
      let handlers = domHandlers[type]

      document.addEventListener(type, evt => {
        handlers.forEach(spec => {
          if (evt.target && evt.target.matches(spec.selector))
            createHandlerFn(type, handlers.opts || {})(evt)
        })
      })
    })
}

export const startApp = ({ modules, history }) => {

  const isLocalLink = a => {
    if (!a) return false
    return (a instanceof HTMLAnchorElement && a.hash === "" && !a.outerHTML.match(/href\=(\'|\"|\`)http/)) ? a : isLocalLink(a.parentNode)
  }

  const main  = document.querySelector('main')
  const views = {}

  const renderView = (view, options) => {
    const path = history.location.pathname

    if ( options.updateMain )
      main.innerHTML = view.view

    views[path] = views[path] || view

    if (!modules[views[path].template])
      return

    let worker = views[path].worker

    if (!worker) {
      let Worker = modules[views[path].template]()
      worker = views[path].worker = new Worker()
      write(init(views[path].data), worker)
    }

    worker.onmessage = e => {
      const msg = read(e.data)

      switch (msg.type) {
        case REGISTER_HANDLERS:
          bindEventListeners(worker, msg.payload)
          break
      }
    }
  }

  const loadView = (url, options = { updateMain: true }) => {
    if (views[url])
      return renderView(views[url], options)

    fetch(url)
      .then  (res  => res.json())
      .then  (renderView(__, options))
      .catch ((  ) => main.innerHTML = "There was an error loading the url")
  }

  loadView(history.location.pathname + '?__fragment__=true', { updateMain: false })

  document.body.addEventListener("click", e => {
    let a = isLocalLink(e.target)
    if (a) {
      e.preventDefault()

      const path = a.pathname
      history.push(path)

      const url = path + '?' + ['__fragment__=true'].concat(a.href.split('?')[1]).join('&')

      loadView(url)
    }
  })

  history.listen((location, action) => {
    loadView(location.pathname + '?__fragment__=true')
  })
}
