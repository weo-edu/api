var mongoose = require('mongoose');
var UserSchema = require('./schema');
var Group = require('lib/Group/model');
var errors = require('lib/errors');
var passwordHash = require('password-hash');
var knox = require('knox');
var s3client = knox.createClient(require('lib/config').s3.avatar);
var config = require('lib/config');
var url = require('url');
var _ = require('lodash');


/**
 * Hooks
 */
require('./hooks');

/*
  Add server-side only extensions to schema (e.g. password hashing)
 */

// Static methods


// Instance methods
UserSchema.method('joinGroup', function(group) {
  if(this.belongsTo(group.id))
    return false;
  var key = group.toKey();
  this.groups.push(key);
  return true;
});

UserSchema.method('leaveGroup', function(groupToLeave) {
  var id = groupToLeave.id;
  if(! this.belongsTo(id))
    return false;

  this.groups = this.groups.filter(function(group) {
    return group.id !== id && (!group.parent || group.parent.id !== id);
  });

  return true;
});

UserSchema.method('belongsTo', function(groupId) {
  return this.groups.some(function(group) {
    return group.id === groupId;
  });
});

UserSchema.method('isTeacherOf', function(student, cb) {
  if(! this.isTeacher() || ! student.isStudent())
    return cb(false);

  var overlap = _.intersection(student.groupIds, this.groupIds);
  Group.count()
    .where('_id').in(overlap)
    .where('owners.id', this.id)
    .exec(function(err, count) {
      err || count === 0
        ? cb(false)
        : cb(true);
    });
});

UserSchema.method('checkPassword', function(password) {
  return passwordHash.verify(password, this.password);
});

UserSchema.method('addressQuery', function(context) {
  return {
    contexts: {
      $elemMatch: {
        'descriptor.id': context,
        'allow.id': {$in: this.tokens(context)}
      }
    }
  };
});

UserSchema.method('createProfileShare', function() {
  return this.createShare('profile', {
    channels: this.getChannel('activities'),
    public: ['teacher', 'student']
  });
});

UserSchema.method('emitProfileEvent', function(prop, content, cb) {
  var share = this.createProfileShare();
  share.object.displayName = prop;
  share.object.content = content;
  return share.save(cb);
});

UserSchema.method('setAvatar', function(opts, cb) {
  opts = opts || {};

  if('string' === typeof opts)
    opts = {imageUrl: opts};

  var imageUrl = opts.imageUrl;
  var emit = opts.emit !== false;
  var imagePath = url.parse(imageUrl).pathname;

  if(emit) this.emitProfileEvent('avatar', imageUrl);

  s3client.copyFile(imagePath, '/' + this.id, {
    'x-amz-acl': 'public-read',
    'x-amz-metadata-directive': 'REPLACE',
    'Cache-Control': 'no-cache, no-store, must-revalidate',
    'Pragma': 'no-cache',
    'Expires': 0,
    'Content-Type': 'image/png'
  }, function(err, s3Res) {
    if(err) return cb(err);
    if(s3Res.statusCode === 404)
      return cb(errors.NotFound('Avatar not found'));

    cb(null);
  });
});

// Various config

UserSchema.set('toJSON', {
  transform: function(doc, ret) {
    // Don't send passwords over the wire (even though they're hashed)
    delete ret.password;
  }
});

UserSchema.path('username').index({unique: true});

// We have to do a custom username validation to get it to throw
// as a ValidationError rather than a MongoError
UserSchema.path('username').validate(function(value, done) {
  if(this.isModified('username') || this.isNew) {
    User.count({_id: {$ne: this._id}, username: value}, function(err, count) {
      if(err) return done(err);
      done(! count);
    });
  } else
    done(true);
}, 'Username already exists', 'unique');

UserSchema.path('email').index({unique: true, sparse: true});
UserSchema.path('email').validate(function(value, done) {
  if((this.isModified('email') || this.isNew) && value) {
    User.count({_id: {$ne: this._id}, email: value}, function(err, count) {
      if(err) return done(err);
      done(! count);
    });
  } else
    done(true);
}, 'Email already exists', 'unique');

UserSchema.virtual('image.url').get(function() {
  return config.avatarServer + '/' + this.id;
});

var token = require('lib/token');
var google = require('lib/google');
UserSchema.static('findByGoogle', function(options, cb) {
  var User = mongoose.model('User');
  google.getUser(options, function(err, profile) {
    if (err) return cb(err);
    User.findOne({ 'auth.google': profile.sub }, function(err, user) {
      if (err) return cb(err);
      cb(err, user, profile);
    });
  });
});


UserSchema.method('linkToGoogle', function(profile, cb) {
  var self = this;
  this.auth.google = profile.sub;
  this.displayName = this.displayName || profile.name;
  this.email = this.email || profile.email;
  this.name.givenName = this.name.givenName || profile.given_name;
  this.name.familyName = this.name.familyName || profile.family_name;
  this.name.honorificPrefix = this.name.honorificPrefix || profile.honorific_prefix;
  this.password = this.password || token.generate();
  this.username = this.username || this.email.slice(0, this.email.indexOf('@')).replace(/\./g, '-');
  var User = mongoose.model('User');
  User.findUsernameLike(this.username, function(err, username) {
    if (err) return cb(err);
    self.username = username;
    cb();
  });
});

UserSchema.static('findUsernameLike', function(username, cb) {
  var User = mongoose.model('User');
  var attempt = 0;

  function find() {
    var u = username;
    if (attempt > 0) {
      u = username + Math.ceil(Math.random() * Math.pow(10, attempt));
    }
    attempt++;
    User.findOne({username: u}, function(err, user) {
      if (err) return cb(err);

      if (!user) return cb(null, u);

      find();
    });
  }

  find();

});

var User = module.exports = mongoose.model('User', UserSchema);