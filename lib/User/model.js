var mongoose = require('mongoose');
var UserSchema = require('./schema');
var passwordHash = require('password-hash');
var config = require('lib/config');

/*
  Add server-side only extensions to schema (e.g. password hashing)
 */

// Static methods


// Instance methods
UserSchema.method('joinGroup', function(group, cb) {
  if(this.groups.indexOf(group) !== -1)
    return false;

  this.groups.addToSet(group);
  return true;
});

UserSchema.method('leaveGroup', function(group, cb) {
  if(this.groups.indexOf(group) === -1)
    return false;

  this.groups.pull(group);
  return true;
});

UserSchema.method('checkPassword', function(password) {
  return passwordHash.verify(password, this.password);
});

UserSchema.method('toActor', function() {
  return {
    id: this.id,
    displayName: this.displayName,
    image: {
      url: this.image.url
    },
    color: this.color
  };
});

UserSchema.method('addressQuery', function(context) {
  return {
    contexts: {
      $elemMatch: {
        id: context,
        allow: {$in: this.access(context)},
        deny: {$ne: this.userType}
      }
    }
  };
});

// Various config

UserSchema.set('toJSON', {
  transform: function(doc, ret, options) {
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

var User = module.exports = mongoose.model('User', UserSchema);