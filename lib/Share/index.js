/**
 * Imports
 */

var express = require('express')
var actions = require('./actions')
var model = require('./model')
var middleware = require('./middleware')
var lookup = require('lib/lookup')
var auth = require('lib/Auth')
var user = require('lib/User')
var pageToken = require('lib/page-token')
var lock = require('lib/lock')
var notify = require('lib/notify')

/**
 * Vars
 */

var app = express()
var Share = model

app.actions = actions
app.model = model
app.middleware = middleware

/**
 * System Shares
 */

require('./Profile')

/**
 * @api {get} /share/
 *
 * Retrieve a feed of shares
 */

app.get('/'
  , user.middleware.me({no404: true})
  , pageToken()
  , actions.to)

app.get('/feed'
  , user.middleware.me()
  , pageToken()
  , actions.feed)

/**
 * Admin Feed
 */

 app.get('/admin'
   , user.middleware.me()
   , user.middleware.isAdmin
   , pageToken()
   , actions.admin)

/**
 * @api {get} /share/:id Get share
 * @apiName GetShare
 * @apiGroup Share
 *
 * @apiParam {String} id unique id of the share
 */

app.get('/:id'
  , user.middleware.me()
  , lookup(Share)
  , middleware.canView()
  , actions.get)

/**
 * Middleware
 */

app.use(auth.middleware.isAuthenticated)

/**
 * API
 */

/**
 * @api {get} /share/:id/members Get list of associated students
 * @apiName GetMembers
 * @apiGroup Share
 *
 * @apiParam {String} id unique id of the share to be published
 * @apiParam {[String]} context List of contexts ids (a single context may also be passed)
 * @apiDescription Retrieve the list of students who have access to this
 * share in the contexts specified by `context`
 */

app.get('/:id/members'
  , lookup(Share)
  , actions.getMembers)

/**
 * @api {get} /share/:id/contexts Get list of contexts
 * @apiName GetContexts
 * @apiGroup Share
 *
 * @apiParam {String} id unique id of the share
 * @apiDescription Retrieve the list of contexts this share
 * has been sent to, intersected with the list of contexts
 * that the requesting user belongs to.
 */

app.get('/:id/contexts'
  , user.middleware.me()
  , lookup(Share)
  , actions.getContexts)

/**
 * @api {get} /share/:id/:userId Retrieve a particular user's share instance
 * @apiName GetShareInstance
 * @apiGroup Share
 *
 * @apiParam {String} id unique id of the share
 * @apiParam {String} [userId=currentUser] unique id of the user who's share instance you want
 * @apiParam {String} [context] context id the share instance is for
 * @apiDescription Retrieve a particular user's instance of the share
 * specified by `id`.  Normally you can leave out `context` because only
 * rarely will a user have multiple instances of the same share in different
 * contexts (you can ascertain this by looking at the context list on the root
 * share, or hitting the `/share/:id/contexts` endpoint).
 */

app.get('/:id/instance/:userId'
  , lookup(Share)
  , user.middleware.me()
  , lookup(user.model, {key: 'id', param: 'userId', prop: 'user'})
  , middleware.getInstance()
  , actions.get)

/**
 * Pin/assign/publish
 */

app.put('/:id/published'
  , lookup(Share)
  , middleware.canEdit(Share)
  , actions.publish)

app.put('/:id/unpublished'
  , lookup(Share)
  , middleware.canEdit(Share)
  , actions.unpublish)

app.put('/:id/assign'
  , lookup(Share)
  , middleware.canEdit(Share)
  , user.middleware.me()
  , middleware.updateForked('assignCount', 1)
  , actions.sendTo('class'))

app.put('/:id/pin'
  , lookup(Share)
  , middleware.canEdit(Share)
  , user.middleware.me()
  , middleware.updateForked('repinCount', 1)
  , notify('pinned_activity')
  , actions.sendTo('board'))

/**
 * Like/unlike
 */

app.put('/:id/like'
  , lookup(Share)
  , user.middleware.me()
  , notify('liked_activity')
  , actions.like)

app.put('/:id/unlike'
  , lookup(Share)
  , user.middleware.me()
  , actions.unlike)

/**
 * @api {post} /share
 *
 * Create a new share
 */

app.post('/'
  , user.middleware.me()
  , middleware.authActor
  , middleware.resolveDefaultAccess
  , middleware.notifyCommented
  , actions.create)

/**
 * @api {delete} /share/:id
 *
 * Delete a share
 */

app.del('/:id'
  , lookup(Share)
  , middleware.canEdit(Share)
  , middleware.ifPublic(middleware.updateForked('repinCount', -1))
  , middleware.ifPublic(false, middleware.updateForked('assignCount', -1))
  , middleware.deleteLikes
  , actions.destroy)

/**
 * @api {put} /share/:id
 *
 * Update a share
 */

app.put('/:id'
  , lock.middleware('id')
  , lookup(Share)
  , user.middleware.me()
  , middleware.canEdit(Share)
  , middleware.update()
  , actions.updateShare)

/**
 * Copy share
 * @param {String} id share id
 */

app.post('/:id/copy'
  , user.middleware.me()
  , lookup(Share, {prop: 'body'})
  , middleware.copy()
  , middleware.authActor
  , middleware.resolveDefaultAccess
  , actions.create)

/**
 * RouterIO App
 */

var io = app.io = require('lib/routerware')()
var ioActions = require('./io')

io.post('/subscription'
  , ioActions.subscribe)

io.del('/subscription'
  , ioActions.unsubscribe)

/**
 * Foreign references
 */

Share.ref('Share', 'root')

/**
 * Exports
 */

module.exports = app
