var validations = require('lib/validations');
var access = require('lib/access');
var Schema = require('mongoose').Schema;

var titles = ['Mrs.', 'Ms.', 'Mr.', 'Dr.', 'None'];

var UserSchema = module.exports = new Schema({
  email: {
    type: String,
    unique: true,
    validate: [
      validations.email,
      'Invalid email address',
      'email'
    ]
  },
  name: {
    givenName: {
      type: String,
      required: true
    },
    familyName: {
      type: String,
      required: true,
    },
    honorificPrefix: {
      type: String,
      enum: titles
    }
  },
  username: {
    type: String,
    required: true,
    validate: [
      validations.minLength(3),
      'Must be at least 3 characters',
      'minLength'
    ]
  },
  password: {
    type: String,
    required: true,
    validate: [
      validations.minLength(6),
      'Password must be at least 6 characters long',
      'minLength'
    ]
  },
  groups: [{type: 'ObjectId', ref: 'Group'}],
  preferences: {
    type: {},
    default: {}
  },
  aboutMe: {
    type: String
  },
  color: {
    type: String
  }
}, {id: true, _id: true, discriminatorKey: 'userType'});

/**
 * Name Virtuals
 */
UserSchema.virtual('displayName').get(function() {
  return [
  (this.name.honorificPrefix === 'None' || !this.name.honorificPrefix)
    ? this.name.givenName
    : this.name.honorificPrefix,
  this.name.familyName
  ].filter(Boolean).join(' ');
});

UserSchema.path('username').validate(
  validations.alphanumeric,
  'Username may only contain letters and numbers',
  'alphanumeric'
);

/**
 * Name
 */
UserSchema.virtual('name.formatted').get(function() {
  return [this.name.givenName, this.name.familyName].filter(Boolean).join(' ');
}).set(function(name) {
  name = name || '';
  var parts = name.split(' ');
  this.name.givenName = parts.shift();
  // Join the remaining parts, in case this person has a
  // multi-part last name
  this.name.familyName = parts.join(' ');
});


/**
 * Access
 */

// returns access entries for a particular group
UserSchema.method('access', function(group) {
  var self = this;
  return this.groups.map(function(group) {
    return access.entry('group', self.userType, group);
  }).concat([
    // Defaults for all users
    access.entry('public', this.userType),
    access.entry('user', this.userType, this.id)
  ]);
});

// returns access with address prepended
UserSchema.method('fullAccess', function(group, channel) {
  return access.all({board: group, allow: this.access(group)}, channel);
});