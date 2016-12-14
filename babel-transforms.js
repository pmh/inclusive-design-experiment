require('babel-register')

var babelTemplate = require('babel-template')
// var x = require('./lib/public/js/lib/core.js')

var utils

utils =
  { ImmuneNS        : true
  , Type            : true
  , Union           : true
  , match           : true
  , constrainedArgs : true
  , dispatch        : true
  , List            : true
  , Map             : true
  , Set             : true
  , Maybe           : true
  , maybe           : true
  , Result          : true
  , result          : true
  , Task            : true
  , Generator       : true
  , identity        : true
  , map             : true
  , mapKeys         : true
  , mapEntries      : true
  , ap              : true
  , andThen         : true
  , filter          : true
  , some            : true
  , every           : true
  , foldl           : true
  , foldr           : true
  , empty           : true
  , concat          : true
  , join            : true
  , merge           : true
  , mergeDeep       : true
  , take            : true
  , keys            : true
  , vals            : true
  , get             : true
  , getIn           : true
  , set             : true
  , setIn           : true
  , update          : true
  , updateIn        : true
  , evolve          : true
  , lift            : true
  , curry           : true
  , fromJS          : true
  , toJS            : true
  , asString        : true
  , log             : true
  }


module.exports = function (babel) {
  var t = babel.types

  function curry (t, node, args, scope) {
    args = args.map(function (node) { return scope.generateUidIdentifierBasedOnNode(node) })

    var n = 0
    var newArgs = node.arguments.map(function (arg) {
      if (arg.name === '__')
        return args[n++]
      else
        return arg
    })

    return t.functionExpression(null, args, t.blockStatement([
      t.returnStatement(t.callExpression(node.callee, newArgs))
    ]))
  }

  return {
    visitor: {
      Program: {
        enter: (path, env) => {
          env.file.set('bind-imports', [])
        },

        exit: (path, env) => {
          if(env.file.get('bind-imports').length)
            path.node.body.unshift(
              t.importDeclaration(env.file.get('bind-imports').map(function(name) {
                return t.importSpecifier(t.identifier(name), t.identifier(name))
              }), t.stringLiteral(__dirname + '/lib/public/js/common/core'))
            )
        }
      },
      Identifier : (path, env) => {
        var node  = path.node
          , scope = path.scope

        if (!scope.hasBinding(node.name) && utils[node.name]) {
          env.file.set('bind-imports', env.file.get('bind-imports').concat(node.name))
        }
      },

      CallExpression: (path, env) => {
        var node  = path.node
          , scope = path.scope

        if (t.isBindExpression(node.callee))
          path.replaceWith(t.callExpression(node.callee.callee, [node.callee.object].concat(node.arguments || [])))

        var args;

        if ((args = path.node.arguments.filter(function (arg) { return arg.name === '__' })).length)
          path.replaceWith(curry(t, path.node, args, path.scope))
      },

      BindExpression: (path, env) => {
        if(path.node.object.name === '__') {
          var uuid = path.scope.generateUidIdentifierBasedOnNode(path.node.object)
            , rest = path.scope.generateUidIdentifierBasedOnNode(t.identifier('rest'))

          path.replaceWith(
            t.functionExpression(t.identifier('__' + path.node.callee.name), [uuid, t.restElement(rest)], t.blockStatement([
              t.returnStatement(t.callExpression(path.node.callee, [uuid, t.spreadElement(rest)]))
            ]))
          )
        }
      },
    }
  }
}
