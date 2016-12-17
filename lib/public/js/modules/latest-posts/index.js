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

const log = (...args) =>
  Task((fail, succeed) => {
    console.log(...args)
    succeed()
  })

function* logAction (state) {
  yield call(log, state::toJS())
}

// -- MSG

const Msg = Union('Msg',
  { Init         : [ 'state'           ]
  , Resize       : [ 'width' , 'height']
  , PostClick    : [ 'event'           ]
  }
)

// -- INIT

const init = state =>
  [state, logAction]

// -- UPDATE

const update = (state, msg) =>
  msg::match(
    { Init          : state  => [{ action: 'Init'          }, logAction]
    , Resize        : (w, h) => [{ action: 'Resize', w, h  }, logAction]
    , PostClick     : event  => [{ action: 'Click' , event }, logAction]
    }
  )

// -- VIEW

const view = (state, msg) =>
  msg::match(
    { Init   : function* () {
        const _debugger = yield document.body::createElement('div.debugger')
        yield document.body::appendChild(_debugger)
      }
    , Resize : function* (w, h) {
        const _debugger = yield querySelector('div.debugger')
        yield _debugger::set('innerHTML', `${w}x${h}`)
      }
    }
  )

// -- SUBSCRIPTIONS

const subscriptions =
  [ listen( [ 'init'                            ], Msg.Init                          )
  , listen( [ 'window'               , 'resize' ], Msg.Resize    , { debounce: 300 } )
  , listen( [ 'ul.latest-posts > li' , 'click'  ], Msg.PostClick                     )
  ]

// -- START

registerModule({ init, update, subscriptions })
