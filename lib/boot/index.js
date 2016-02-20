/**
 * boot
 *
 * Configure express as a webserver, generate
 * assets and other bootstrapping tasks
 */

/**
 * Imports
 */

 /**
  * Logging service
  */

var config = require('lib/config')
var debug = require('debug')('weo:boot')
require('weo-logger')(config.appName)

Error.stackTraceLimit = 40
var err = new Error()
debug('booting: ' + err.stack)


var path = require('path')
var express = require('express')
var cors = require('cors')
var compression = require('compression')
var bodyParser = require('body-parser')
var injectLatency = require('lib/inject-latency')
var currentVersion = require('express-current-version')
var morgan = require('morgan')
var robots = require('express-robots')

require('es6-promise').polyfill()

/**
 * Browserify client assets
 */

require('lib/client-models')()
require('lib/router.io-client')()


var app = module.exports = express()

/**
 * Express middleware
 */

debug('configuring express...')

/**
 * Enable CORS
 */

app.use(cors({
  origin: '*',
  // Add patch method to the defaults supported by the cors middleware
  methods: 'GET,HEAD,PUT,POST,DELETE,PATCH'
}))

/**
 * Parse body
 * Note: for some reason this gets real unhappy if it comes after
 * the latency middleware.  It just starts dropping requests at random.
 * Not sure what that's about, but let's not do it.
 */

app.use(bodyParser({
  limit: 1024 * 1024 * 10 //10mb
}))

/**
 * Allow latency injection for tests
 */

// app.use(injectLatency.always)
if (app.get('env') === 'development' || app.get('env') === 'ci') {
  app.use(injectLatency.byParam)
}

/**
 * robots.txt
 */

app.use(robots({UserAgent: '*'}))

/**
 * API Version
 *
 * Goes above logging so that our logs don't get spammed
 */

app.get('/version', currentVersion)

/**
 * Logging
 */

if (app.get('env') !== 'ci') {
  app.use(morgan('tiny'))
}

/**
 * Gzip
 */

app.use(compression())

/**
 * Disable browser caching
 */

app.use(require('lib/no-cache'))

/**
 * Initialize and connect to the database
 */

require('lib/db')

/**
 * Load main application
 */

app.use(require('lib/main'))

/**
 * Static files from public folder
 */

app.use(express.static(path.join(process.cwd(), 'public')))

// Needed for fastly caching
app.use('/assets', function(req, res, next) {
  res.header('Surrogate-Control', 'max-age=2592000')
  next()
})

app.use('/assets', express.static(path.join(process.cwd(), 'assets')))

/**
 * Error handling
 */

app.use(require('lib/error-logger')({stack: true}))
app.use(require('lib/error-handler')())

/**
 * Listen
 */

var server = app.listen(config.port, function() {
  debug('listening on %d', config.port)
  app.emit('up', app, server)
})
app.emit('listen', app, server)

/**
 * Debugging
 */

require('debug-trace')({always: true})
