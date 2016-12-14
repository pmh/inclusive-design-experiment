import 'whatwg-fetch'

import
  { CALL
  } from './effects'


// -- ACTION CONSTANTS

const INIT = 'INIT'

// -- ACTION CREATORS

const init = payload => (
  { type: INIT, payload }
)

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

// -- REGISTER MODULE

export const registerModule = ({ init = state => [state, function * () {}] }) => {
  if (typeof importScripts === 'function') {
    onmessage = e => {
      let msg = JSON.parse(e.data)
      switch (msg.type) {
        case INIT: {
          let [state, effect] = init(fromJS(msg.payload))
          executeEffects(effect(state))
          postMessage
        }
      }
    }
  }
}

// -- START APP

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
    }

    worker.postMessage(JSON.stringify(init(views[path].data)))
    worker.onmessage = e =>
      console.log(e.data)
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

// function main(initState, element, {view, update}) {
//   const newVnode = view(initState, event => {
//     const newState = update(initState, event);
//     main(newState, newVnode, {view, update});
//   });
//   patch(oldVnode, newVnode);
// }
