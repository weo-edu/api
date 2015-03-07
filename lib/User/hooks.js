var passwordHash = require('password-hash');
var config = require('lib/config');
var capitalize = require('capitalize');
var Schema = require('./schema');
var slug = require('slug');
var io = require('lib/io');
var _ = require('lodash');

/**
 * Pre/post validate
 */

Schema.pre('validate', function findUsernameLike(next) {
  var user = this;

  // If the user has inputted an email but no username
  // let's find them a username that looks as much like
  // the username portion of their email as possible
  if(user.isNew && ! user.username && user.email) {
    var username = slug(user.email.split('@')[0]);

    user.constructor.findUsernameLike(username, function(err, username) {
      if(err) return next(err);
      user.username = username;
      next();
    });
  } else
    next();
});

Schema.pre('validate', function displayName(next) {
  if (! this.displayName) {
    this.setDisplayName();
  }
  next();
});

Schema.pre('validate', function lowercaseUsernameAndEmail(next) {
  if(this.username)
    this.username = this.username.toLowerCase();
  if(this.email)
    this.email = this.email.toLowerCase();
  next();
});


/**
 * Pre save/remove
 */

Schema.pre('save', function hashPassword(next) {
  if(this.isNew || this.isModified('password')) {
    this.password = passwordHash.generate(this.password, config.hash);
  }

  next();
});



Schema.pre('save', function capitalizeName(next) {
  if (this.isNew || this.isModified('name') || this.isModified('name.givenName') || this.isModified('name.familyName')) {
    this.name.givenName = capitalize.words(this.name.givenName);
    this.name.familyName = capitalize.words(this.name.familyName);
  }
  next();
});

Schema.pre('save', function displayName(next) {
  if (this.isModified('name')) {
    this.setDisplayName();
  }
  next();
});


var profileProps = ['avatar', 'displayName', 'aboutMe', 'color'];
Schema.pre('save', function(next) {
  var user = this;
  if(user.isNew) return next();

  profileProps
    .filter(function(prop) { return user.isModified(prop); })
    .forEach(function(prop) {
      var content;

      switch(prop) {
        case 'color':
          content = user.color;
          break;
        case 'aboutMe':
          content = user.aboutMe;
          break;
        case 'avatar':
          content = user.imageUrl;
          break;
      }

      user.emitProfileEvent(prop, content);
    });

  next();
});



/**
 * Post save/remove
 */

Schema.post('save', function createAvatar(user, next) {
  if(! user.wasNew) return next();

  user.setAvatar({
    imageUrl: '/originals/default/default.png',
    emit: false
  }, function(err) {
    err && console.error('Error setting up avatar for user:' + user.id);
    next(err);
  });
});

Schema.post('save', function(user) {
  io.sockets.to(user.id);
  io.sockets.send({
    params: {
      id: user.id
    },
    verb: user.wasNew ? 'add' : 'change',
    model: 'User',
    data: user.toJSON()
  });
});

Schema.post('save', function broadcastJoinLeave(user) {
  var joined = _.difference(user.groupIds, user.$groupIds);
  var left = _.difference(user.$groupIds, user.groupIds);
  var json = user.toJSON();

  function send(id) {
    io.sockets
      .to(id)
      .send({
        verb: 'change',
        params: {group: id},
        model: 'User',
        data: json
      });
  }

  joined.forEach(send);
  left.forEach(send);
});

/**
 * Init
 */

function storePrevious(doc) {
  doc.$groupIds = doc.groupIds;
}

Schema.post('init', storePrevious);
// This post('save') must come after all
// other post save's to ensure that
// it can re-setup the prior channels
Schema.post('save', storePrevious);
