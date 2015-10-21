var passwordHash = require('password-hash')
var invite = require('lib/Invite/model')
var config = require('lib/config')
var capitalize = require('capitalize')
var Schema = require('./schema')
var mongoose = require('mongoose')
var async = require('async')
var slug = require('lib/slug')
var io = require('lib/io')
var pad = require('lib/pad-random')
var _ = require('lodash')
var q = require('q')

/**
 * Pre/post validate
 */

Schema.pre('validate', function findUsernameLike(next) {
  var user = this

  // If the user has inputted an email but no username
  // let's find them a username that looks as much like
  // the username portion of their email as possible
  if(user.isNew && ! user.username && user.email) {
    var username = pad(3, slug(user.email.split('@')[0]))
    user.constructor.findUsernameLike(username, function(err, username) {
      if(err) return next(err)
      user.username = username
      next()
    })
  } else
    next()
})

Schema.pre('validate', function displayName(next) {
  if (! this.displayName) {
    this.setDisplayName()
  }
  next()
})

Schema.pre('validate', function lowercaseUsernameAndEmail(next) {
  if(this.username)
    this.username = this.username.toLowerCase()
  if(this.email)
    this.email = this.email.toLowerCase()
  next()
})


/**
 * Pre save/remove
 */

Schema.pre('save', function defaultCounts(next) {
  if (!this.followers) this.followers = 0
  if (!this.following) this.following =  0
  if (!this.pinCount) this.pinCount = 0
})

Schema.pre('save', function hashPassword(next) {
  if(this.isNew || this.isModified('password')) {
    this.password = passwordHash.generate(this.password, config.hash)
  }

  next()
})


Schema.pre('save', function onboardAddStudents(next) {
  if (this.example) {
    delete this.example
    return next()
  }

  if(this.isStudent() && (this.isNew || this.isModified('groups'))) {
    var oldIds = this.$groupIds
    var newIds = this.isNew ? this.groupIds : this.groupIds.filter(function(id) {
      return oldIds.indexOf(id) === -1
    })

    var Group = mongoose.model('Group')
    var User = mongoose.model('User')

    async.each(newIds, function(id, cb) {
      Group.findById(id, function(err, group) {
        if(err) return cb(err)
        if (group.example) return cb(null)

        async.each(group.owners, function(owner, innerCb) {
          User.findById(owner.id, function(err, teacher) {
            if(err) return innerCb(err)
            teacher.setPreference('onboard.add_students', true)
            teacher.save(innerCb)
          })
        }, cb)
      })
    }, next)
  } else
    next()
})


Schema.pre('save', function capitalizeName(next) {
  if (this.isNew || this.isModified('name') || this.isModified('name.givenName') || this.isModified('name.familyName')) {
    this.name.givenName = capitalize.words(this.name.givenName)
    this.name.familyName = capitalize.words(this.name.familyName)
  }
  next()
})

Schema.pre('save', function displayName(next) {
  if (this.isModified('name')) {
    this.setDisplayName()
  }
  next()
})

Schema.pre('save', function setJoinedGroup(next) {
  var oldLen = (this.$groupIds && this.$groupIds.length) || 0
  var newLen = (this.groupIds && this.groupIds.length) || 0

  if(newLen > oldLen && oldLen === 0)
    this.setPreference('group_joined', true)
  next()
})


var profileProps = ['displayName', 'aboutMe', 'color']
Schema.pre('save', function(next) {
  var user = this
  if(user.isNew) return next()

  profileProps
    .filter(function(prop) { return user.isModified(prop) })
    .forEach(function(prop) {
      var content

      switch(prop) {
        case 'color':
          content = user.color
          break
        case 'aboutMe':
          content = user.aboutMe
          break
      }

      user.emitProfileEvent(prop, content)
    })

  next()
})



/**
 * Post save/remove
 */

Schema.post('save', function (user, next) {
  io.sockets.to(user.id)
  io.sockets.send({
    params: {
      id: user.id
    },
    verb: user.wasNew ? 'add' : 'change',
    model: 'User',
    data: user.toJSON()
  })
  next()
})

Schema.post('save', function spendInvite (user, next) {
  if(! user.wasNew)
    return next()

  invite
    .use(user.inviteCode, user)
    .then(function (user) { next(null, user) }, next)
})

Schema.post('save', function broadcastJoinLeave(user, next) {
  var joined = _.difference(user.groupIds, user.$groupIds)
  var left = _.difference(user.$groupIds, user.groupIds)
  var json = user.toJSON()

  function send(id) {
    io.sockets
      .to(id)
      .send({
        verb: 'change',
        params: {group: id},
        model: 'User',
        data: json
      })
  }

  joined.forEach(send)
  left.forEach(send)
  next()
})

Schema.post('save', function autofollow (user, next) {
  if (!user.wasNew) return next()
  if (!user.isTeacher()) return next()
  if (!config.autofollow || config.autofollow.length === 0) return next()

  q
    .all(config.autofollow.map(function (id) {
      return user.followUser(id)
    }))
    .then(function () { next() }, next)
})

/**
 * Init
 */

function storePrevious(doc, next) {
  doc.$groupIds = doc.groupIds
  next()
}

Schema.post('init', storePrevious)
// This post('save') must come after all
// other post save's to ensure that
// it can re-setup the prior channels
Schema.post('save', storePrevious)
