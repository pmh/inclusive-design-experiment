import
  { startApp
  } from '../../common/app'

import createHistory from 'history/createBrowserHistory'


startApp(
  { modules:
      { "latest-posts": () => require("worker-loader!../latest-posts")
      }
  , history: createHistory()
  }
)
