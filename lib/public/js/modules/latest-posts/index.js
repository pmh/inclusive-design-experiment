import
  { listen
  } from '../../common/events'

import
  { call
  } from '../../common/effects'

import
  { registerModule
  } from '../../common/app'

// -- UTILS

const fetchData = url => Task((_, succeed) => (console.log(`fetching data from ${url}...`), setTimeout(() => succeed('fetch data complete'), 5000)))
const log       = x   => call(Task, (_, succeed) => (console.log(x), succeed(x)))
const get       = url => call(fetchData, url)

function* simulateRequest (state) {
  console.log('simulateRequest started')
  const x = yield get('/foo')
  yield log(x)
}

const t1 = Task((rej, res) => {
  console.log('t1 started')
  setTimeout(() => {
    console.log('t1 finnished')
    res('t1')
  }, 4000)
})
const t2 = Task((rej, res) => {
  console.log('t2 started')
  setTimeout(() => {
    console.log('t2 finnished')
    res('t2')
  }, 1000)
})
const t3 = Task((rej, res) => {
  console.log('t3 started')
  setTimeout(() => {
    console.log('t3 finnished')
    res('t3')
  }, 2000)
})

console.log(
  Task.all([t1, t2, t3]).fork(r => console.error('err:', r), s => console.log('succ:', s))
)

// // -- MSG
//
// const Msg = Union('Msg',
//   { Resize       : ['dimensions']
//   , Submit       : ['event']
//   , SubmitSucess : ['data']
//   , SubmitError  : ['error']
//   }
// )
//
// // -- INIT
//
const init = state =>
  [state, simulateRequest]
//
// // -- UPDATE
//
// const update = (state, msg) =>
//   msg::match(
//     { Resize        : dimensions => [evolve(state, { windowSize: { x: dimensions.x, y: dimensions.y } })/*, Effect.none */]
//     , Submit        : event      => [state/*, sendForm */]
//     , SubmitSuccess : data       => [evolve(state, { post: data })/*, Effect.none*/]
//     }
//   )
//
// // -- VIEW
//
// const view = (state, msg) =>
//   msg::match(
//     { Resize : function* (dimensions) {
//         // ...
//       }
//     , Submit : function* (event) {
//         const formButton = yield select('main > form [type="submit"]')
//         yield formButton::setAttribute('disabled', true)
//       }
//     , SubmitSuccess : function* (data) {
//         const form = yield select('main > form')
//         yield form::setStyle({ transform: 'scale(0, 0)' })
//       }
//     }
//   )
//

// -- SUBSCRIPTIONS

const subscriptions = () =>
  [ listen('core'        , 'init'        , Msg.Init )
  , listen('core'        , 'stateChange' , Msg.StateChange)
  , listen('core'        , 'routeChange' , Msg.RouteChange)
  , listen('window'      , 'resize'      , Msg.Resize , { throttle       : 300  })
  , listen('main > form' , 'submit'      , Msg.Submit , { preventDefault : true })
  ]

const subscriptionsP = () =>
  [ listen(['core' , 'init'                   ] , Msg.Init )
  , listen(['core' , 'stateChange'            ] , Msg.StateChange)
  , listen(['core' , 'routeChange'            ] , Msg.RouteChange)
  , listen(['dom'  , 'window'      , 'resize' ] , Msg.Resize , { throttle       : 300  })
  , listen(['dom'  , 'main > form' , 'submit' ] , Msg.Submit , { preventDefault : true })
  ]

// -- START

console.log('worker started')
registerModule({ init })
