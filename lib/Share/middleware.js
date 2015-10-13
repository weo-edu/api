/**
 * Imports
 */

var Group = require('lib/Group').model
var User = require('lib/User/model')
var Share = require('./model')
var errors = require('lib/errors')
var updateShare = require('lib/update-share')
var uncapitalize = require('uncapitalize')
var asArray = require('as-array')
var Seq = require('seq')
var _ = require('lodash')
var selfLink = require('lib/schema-plugin-selflink')
var notify = require('lib/notify')
var mongo = require('lib/mongo')
var camel = require('camelcase')

/**
 * Share middleware
 */

/**
 * Policy that ensures the share being manipulated is
 * not active
 */

exports.isNotActive = function(req, res, next) {
  if(! req.share)
    return next(errors.Server('isNotActive requires req.share'))
  if(req.share.status === 'active')
    return next(errors.Authorization())
  next()
}

exports.ifType = function(type, middleware) {
  return function(req, res, next) {
    var share = req.share || req.body
    var typeCheck = Share[camel('is ' + type)]
    if (typeCheck(share)) {
      middleware(req, res, next)
    } else {
      next()
    }
  }
}


/**
 * If no actor is set the authenticated user will be
 * added as the actor
 */

exports.authActor = function(req, res, next) {
  if(! req.me) return next('authActor requires req.me')
  var share = req.body
  if (! share.actor || !share.actor.id) {
    share.actor = req.me.toKey()
  }
  next()
}

exports.resolveDefaultAccess = function(req, res, next) {
  var contexts = asArray(req.param('contexts'))
  Seq(contexts)
  .parMap(function(ctx) {
    var cb = this
    // Allow it to be an array of strings, that are just ids

    if (! (ctx.allow && ctx.allow.length)) {
      Group.findById(ctx.id || ctx, function(err, group) {
        if (err) return cb(err)
        if(! group) return cb(errors.NotFound('Group not found'))

        if('string' === typeof ctx) {
          ctx = {descriptor: group.toAbstractKey()}
        }

        // Copy the group's default access
        ctx.allow = Group.defaultAllow(group.toKey())
        cb(null, ctx)
      })
    } else
      cb(null, ctx)
  })
  .flatten()
  .seq(function() {
    req.body.contexts = [].slice.call(arguments)
    this()
  })
  .seq(next)
  .catch(next)
}

exports.addUserChannel = function(req, res, next) {
  if(! req.me) return next(errors.Authentication('addUserChannel requires req.me'))

  if(Share.isProfileShare(req.body)) {
    var channel = req.me.getChannel('activities')
    if(req.body.channels.indexOf(channel) === -1)
      req.body.channels.push(channel)
  }

  next()
}

exports.canView = function () {
  return function(req, res, next) {
    var share = req.share

    if (share.isPublic()) {
      return next()
    }

    if (!req.auth) {
      return next(errors.Authentication('Activity is not public and you are not authenticated'))
    }

    User
      .findById(req.auth.id)
      .exec()
      .then(function (user) {
        if (!user) {
          return next(errors.Server('Unidentified user'))
        }

        var userGroups = user.groups.map(function(g) {return g.id})
        var shareGroups = share
          .contexts
          .slice(0, share.contexts.length - 1)
          .map(function (access) {
            return access.descriptor.id
          })

        if (share.isOwner(user) || _.intersection(userGroups, shareGroups).length) {
          next()
        } else {
          next(errors.NotFound())
        }
      }, next)
  }
}

exports.canEdit = function(Model) {
  var name = uncapitalize(Model.modelName)
  return function(req, res, next) {
    if(! req.auth) return next(errors.Authentication('canEdit requires req.auth'))
    var share = req[name]

    if(! share) return next('canEdit requires req.' + name)
    if(! share.canEdit(req.auth)) {
      if(! (share.isInstance() && share.isRootOwner(req.auth)))
        return next(errors.Authorization('You do not have access to that share'))
    }

    next()
  }
}



exports.canGrade = function() {
  return function(req, res, next) {
    if(! req.auth) return next(errors.Authentication('canGrade requires req.auth'))

    var share = req.share
    if(! share.isInstance())
      return next(errors.Client('You cannot return a root share'))
    if(! share.isRootOwner(req.auth))
      return next(errors.Authorization('You do not have permission to grade that share'))

    next()
  }
}



exports.getInstance = function () {
  return function (req, res, next) {
    var user = req.user || req.me
    var context = req.param('context')

    if (!context) {
      context = req.share.contextsForUser(user)[0]
      context = context ? context.descriptor.id : 'public'
    }

    function done (inst) {
      req.share = inst
      next()
    }

    req.share
      .findInstances()
      .where('actor.id', user.id)
      .exec(function (err, instances) {
        if(err) return next(err)
        var inst = _.find(instances, function(inst) {
          return inst.contextIds.indexOf(context) !== -1
        })

        if(! inst) {
          inst = req.share.createInstance({
            context: context,
            user: req.user
          })
        }

        if(req.me.id === req.user.id && inst.isUnopened()) {
          inst.setOpened()
        }

        if(inst.isNew || inst.isModified()) {
          inst.save(function(err) {
            if(err) return next(err)
            done(inst)
          })
        } else
          done(inst)
      })
  }
}

exports.update = function() {
  return function(req, res, next) {
    var update = req.body
    req.share.fromJSON(update, {reset: false, trusted: false})
    req.share.removeDuplicates()
    next()
  }
}


exports.copy = function() {
  return function(req, res, next) {
    var old = req.body.toJSON()
    selfLink.strip(old)



    old._forked = [{
      id: old.id,
      displayName: old.displayName,
      actor: old.actor,
      board: Share.board(old),
      url: req.body.url
    }]

    if (old._forked[0] && old._forked[0].board) {
      old.pinnedFrom = {
        board: old._forked[0].board,
        actor: old._forked[0].actor
      }
    }


    delete old._id
    delete old.id
    delete old.createdAt
    delete old.publishedAt
    delete old.published
    delete old.actor
    delete old.likers
    delete old.likersLength
    delete old.repinCount
    delete old.assignCount

    old.channels = []
    old.contexts = []
    old.fork = true

    if (! (old._forkedSource && old._forkedSource[0] && old._forkedSource[0].id))
      old._forkedSource = old._forked

    req.body = old
    next()
  }
}

exports.updateForked = function(prop, inc) {
  return function(req, res, next) {
    if (req.share.fork) {
      Share.findOne({_id: req.share.forked.id}, function(err, share) {
        if (err) return
        share[prop] = share[prop] + inc
        share.save()
      })
    }
    next()
  }
}

exports.ifPublic = function(b, mw) {
  if (typeof b === 'function') {
    mw = b
    b = null
  }

  b = b === null ? true : b

  return function (req, res, next) {
    if (req.share.isPublic() === b) {
      mw(req, res, next)
    } else {
      next()
    }
  }
}

exports.deleteLikes = function(req, res, next) {
  var edges = mongo.collection('edges')
  edges.remove({dest: req.share._id.toString()}).then(function() {
  })
  next()
}

exports.sendTo = function (groupType) {
  return function (req, res, next) {
    var to = req.param('to')
    var originalDescription = req.param('originalDescription')
    var displayName = req.param('displayName')
    var groupIds = req.me.groupIds
    var share = req.share

    // make sure user is a member of groups it is assigning to
    if (_.union(groupIds, to).length !== groupIds.length) {
      res.send(403)
      return
    }

    Group.find()
      .where('_id').in(to)
      .where('groupType', groupType)
      .where('status', 'active')
      .exec(function(err, groups) {
        share.withGroups(groups)

        if (groupType === 'board') {
          share.withPublic('teacher')
        }

        //add channels
        share.sendToGroups(groups)

        // publish
        share.published = true

        if (originalDescription)
          share.originalDescription = originalDescription

        if (displayName)
          share.displayName = displayName

        updateShare(req.share, function(err, share) {
          if(err) return next(err)
          next()

          // update group
          if (groupType === 'board') {
            groups.forEach(function(group) {
              // add share image to board, no big deal if it fails
              if (group.addImageFromShare(share))
                group.save()

            })
          }
        })
      })
  }
}
