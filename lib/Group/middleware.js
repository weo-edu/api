var middleware = module.exports
var Group = require('./model')
var errors = require('lib/errors')
var asArray = require('as-array')
var debug = require('debug')('weo:group:middleware')
var _ = require('lodash')

/*
  Policy to ensure that the current user
  is an owner of this group
 */
middleware.isOwner = function (req, res, next) {
  if (! req.auth)
    return next(errors.Authentication('isOwner requires req.auth'))
  if (! req.group)
    return next(errors.Server('isOwner requires req.group'))
  if (! req.group.isOwner(req.auth.id))
    return next(errors.Authorization('You are not the owner of that group'))
  next()
}

/*
  Check the a user is a member of the groups passed in
  the parameter in question
 */
middleware.belongsTo = function (paramName) {
  return function(req, res, next) {
    if(! req.me)
      return next(errors.Server('belongsTo requires req.me'))

    var to = asArray(req.param(paramName))
    var belongsTo = (req.me.groupIds || []).concat(req.me.id)

    if(_.intersection(to, belongsTo).length !== to.length) {
      debug('Denied access to groups: ', _.difference(to, belongsTo))
      return next(errors.Authorization(
        "You do not have access to one more more of those groups"))
    }

    next()
  }
}

middleware.exists = function (paramId) {
  return function(req, res, next) {
    Group.findById(req.param(paramId), function (err, group) {
      if (group)
        next()
      else
        next(404)
    })
  }
}

middleware.lookupByCode = function (opts) {
  opts = opts || {}
  return function (req, res, next) {
    var code = (req.param('code') || '').trim()
    var query = Group.findByCode(code)
    opts.lean && query.lean()
    query.findOne(function(err, group) {
      if(err) return next(err)
      if(! group) return next(errors.NotFound('Group not found', 'code', code))
      req.group = group
      next()
    })
  }
}
