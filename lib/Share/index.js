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
  , app.actions.to)

app.get('/feed'
  , user.middleware.me()
  , pageToken()
  , app.actions.feed)

/**
 * Admin Feed
 */

 app.get('/admin'
   , user.middleware.me()
   , user.middleware.isAdmin
   , pageToken()
   , app.actions.admin)

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
  , app.middleware.canView()
  , app.actions.get)

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
  , app.actions.getMembers)

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
  , app.actions.getContexts)

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
  , app.middleware.getInstance()
  , app.actions.get)

/**
 * @api {put} /share/:id/instance
 *
 * Update a share instance
 */

app.put('/:id/instance'
  , lookup(Share)
  , app.actions.updateInstance)

/**
 * @api {put} /share/:id/published
 *
 * Publish the share specified by :id
 */

app.put('/:id/published'
  , lookup(Share)
  , app.middleware.canEdit(Share)
  , app.actions.publish)

/**
 * @api {put} /share/:id/unpublished
 *
 * Unpublish the share specified by id
 */

app.put('/:id/unpublished'
  , lookup(Share)
  , app.middleware.canEdit(Share)
  , app.actions.unpublish)

app.put('/:id/assign'
  , lookup(Share)
  , app.middleware.canEdit(Share)
  , user.middleware.me()
  , app.middleware.updateForked('assignCount', 1)
  , app.actions.sendTo('class'))

app.put('/:id/pin'
  , lookup(Share)
  , app.middleware.canEdit(Share)
  , user.middleware.me()
  , app.middleware.updateForked('repinCount', 1)
  , notify('pinned_activity')
  , app.actions.sendTo('board'))

app.put('/:id/like'
  , lookup(Share)
  , user.middleware.me()
  , notify('liked_activity')
  , app.actions.like)

app.put('/:id/unlike'
  , lookup(Share)
  , user.middleware.me()
  , app.actions.unlike)

/**
 * @api {post} /share
 *
 * Create a new share
 */

app.post('/'
  , user.middleware.me()
  , app.middleware.authActor
  , app.middleware.resolveDefaultAccess
  , app.middleware.notifyCommented
  , app.actions.create)

/**
 * @api {delete} /share/:id
 *
 * Delete a share
 */

app.del('/:id'
  , lookup(Share)
  , app.middleware.canEdit(Share)
  , app.middleware.ifPublic(app.middleware.updateForked('repinCount', -1))
  , app.middleware.ifPublic(false, app.middleware.updateForked('assignCount', -1))
  , app.middleware.deleteLikes
  , app.actions.destroy)

/**
 * @api {put} /share/:id
 *
 * Update a share
 */

app.put('/:id'
  , lock.middleware('id')
  , lookup(Share)
  , user.middleware.me()
  , app.middleware.canEdit(Share)
  , app.middleware.update()
  , app.actions.updateShare)

app.put('/:id/question/:questionId/response'
  , lock.middleware('id')
  , lookup(Share)
  , user.middleware.me()
  , app.actions.answerQuestion)

/**
 * Copy share
 * @param {String} id share id
 */

app.post('/:id/copy'
  , user.middleware.me()
  , lookup(Share, {prop: 'body'})
  , app.middleware.copy()
  , app.middleware.authActor
  , app.middleware.resolveDefaultAccess
  , app.actions.create)

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
