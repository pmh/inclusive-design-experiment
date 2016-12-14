const handlebars = require('handlebars')

// INIT

function server ({ port, host, plugins = [] }, ...routes) {
  const Hapi       = require('hapi')
  const path       = require('path')

  const server = new Hapi.Server()
  server.connection({ port, host })

  // STATIC

  server.register([require('inert')].concat(plugins), err => {
    if (err)
      console.error(err)

    server.route(
      { method  : 'GET'
      , path    : '/public/{asset*}'
      , handler : (request, reply) => reply.file(`./dist/${request.params.asset}`)
      }
    )

    server.route(
      { method  : 'GET'
      , path    : '/favicon.ico'
      , handler : (reques, reply) => reply.file('./favicon.ico')
      }
    )
  })

  // VIEWS

  server.register(require('vision'), err => {
    if (err)
      console.error(err)

    server.views(
      { engines     : { html : require('handlebars') }
      , path        : path.join(__dirname, '/../../dist/templates/views')
      , layout      : true
      , layoutPath  : path.join(__dirname, '/../../dist/templates/layout')
      , isCached    : false
      , context     : { lang: 'en', dir: 'ltr', publicPath: '/public' }
      }
    )

    routes.forEach(route => route(server))
  })

  // START

  server.start((err) => {
    if (err)
      throw err

    console.log(`Server running at: ${server.info.uri}`)
  })
}

const GET = ({ path, template }, handler) => server => {
  path = Array.isArray(path) ? path : [path]

  const serve = path =>
    server.route(
      { method: 'GET'
      , path
      , handler: (request, reply) => {
          handler(request, json => {
            if (request.query.__fragment__) {
              const view  = require('fs').readFileSync(__dirname + '/../../dist/templates/views/' + template + '.html', 'UTF8')
              reply(
                { data     : json
                , view     : handlebars.compile(view)(json)
                , template : template
                }
              )
            }

            else if (request.headers['content-type'] === "json")
              reply(json)

            else
              reply.view(template, json, { layout: true })
          })
        }
      }
    )

  path.forEach(serve)
}

module.exports = { server, GET }
