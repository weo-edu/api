var moment = require('moment')
var io = require('lib/io')
var _ = require('lodash')
var mongoose = require('mongoose')
var chutil = require('lib/channel')
var Schema = require('./schema')
var async = require('async')
var lock = require('lib/lock')
var status = require('./status')
var summarizeMarkdown = require('summarize-markdown')
var striptags = require('striptags')
var User = require('lib/User/model')
var mail = require('lib/mail')

/**
 * Pre validate
 */
 // Ensure every share has an id before it is validated
 Schema.pre('validate', function(next) {
   this._id = this._id || new mongoose.Schema.Types.ObjectId
   next()
 })

Schema.pre('validate', function(next) {
  if (! this.verb) {
    var att = this.object.attachments
    this.verb = att.length
      ? att[0].verb()
      : this.object.verb()
  }
  next()
})

/**
 * Pre save/remove
 */
Schema.pre('save', function addMeContext(next) {
  if(this.isNew && this.isSheet()) {
    var actor = this.actor.toJSON()
    delete actor.color
    this.withMe(actor)
  }
  next()
})

Schema.pre('save', function setInstanceVerb(next) {
  if(this.isInstance()) {
    if(this.isOpened())
      this.verb = 'started'
    else if(this.isTurnedIn())
      this.verb = 'completed'
  }
  next()
})

Schema.pre('save', function setPublishedAt(next) {
  if(! this.isInstance()) {
    if((this.$wasDraft || this.isNew) && this.isPublished()) {
      this.publishedAt = moment().toISOString()
    }
  }
  next()
})


Schema.pre('save', function setChannels(next) {
  if(this.isSheet() && ! this.isNew) {
    this.isDraft() && this.sendToDrafts()
  }

  next()
})

Schema.pre('save', function setCommonCore (next) {
  if (this.isSheet() && this.tags && _.find(this.tags, {tagType: 'standard'})) {
    this.commonCore = true
  } else {
    this.commonCore = false
  }
  next()
})


Schema.pre('save', function setGradedState(next) {
  if(this.isInstance()) {
    if(this.isTurnedIn() && this.object.isGraded())
      this.setGraded()
    else if(this.isGraded() && ! this.object.isGraded())
      this.setTurnedIn()
  }

  next()
})

// setStatusChangedAt must come after all other pre-save hooks
// that might mutate .status (e.g. setGradedState), so that it
// can correctly timestamp the full range of state transitions
// that have occurred in this save
Schema.pre('save', function setStatusChangedAt(next) {
  if(this.isInstance() && this.isModified('status')) {
    if(this.status > this.$status) {
      var ShareInstance = mongoose.model('shareInstance')
      var now = moment().toISOString()

      for(var status = this.$status + 1; status <= this.status; status++) {
        this.at[ShareInstance.statusName(status)] = now
      }
    }
  }

  next()
})

Schema.pre('save', function addDescription(next) {
  if (this.isSheet()) {
    var post = _.find(this.object.attachments, function(attachment) {
      return attachment.objectType === 'post'
    })
    if (post) {
      // strip markdown
      this.description = this.originalDescription || striptags(summarizeMarkdown(post.originalContent))
    } else {
      this.description = this.originalDescription  || ''
    }
    this.description = this.description.slice(0, 250)
  }
  next()
})

var imageTypes = ['image', 'video', 'document']
Schema.pre('save', function addImage(next) {
  if (this.isSheet()) {
    var att = _.find(this.object.attachments, function(attachment) {
      return imageTypes.indexOf(attachment.objectType) !== -1
    })

    this.image = att ? att.image : {}
  }
  next()
})




/**
 * Post save/remove
 */

function broadcastFactory(evt) {
  return function broadcast(share) {
    var json = share.toJSON()
    var tokens = share.tokens()
    // Cache these up here because contextIds is a virtual
    // and we dont want to recompute it for each send
    var contextIds = share.contextIds
    var $contextIds = share.$contextIds

    if(evt === 'remove') {
      send('remove', share.channels)
    } else {
      if(share.wasNew) {
        send('add', share.channels)
      } else if(! share.wasModified('channels')) {
        send('change', share.channels)
      } else {
        send('add', _.difference(share.channels, share.$channels))
        send('remove', _.difference(share.$channels, share.channels))
        send('change', _.intersection(share.$channels, share.channels))
      }
    }

    function send(verb, channels) {
      channels.forEach(function(channel) {
        io.sockets.to(channel)
      })

      verb === 'change' && io.sockets.to(share.id)
      io.sockets.send({
        params: {
          id: share.id,
          channel: channels,
          // If we are removing a share from a channel, we
          // want to send that message to the prior set
          // of context ids, not the new one
          context: verb === 'remove'
            ? $contextIds
            : contextIds
        },
        tokens: tokens,
        deny: share.deny,
        verb: verb,
        model: 'Share',
        data: json
      })
    }
  }
}

Schema.post('save', broadcastFactory('save'))
Schema.post('remove', broadcastFactory('remove'))

function aggregateFactory(evt) {
  return function aggregate(share, next) {
    if(share.wasNew
      || evt === 'remove'
      || share.wasModified('status')
      || share.wasModified('channels')
      || share.$pointsScaled !== share.get('_object.0.points.scaled')) {
      var types = {push: [], remove: [], update: []}

      if (evt === 'save') {
        if(share.wasModified('channels')) {
          types.push = _.difference(share.channels, share.$channels)
          types.remove = _.difference(share.$channels, share.channels)
          types.update = _.intersection(share.$channels, share.channels)
        } else {
          types.update = share.channels
        }
      } else if(evt === 'remove') {
        types.remove = share.channels
      }

      async.each(Object.keys(types), function(type, outerCb) {
        async.each(types[type], function(channel, innerCb) {
          chutil.withModel(channel, function(err, parent) {
            function done() {
              parent.done()
              innerCb()
            }

            if (err || ! parent)
              return done(err)

            if(share.aggregate(type, parent)) {
              if(parent.model.isModified()) {
                parent.model.versioning = false
                parent.model.save(done)
              } else
                done()
            } else
              done()
          })
        }, outerCb)
      }, next)
    } else
      next()
  }
}

Schema.post('save', aggregateFactory('save'))
Schema.post('remove', aggregateFactory('remove'))


// Create all of the instances for a sheet
// when it is published
Schema.post('save', function createInstances(share, next) {

  if (share.isSheet()
    && (share.$wasDraft || share.wasNew || share.wasModified('contexts'))
    && share.isPublished()) {
    lock(share.id, function(done) {
      share.createInstances(function(err) {
        done()
        next(err)
      })
    })
  } else
    next()
})


Schema.post('save', function createTurnInEvent(share, next) {
  if(share.isInstance() && share.$status < status.turnedIn && share.status >= status.turnedIn) {
    share.createStatus('turned in').save(next)
  } else
    next()
})

Schema.post('save', function emailNotifications(share, next) {
  if(! share.isNotification()) {
    return next()
  }

  var notifiedId = findNotifiedUserId(share)

  User
    .findById(notifiedId)
    .exec()
    .then(function (user) {
      var to = {
        email: user.email,
        name: user.displayName
      }

      switch (share.object.status) {
        case 'liked':
          var disableLikeEmails = user.get('preferences.email.disableLikes')
          if (!disableLikeEmails) {
            return mail.likedActivity(to, share.object, next)
          }
          break
        case 'pinned':
          var disableRepinEmails = user.get('preferences.email.disableRepins')
          if(!disableRepinEmails) {
            return mail.pinnedActivity(to, share.object, next)
          }
          break
        case 'followed_user':
          var disableFollowedUserEmails = user.get('preferences.email.disableFollowedUser')
          if (!disableFollowedUserEmails) {
            return mail.followedUser(to, share.object, next)
          }
          break
        case 'followed_board':
          var disableFollowedBoardEmails = user.get('preferences.email.disableFollowedBoard')
          if (!disableFollowedBoardEmails) {
            return mail.followedBoard(to, share.object, next)
          }
          break
        case 'commented_on_activity':
          var disableCommentedOnEmails = user.get('preferences.email.disableCommentedOn')
          if (!disableCommentedOnEmails) {
            return mail.commentedOnActivity(to, share.object, next)
          }
          break
      }

      next()
    }, next)
})

function findNotifiedUserId(share) {
  var channels = share.channels
  var re = /^user\!(.*)\.notifications$/
  for(var i = 0; i < channels.length; i++) {
    if(re.test(channels[i]))
      return re.exec(channels[i])[1]
  }
}


/**
 * Init
 */

function storePrevious(doc) {
  doc.$status = doc.status
  doc.$channels = doc.channels
  doc.$wasDraft = ! doc.isPublished()
  doc.$contextIds = doc.contextIds
  doc.$pointsScaled = doc.get('_object.0.points.scaled')
}

Schema.post('init', storePrevious)
// This post('save') must come after all
// other post save's to ensure that
// it can re-setup the prior channels
Schema.post('save', storePrevious)
