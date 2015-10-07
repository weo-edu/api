/**
 * Imports
 */

var Share = require('./model')
var Group = require('lib/Group/model')
var errors = require('lib/errors')
var selfLink = require('lib/schema-plugin-selflink')
var config = require('lib/config')
var Following = require('lib/following')
var asArray = require('as-array')
var async = require('async')
var queue = require('lib/queue')
var crud = require('lib/crud')
var _ = require('lodash')
var po = require('@weo-edu/po')
var mongo = require('lib/mongo')
var ObjectId = require('mongodb').ObjectID
var is = require('@weo-edu/is')

/**
 * Vars
 */

var noop = function(){}
var following = Following.following

/**
 * Interface
 */

// Mixin crud
crud(exports, Share)

/**
 * Actions
 */

exports.admin = function (req, res, next) {
  var text = req.param('query')
  var page = req.page

  Share
    .find()
    .where({shareType: 'share'})
    .where({published: true})
    .where(text ? {$text: {$search: text}} : {})
    .sort({publishedAt: 'desc', createdAt: 'desc'})
    .skip(page.skip)
    .limit(page.limit)
    .lean()
    .exec(function (err, shares) {
      if(err) return next(err)
      res.json(shares)
    })
}

exports.feed = function (req, res, next) {
  var page = req.page

  following(req.me.id)
    .then(function (edges) {
      var channels = edges
        .filter(function (edge) {
          return ! edge.metadata.user
        })
        .map(function (edge) {
          return Group.path(edge.dest.id, 'board')
        })

      return Share
        .find({
          channels: {$in: channels},
          published: true,
          shareType: 'share'
        })
        .sort({publishedAt: 'desc'})
        .skip(page.skip)
        .limit(page.limit)
        .lean()
        .exec()
    })
    .then(
      function (shares) { res.json(shares) },
      next
    )
}

exports.to = function (req, res, next) {
  var channels = asArray(req.param('channel'))
  var context = req.param('context')
  var published = req.param('published')
  var fork = req.param('fork')
  var text = req.param('query')
  var sortOption = req.param('sort')


  var page = req.page
  var options = req.shareOptions

  var find = Share.find()
    .where('contexts.descriptor.id').in(
      asArray(
        context
          ? context
          : req.me ? req.me.groupIds.concat(['public', 'me']) : ['public']
        )
    )

  if (channels.length)
    find = find.where('channels').in(channels)

  if (options)
    find = find.where(options)

  if (published)
    find = find.where({published: published})

  if (!is.undefined(fork))
    find = find.where({fork: fork})

  var sort = {}
  if (sortOption) sort[sortOption] = 'desc'
  sort.publishedAt = 'desc'
  sort.createdAt = 'desc'

  find
    .where(text ? {$text: {$search: text}} : {})
    .where({createdAt: {$lt: page.before}})
    .sort(sort)
    .skip(page.skip)
    .limit(page.limit)
    .lean()
    .exec(function (err, shares) {
      if(err) return next(err)
      res.json(shares)
    })
}


var likes = po(
  function _likes (user, page) {
    var edges = mongo.collection('edges')
    return edges.find(
      {src: user.id, edgeType: 'like', createdAt: {$lt: page.before}}
    )
    .sort({createdAt: -1})
    .skip(page.skip)
    .limit(page.limit)
  },
  function _shares (likes) {
    if (!likes.length)
      return []

    var shares = mongo.collection('shares')
    var shareIds = likes.map(function (edge) {
      return new ObjectId(edge.dest)
    })


    return shares.find({_id: {$in: shareIds}}).then(function(shares) {
      var shareById = {}
      shares.forEach(function(share) {
        shareById[share._id.toString()] = share
      })

      var likedShares = []
      likes.forEach(function (edge) {
        var share = shareById[edge.dest]
        if (share) {
          likedShares.push(share)
        }
      })
      return likedShares;

    })
  }
)

exports.likes = function (req, res, next) {
  likes(req.user, req.page).then(function (liked) {
    res.json(liked)
  }).catch(next)
}


exports.getContexts = function (req, res) {
  var contexts = req.share.contextsForUser(req.me)
  res.json(contexts.map(function (context) {
    return context.descriptor
  }))
}

exports.getInstances = function (req, res) {
  var context = req.param('context')
  var id = req.param('id')

  return Share.find()
    .where('shareType', 'shareInstance')
    .where('_root.id', id)
    .where('contexts.descriptor.id', context)
    .lean()
    .exec(function (err, instances) {
      if(err) return next(err)
      res.json(instances)
    })
}

exports.save = function (req, res, next) {
  req.share.save(function (err, share) {
    if(err) return next(err)
    res.send(200, share)
  })
}


exports.updateInstance = function (req, res, next) {
  var inst = req.body
  selfLink.strip(inst)
  if(inst.__v >= req.share.__v) {
    var tmp = new Share.ShareInstance(inst)
    var data = tmp.instanceData()
    req.share.applyInstanceData(data)
    delete inst._object
    delete inst.object
    req.share.set(inst)
    exports.save(req, res, next)
  } else
    next(errors.VersionMismatch('version mismatch', '__v', inst.__v, req.share.toJSON()))
}

var updateInstanceQueue = queue('updateInstanceQueue')

function updateShare (share, cb) {
  share.save(function(err, share) {
    if (err) return cb(err)
    if(share.isSheet() && share.isPublished()) {
      updateInstanceQueue.push(function (cb) {
        updateInstances(share, cb)
      })
    }
    cb(null, share)
  })
}

exports.updateShare = function (req, res, next) {
  if(req.share.isInstance())
    return next()

  updateShare(req.share, function (err, share) {
    if(err) return next(err)
    res.send(200, share)
  })
}

function updateInstances (share, cb) {
  share.findInstances().exec(function (err, instances) {
    if(err) return cb(err)

    var tree = share.object.toJSON()
    async.each(instances, function (inst, cb) {
      var data = inst.instanceData()
      var instProps = share.instanceProperties({context: inst.contextIds})
      inst.set(instProps)

      inst.object = tree
      inst.applyInstanceData(data)
      inst.__rootUpdate = true
      inst.save(cb)
    }, cb)
  })
}

exports.getMembers = function (req, res, next) {
  var contexts = asArray(req.param('context'))
  req.share
    .getMembers(contexts)
    .lean()
    .exec(function(err, users) {
    if(err) return next(errors.Server(err))
    res.json(users)
  })
}

exports.publish = function (req, res, next) {
  req.share.published = true
  exports.updateShare(req, res, next)
}

exports.unpublish = function (req, res, next) {
  req.share.published = false
  exports.updateShare(req, res, next)
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
          res.send(200, share)

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

exports.like = function (req, res, next) {
  var share = req.share
  var user = req.me

  if (! share.likers)
    share.likers = []

  var liked = _.find(share.likers, function (liker) {
    return liker.id === user.id
  })

  if (liked) {
    return next(errors.Client('You cannot like twice.'))
  }

  share.likers.push(user.toKey())
  share.likersLength = share.likers.length

  updateShare(share, function (err, share) {
    if(err) return next(err)

    res.json(share)
    // insert in edges for likes look up
    mongo.collection('edges').insert({
      src: user.id,
      edgeType: 'like',
      dest: share.id,
      createdAt: new Date()
    }).then(noop)
  })
}

exports.unlike = function (req, res, next)  {
  var share = req.share
  var user = req.me

  if (! share.likers)
    share.likers = []

  var likeIdx = _.findIndex(share.likers, function (liker) {
    return liker.id === user.id
  })

  if (likeIdx === -1)
    return next(errors.Client('You cannot unlike a share that you didnt like.'))

  var likers = share.likers.map(function (liker) {
    return liker.toJSON()
  })
  likers.splice(likeIdx, 1)
  share.likers = likers
  share.likersLength = share.likers.length

  updateShare(share, function (err, share) {
    if (err) return next(err)

    res.json(share)

    mongo.collection('edges').remove({
      src: user.id,
      edgeType: 'like',
      dest: share.id
    }).then(noop)
  })
}

exports.answerQuestion = function (req, res, next) {
  var question = req.share.object.find(req.param('questionId'))
  if(! question || question.objectType !== 'question')
    return next(new Error('Question not found (' + req.param('questionId') + ')'))

  question.response = [].concat(req.body.answer)
  req.share.save(function (err) {
    if(err) return next(err)
    res.status(200).send()
  })
}

exports.templates = function (req, res, next) {
  if (!config.templateBoardId) {
    return res.send(404, 'No template user configured')
  }

  Group
    .activities(config.templateBoardId)
    .exec()
    .then(function (activities) {
      res.send(activities)
    }, next)
}

exports.copyTemplate = function (req, res, next) {
  var copy = req.me.createSection()

  // Copy attributes from the template
  copy.displayName = req.share.displayName
  copy.description = req.share.description
  copy.originalDescription = req.share.originalDescription
  copy.tags = req.share.tags
  copy.commonCore = req.share.commonCore
  copy.discussion = req.share.discussion
  copy.object.attachments = [].concat(req.share.object.attachments)

  copy.save(function (err) {
    err ? next(err) : res.send(copy)
  })
}

exports.trash = function (req, res, next) {
  var share = req.share
  share.sendToTrash()
  share.save(function (err) {
    if (err) return next(err)
    res.status(200).send()
  })
}
