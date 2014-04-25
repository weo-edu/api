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

// Notify groups that a user has joined them
UserSchema.post('save', function(doc) {
  if(doc.isModified('groups')) {
    // XXX Figure out best way to implement this
  }
});

// Static methods

UserSchema.static('joinGroup', function(id, group, cb) {
  var selector = {_id: Array.isArray(id) ? {$in: id} : id};
  return this.update(selector, {$addToSet: {groups: group}}, cb);
});

UserSchema.static('leaveGroup', function(id, group, cb) {
  var selector = {};
  if(id)
    selector = {_id: Array.isArray(id) ? {$in: id} : id};
  return this.update(selector, {$pull: {groups: group}}, cb);
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
  this.model('User').count({username: value}, function(err, count) {
    if(err) return done(err);
    done(! count);
  });
}, 'Username already exists');

// Export our model
module.exports = mongoose.model('User', UserSchema);