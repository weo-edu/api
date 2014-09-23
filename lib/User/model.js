var mongoose = require('mongoose');
var UserSchema = require('./schema');
var passwordHash = require('password-hash');
var config = require('lib/config');
var _ = require('lodash');

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

UserSchema.method('leaveGroup', function(group) {
  if(! this.belongsTo(group.id))
    return false;

  var idx = _.findIndex(this.groups, {id: group.id});
  this.groups.splice(idx, 1);
  return true;
});

UserSchema.method('belongsTo', function(groupId) {
  return this.groups.some(function(group) {
    return group.id === groupId;
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
  if (!this.isNew) return done(true);
  User.count({_id: {$ne: this._id}, username: value}, function(err, count) {
    if(err) return done(err);
    done(! count);
  });
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


UserSchema.method('linkToGoogle', function(profile) {
  this.auth.google = profile.sub;
  this.displayName = this.displayName || profile.name;
  this.email = this.email || profile.email;
  this.name.givenName = this.name.givenName || profile.given_name;
  this.name.familyName = this.name.familyName || profile.family_name;
  this.name.honorificPrefix = this.name.honorificPrefix || profile.honorific_prefix;
  this.password = this.password || token.generate();
  this.username = this.username || this.email.replace('@', '-').replace(/\./g, '-');
});

var User = module.exports = mongoose.model('User', UserSchema);