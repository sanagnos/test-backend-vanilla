/// ===========================================================================
/// lib/io.js
/// ===========================================================================
/// Copyright (c) 2017, Stelios Anagnostopoulos <stelios@outlook.com>
/// All rights reserved
/// ===========================================================================

'use strict'

/// imports
/// ===========================================================================

var path  = require('path')
var fs    = require('fs')
var http  = require('http')
var https = require('https')
var url   = require('url')

/// cache
/// ===========================================================================

// route registries
var postRegistry   = []
var getRegistry    = []
var putRegistry    = []
var patchRegistry  = []
var deleteRegistry = []

// options
var staticDir   = ''   // static directory with files that can be served
var templateDir = ''   // template directory where templates are located
var renderFile  = null // template rendering procedure, eg. pug.renderFile

// server
var server = null

/// routing
/// ===========================================================================

/**
 * Registers POST request.
 * @param  {String}   route
 * @param  {Function} taskN
 */
function post (route, taskN) {
  register(postRegistry, route, Array.prototype.slice.call(arguments, 1))
}

/**
 * Registers GET request.
 * @param  {String}   route
 * @param  {Function} taskN
 */
function get (route, taskN) {
  register(getRegistry, route, Array.prototype.slice.call(arguments, 1))
}

/**
 * Registers PUT request.
 * @param  {String}   route
 * @param  {Function} taskN
 */
function put (route, taskN) {
  register(putRegistry, route, Array.prototype.slice.call(arguments, 1))
}

/**
 * Registers PATCH request.
 * @param  {String}   route
 * @param  {Function} taskN
 */
function patch (route, taskN) {
  register(patchRegistry, route, Array.prototype.slice.call(arguments, 1))
}

/**
 * Registers DELETE request.
 * @param  {String}   route
 * @param  {Function} taskN
 */
function delete_ (route, taskN) {
  register(deleteRegistry, route, Array.prototype.slice.call(arguments, 1))
}

/**
 * Registers a route, mapping it to one or more tasks executed upon a request.
 * @param  {Array}  registry
 * @param  {String} route
 * @param  {Array}  tasks
 */
function register (registry, route, tasks) {
  registry.push([
    new RegExp('^' + route.replace(/:\w+/g, '\\w+') + '($|(\/$))'),
    route.match(/(:\w+)|(\w+)/g),
    handle
  ])
  function handle (req, res) {
    var f = tasks
    var l = tasks.length
    var i = 0
    iter()
    function iter () { f[i++](req, res, next) }
    function next () { i < l && iter() }
  }
}

/// Request
/// ===========================================================================

/**
 * Request class declaration.
 * @type {Response}
 */
class Request {

  constructor (req, param, query, body) {
    this.req         = req
    this.param       = param
    this.query       = query
    this.body        = body
    this.cookieCache = null
  }

  get cookie () {
    if (this.cookieCache) return this.cookieCache
    var out = {}
    var str = this.req.headers.cookie
    if (str) {
      var arr = str.split(';')
      for (let val = '', i = 0, l = arr.length; i < l; ++i) {
        val = arr[i].split('=')
        out[val.shift().trim()] = unescape(decodeURI(val.join('=')))
      }
    }
    this.cookieCache = out
    return out
  }
}

/// Response
/// ===========================================================================

/**
 * Response class declaration.
 * @type {Response}
 */
class Response {

  constructor (res) {
    this.res = res
    this.ctx = {}
  }

  set cookie (v) { this.res.setHeader('Set-Cookie', v) }

  redirect (url) {
    this.res.statusCode = 302
    this.res.setHeader('Location', url)
    this.res.end()
  }

  send (code, data) {
    this.res.statusCode = code
    if (!data) {
      this.res.setHeader('Content-Type', 'text/plain')
      this.res.end()
    } else if (
      data.constructor === String ||
      data.constructor === Number ||
      data.constructor === Boolean
    ) {
      this.res.setHeader('Content-Type', 'text/plain')
      this.res.end('' + data)
    } else {
      this.res.setHeader('Content-Type', 'application/json')
      this.res.end(JSON.stringify(data))
    }
  }

  sendFile (file) {
    this.res.statusCode = 200
    switch ((file.match(/\.(htm|html|js|jpg|jpeg|txt|css|ico|png|gif)$/) || {})[1]) {
      case 'js' : this.res.setHeader('Content-Type', 'text/javascript');          break;
      case 'css': this.res.setHeader('Content-Type', 'text/css');                 break;
      case 'ico': this.res.setHeader('Content-Type', 'image/x-icon');             break;
      case 'png': this.res.setHeader('Content-Type', 'image/png');                break;
      case 'gif': this.res.setHeader('Content-Type', 'image/gif');                break;
      case 'jpeg': case 'jpg':  this.res.setHeader('Content-Type', 'image/jpeg'); break;
      case 'htm':  case 'html': this.res.setHeader('Content-Type', 'text/html');  break;
      default: this.res.setHeader('Content-Type', 'text/plain');                  break;
    }
    fs.createReadStream(path.join(staticDir, file)).pipe(this.res)
  }

  render (file, data) {
    if (!renderFile) throw new Error('Missing template renderer.')
    if (!data) data = this.ctx
    this.res.statusCode = 200
    this.res.setHeader('Content-Type', 'text/html')
    this.res.end(renderFile(path.join(templateDir, file), data))
  }
}

/// server
/// ===========================================================================

/**
 * Starts listening for connections.
 * @param  {Object}   config
 * @param  {Function} cb
 */
function start (config, cb) {
  if (config && !cb && typeof config === 'function') {
    cb     = config
    config = {}
  } else if (!arguments.length) {
    cb     = function (err) { if (err) throw err }
    config = {}
  } else if (!cb) {
    cb = function (err) { if (err) throw err }
  }
  server =
    (!config.pkeyFile || !config.pkeyFile.length || !config.certFile || !config.certFile.length) ?
      http.createServer() :
      https.createServer({
        key : fs.readFileSync(config.pkeyFile),
        cert: fs.readFileSync(config.certFile)
      })
  server.on('request', onRequest)
  server.listen(config.port || 80, cb)
}

/**
 * Close server.
 * @param  {Function} cb
 */
function close (cb) {
  server.close(cb)
}

/**
 * Handle incoming request.
 * @param  {Object} req
 * @param  {Object} res
 */
function onRequest (req, res) {
  var method    = req.method
  var parsedURL = url.parse(req.url, true)
  var route     = parsedURL.pathname
  var parts     = route.match(/\w+/g)
  var registry  = null
  switch (method) {
    case 'POST'  : registry = postRegistry;   break;
    case 'GET'   : registry = getRegistry;    break;
    case 'PATCH' : registry = patchRegistry;  break;
    case 'PUT'   : registry = putRegistry;    break;
    case 'DELETE': registry = deleteRegistry; break;
    default: break;
  }

  // identify registered route entry
  var entry
  for (
    let e = registry[0], i = 0, il = registry.length;
    i < il;
    e = registry[++i]
  )
    if (e[0].test(route)) {
      entry = e
      break
    }

  // identify request handle and/or any parameters
  var handle
  var param
  if (entry) {
    handle = entry[2]
    param  = {}
    if (entry[1])
      for (let entryParts, j = 0, jl = entry[1].length; j < jl; ++j) {
        entryParts = entry[1]
        if (entryParts[j][0] === ':')
          param[entryParts[j].slice(1)] = parts[j]
      }
  }

  if (!handle) {

    // if no registered route entry found, check if request can be mapped to
    // static file to serve, otherwise send 404
    if (!/[\/|\\]$/.test(route)) {
      var file = path.join(staticDir, route)
      fs.exists(file, function (exists) {
        if (exists === false) {
          res.writeHead(404, { 'Content-Type': 'text/plain' })
          res.end('Not found')
        } else {
          res.statusCode = 200
          switch ((file.match(/\.(htm|html|js|jpg|jpeg|txt|css|ico|png|gif)$/) || {})[1]) {
            case 'js' : res.setHeader('Content-Type', 'text/javascript'); break;
            case 'css': res.setHeader('Content-Type', 'text/css'); break;
            case 'ico': res.setHeader('Content-Type', 'image/x-icon'); break;
            case 'png': res.setHeader('Content-Type', 'image/png'); break;
            case 'gif': res.setHeader('Content-Type', 'image/gif'); break;
            case 'jpeg': case 'jpg':  res.setHeader('Content-Type', 'image/jpeg'); break;
            case 'htm':  case 'html': res.setHeader('Content-Type', 'text/html'); break;
            default: res.setHeader('Content-Type', 'text/plain'); break;
          }
          fs.createReadStream(file).pipe(res)
        }
      })
    } else {
      res.writeHead(404, { 'Content-Type': 'text/plain' })
      res.end('Not found')
    }
  } else {

    // process request and call identified handle
    var data = ''
    req.on('data', function (chunk) { data += chunk.toString() })
    req.on('end', function () {
      var body = {}
      if (data) {
        if (data[0] === '{')
          body = JSON.parse(data)
        else
          for (let
            bodyCache = body, temp, list = data.split('&'),
            i = 0, l = list.length; i < l; ++i
          ) {
            temp = list[i].split('=')
            bodyCache[temp.shift().trim()] =
              unescape(decodeURI(temp.join('='))).replace(/\+/g, ' ')
          }
      }
      handle(new Request(req, param, parsedURL.query, body), new Response(res))
    })
  }
}

/// exports
/// ===========================================================================

module.exports = {
  start : start,
  close : close,
  post  : post,
  get   : get,
  put   : put,
  patch : patch,
  delete: delete_,
  set renderFile (fn) { renderFile = fn },
  set staticDir (dir) { staticDir = dir },
  set templateDir (dir) { templateDir = dir }
}
