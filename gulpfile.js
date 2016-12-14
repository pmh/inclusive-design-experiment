const gulp            = require('gulp')
const watch           = require('gulp-watch')
const concat          = require('gulp-concat')
const cssmin          = require('gulp-cssmin')
const htmlmin         = require('gulp-htmlmin')
const nodemon         = require('gulp-nodemon')
const browserSync     = require('browser-sync').create()
const identity        = require('gulp-identity')
const bg              = require('gulp-bg')

const nodeEnv         = process.env.NODE_ENV || 'development'
const isProd          = nodeEnv === 'production'

// -- CONSTANTS

const SERVER_PATH      = 'lib/server/**/*.js'
const TEMPLATE_PATH    = 'lib/templates/**/*.html'
const JS_BASE_PATH     = 'lib/public/js/'
const JS_PATH          = `${JS_BASE_PATH}**/*.js`
const JS_MODULES_PATH  = `${JS_BASE_PATH}modules/*/index.js`
const CSS_PATH         = 'lib/public/css/**/*.css'
const CSS_COMMON_PATH  = 'lib/public/css/common/**/*.css'
const CSS_MODULES_PATH = 'lib/public/css/modules/**/*.css'
const IMG_PATH         = 'lib/public/img/**/*.*'

const PUBLIC_DEST     = 'dist'
const CSS_DEST        = `${PUBLIC_DEST}/css`
const IMG_DEST        = `${PUBLIC_DEST}/img`
const JS_MODULES_DEST = `${PUBLIC_DEST}/js/modules/`
const TEMPLATES_DEST  = `${PUBLIC_DEST}/templates`

// -- IMG

gulp.task('move:img', () => {
  return gulp.src(IMG_PATH).pipe(gulp.dest(IMG_DEST))
})

gulp.task('watch:img', ['move:img'], () => {
  return watch(IMG_PATH).on("change", () => gulp.start("move:img"))
})

// -- CSS

gulp.task('compile:css-common', () => {
  return gulp.src(CSS_COMMON_PATH).pipe(isProd ? cssmin() : identity()).pipe(gulp.dest(CSS_DEST))
})

gulp.task('compile:css-modules', () => {
  return gulp.src(CSS_MODULES_PATH).pipe(concat('modules.css')).pipe(isProd ? cssmin() : identity()).pipe(gulp.dest(CSS_DEST))
})

gulp.task('compile:css', ['compile:css-common', 'compile:css-modules'])

gulp.task('watch:css', ['compile:css'], () => {
  return watch(CSS_PATH).on("change", () => gulp.start("compile:css"))
})

gulp.task( "run:webpack" , bg("webpack", "--watch"))
gulp.task( "compile:js"  , bg("webpack"           ))

// -- TEMPLATES

gulp.task('compile:templates', () => {
  const doubleWrapOpen   = /\{\{\s*[^}]+\s*\}\}/
  const doubleWrapClose  = /\{\{\/\s*[^}]+\s*\}\}/
  const doubleWrapPair   = [doubleWrapOpen, doubleWrapClose]

  const trippleWrapOpen  = /\{\{\{\s*[^}]+\s*\}\}\}/
  const trippleWrapClose = /\{\{\{\/\s*[^}]+\s*\}\}\}/
  const trippleWrapPair  = [trippleWrapOpen, trippleWrapClose]

  return gulp.src(TEMPLATE_PATH).pipe(htmlmin({collapseWhitespace: false, customAttrSurround: [trippleWrapPair, doubleWrapPair] })).pipe(gulp.dest(TEMPLATES_DEST))
})

gulp.task('watch:templates', ['compile:templates'], () => {
  return watch(TEMPLATE_PATH).on("change", () => gulp.start("compile:templates"))
})

// -- browserSync

gulp.task('sync:dist', () => {
  return watch('dist/**/*.*').on("change", browserSync.reload)
})

// -- SERVER

gulp.task('run:server', done => {
  const stream = nodemon(
    { script : './index.js'
    , ext    : 'js'
    , ignore : ['dist/', 'lib/public', 'lib/templates']
    }
  )
  let isBrowserSyncRunning = false
  stream
    .on('start', () => {
      if (!isBrowserSyncRunning) {
        setTimeout(() => browserSync.init({ port: 8080, proxy: "0.0.0.0:8000" }), 1000)
        isBrowserSyncRunning = true
      } else {
        setTimeout(browserSync.reload, 1000)
      }
    })
    .on('crash', () => {
      console.error('Application has crashed!\n\nRestarting...\n')
      stream.emit('restart', 10)
    })

})

// -- API

gulp.task( 'start:dev' , ['run:server', 'run:webpack', 'sync:dist', 'watch:css', 'watch:templates', 'watch:img'] )
gulp.task( 'build'     , ['compile:css', 'compile:js', 'move:img'])
gulp.task( 'default'   , ['start:dev'])
