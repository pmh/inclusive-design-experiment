const { readFileSync } = require('fs')

const db = require('./db.js')

const { server, GET } = require('./utils')

const slice = (o, from, to) =>
  Object.keys(o).slice(from, to)

const buildBody = (db, posts, transformer) =>
  posts.map(id => Object.assign({}, db[id], transformer(db[id])))

const monthName = month =>
  [ "January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"][month]

const dateToString = date =>
  `${monthName(date.getMonth())} ${date.getDay()}, ${date.getFullYear()}`

server({ host: '0.0.0.0', port: 8000 },

  GET
    ( { path: ['/', '/posts/latest'], template: 'latest-posts' }
    , (request, done) => done(
        { posts: buildBody(db, slice(db, 0, 4), post => ({ body: post.body[0], dateString: dateToString(new Date(post.date)) }))}
      )
    ),

  GET
    ( { path: '/posts/{id}', template: 'view-post' }
    , (request, done) => done(db[request.params.id])
    ),

  GET
    ( { path: '/posts/archive', template: 'archive' }
    , (request, done) => done({ title: 'Archive!' })
    )

)
