var mongoose = require('mongoose');
var UserSchema = require('./schema')(mongoose.Schema);
var passwordHash = require('password-hash');
var config = require('lib/config');
var passwordHash = require('password-hash');

/*
  Add server-side only extensions to schema (e.g. password hashing)
 */

// Hooks

// Hash password on save, if its been modified
UserSchema.pre('save', function(next) {
  if(this.isModified('password')) {
    this.password = passwordHash.generate(this.password, config.hash);
  }

  next();
});

// Static methods
UserSchema.method('joinGroup', function(group, cb) {
  this.groups.push(group);
  this.groups = _.unique(this.groups);
});

UserSchema.method('leaveGroup', function(group, cb) {
  this.groups.pull(group);
});



// Instance methods
UserSchema.method('checkPassword', function(password) {
  return passwordHash.verify(password, this.password);
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
}, 'Username already exists');

module.exports = mongoose.model('User', UserSchema);

