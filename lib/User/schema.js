var validations = require('lib/validations');
var config = require('lib/config');
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
  groups: [{type: Schema.Types.ObjectId, ref: 'Group'}],
  preferences: {
    type: Schema.Types.Mixed,
    default: {}
  }
}, {id: true, _id: true, discriminatorKey: 'userType'});

/**
 * Name Virtuals
 */
UserSchema.virtual('displayName').get(function() {
  return [
  this.name.honorificPrefix === 'None' ? this.name.givenName : this.name.honorificPrefix,
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
UserSchema.virtual('name.full').get(function() {
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
 * Virtuals
 */

UserSchema.virtual('url').get(function() {
  return config.userProfile + this.id
});

UserSchema.virtual('image.url').get(function() {
  return config.avatar + this.id;
});

/**
 * Access
 */

// returns access entries for a particular group
UserSchema.method('access', function(group) {
  return access.user(this, group);
});

// returns access with address prepended
UserSchema.method('fullAccess', function(group, channel) {
  return access.all({board: group, allow: this.access(group)}, channel);
});