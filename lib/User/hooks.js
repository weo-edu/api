var passwordHash = require('password-hash');
var config = require('lib/config');
var utils = require('lib/utils');
var Schema = require('./schema');
var io = require('lib/io');
var _ = require('lodash');

/**
 * Pre/post validate
 */



Schema.pre('validate', function lowercaseUsername(next) {
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
  if(this.isNew || this.isModified('name.givenName'))
    this.name.givenName = utils.capitalizeWords(this.name.givenName);
  if(this.isNew || this.isModified('name.familyName'))
    this.name.familyName = utils.capitalizeWords(this.name.familyName);

  next();
});

Schema.pre('validate', function displayName(next) {
  if (this.isModified('name') || !this.displayName) {
    var prefix = this.name.honorificPrefix;
    var first = prefix === 'None' ? this.name.givenName : prefix;
    var last = this.name.familyName;

    this.displayName = [first, last].filter(Boolean).join(' ');
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

Schema.post('save', function createAvatar(user) {
  if(! user.wasNew) return;

  user.setAvatar({
    imageUrl: '/originals/default/default.png',
    emit: false
  }, function(err) {
    err && console.error('Error setting up avatar for user:' + user.id);
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
