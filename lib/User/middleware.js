var middleware = module.exports
var User = require('./model')
var errors = require('lib/errors')
var validations = require('lib/validations')

middleware.me = function(opts) {
  opts = opts || {}
  opts.property = opts.property || 'me'
  var should404 = ! opts.no404
  return function(req, res, next) {
    if(! req.auth) {
      if(should404) return next(errors.Server('me middleware requires req.auth'))
      else return next()
    }

    var query = User.findById(req.auth.id)
    if(opts.lean) query.lean()

    query.exec(function(err, user) {
      if(err) return next(err)
      // This should probably not be possible, but just in case
      if(! user && should404) return next(errors.NotFound())
      req[opts.property || 'me'] = user
      next()
    })
  }
}

/*
  Policy middleware that restricts access to users of a certain type
 */
middleware.is = function(type) {
  return function(req, res, next) {
    if(! req.auth)
      return next(errors.Server('is middleware requires req.auth'))

    if(req.auth.userType !== type) {
      return next(errors.Authorization('not type "' + type + '"'))
    }
    next()
  }
}

middleware.isAdmin = function(req, res, next) {
  if(! req.me) return next(errors.Server('isAdmin middleware requires req.me'))
  if(! req.me.admin)
    return next(errors.Authorization('You are not an administrator'))
  next()
}

middleware.byUsernameOrEmail = function(req, res, next) {
  var username = (req.param('username') || '').toLowerCase()
  User.where(validations.email(username) ? 'email' : 'username', username)
    .findOne(function(err, user) {
      if(err) return next(err)
      if(! user)
        return next(errors.NotFound('User not found', 'username', username))

      req.user = user
      next()
    })
}

var isObjectId = validations.ObjectId()
middleware.byUsernameOrId = function(req, res, next) {
  var id = (req.param('id') || '').toLowerCase()
  User
    .where(isObjectId(id) ? '_id' : 'username', id)
    .findOne(function(err, user) {
      if(err) return next(err)
      if(! user) return next(errors.NotFound('User not found', 'username', id))
      req.user = user
      next()
    })
}

middleware.canEditUser = function(field) {
  return function(req, res, next) {
    if(! req.me)
      return next('canEditUser requires req.me')
    if(! req.user)
      return next('canEditUser requires req.user')

    var path = req.user.schema.path(field)
    var editableBy = path.options.editableBy || ['me']
    if(editableBy.indexOf('me') !== -1) {
      if(req.user.id === req.me.id)
        return next()
    }

    function unauthorized() {
      next(errors.Authorization('You are not allowed to edit that field on that user'))
    }

    if(editableBy.indexOf('teacher') !== -1) {
      return req.me.isTeacherOf(req.user, function(isTeacherOf) {
        isTeacherOf
          ? next()
          : unauthorized()
      })
    } else
      unauthorized()
  }
}

middleware.checkResetToken = function(req, res, next) {
  var token = decodeURIComponent(req.param('token'))
  User.findOne({'reset.token': token}, function(err, user) {
    if(err) return next(err)
    if(! user) return next(new Error('Invalid token'))
    req.user = user
    next()
  })
}