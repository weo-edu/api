var mongoose = require('mongoose');
var UserSchema = require('./schema')(mongoose.Schema);
var passwordHash = require('password-hash');

/*
  Add server-side only extensions to schema (e.g. password hashing)
 */

// Static methods


// Instance methods
UserSchema.method('joinGroup', function(group, cb) {
  this.groups.addToSet(group);
});

UserSchema.method('leaveGroup', function(group, cb) {
  this.groups.pull(group);
});

UserSchema.method('checkPassword', function(password) {
  return passwordHash.verify(password, this.password);
});

UserSchema.method('toActor', function() {
  return {
    id: this.id,
    displayName: this.displayName,
    url: this.url,
    avatar: this.avatar
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
  this.model('User').count({username: value}, function(err, count) {
    if(err) return done(err);
    done(! count);
  });
}, 'Username already exists', 'unique');

UserSchema.path('email').index({unique: true, sparse: true});
// We have to do a custom username validation to get it to throw
// as a ValidationError rather than a MongoError
UserSchema.path('email').validate(function(value, done) {
  if(this.isModified('email') && value) {
    this.model('User').count({email: value}, function(err, count) {
      if(err) return done(err);
      done(! count);
    });
  } else
    done(true);
}, 'Email already exists', 'unique');


module.exports = mongoose.model('User', UserSchema);

