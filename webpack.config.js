const webpack           = require('webpack')
const path              = require('path')
const nodeEnv           = process.env.NODE_ENV || 'development'
const isProd            = nodeEnv === 'production'

module.exports =
{ devtool : isProd ? 'hidden-source-map' : 'eval-source-map'
, context : path.join(__dirname)
, entry   :
    { main     : './lib/public/js/modules/main/index.js'
    , common   : ['./lib/public/js/common/core.js']
    }
, output:
    { path       : path.join(__dirname, './dist/js')
    , publicPath : '/public/js/'
    , filename   : '[name].js'
    }
, module:
    { loaders:
        [ { test    : /\.(js|jsx)$/
          , exclude : /node_modules/
          , loaders : 'babel-loader'
          }
        ]
    }
, resolve :
    { extensions : ['.js']
    , modules    :
        [ path.resolve('./js')
        , 'node_modules'
        ]
    }
, plugins:
    [ new webpack.optimize.CommonsChunkPlugin({ name: 'common' })
    , new webpack.LoaderOptionsPlugin(
        { options:
            { worker:
                { output:
                    { filename      : 'activity.js'
                    , chunkFilename : "[id].activity.js"
                    }
                }
            }
        }
      ),
    // , new webpack.DefinePlugin(
    //     { 'process.env': { NODE_ENV: JSON.stringify(nodeEnv) }
    //     }
    //   )
    ].concat(
      isProd ? [new webpack.optimize.UglifyJsPlugin({ compress : { warnings : false }, output : { comments : false }, sourceMap : false })]
             : []
    )
, devServer :
    { contentBase: '.'
    }
}
