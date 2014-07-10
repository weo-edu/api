var validations = require('lib/validations');
var access = require('lib/access');
var Schema = require('mongoose').Schema;
var titles = ['Mrs.', 'Ms.', 'Mr.', 'Dr.', 'None'];
var selfLink = require('lib/schema-plugin-selflink');

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
  displayName: {
    type: String,
    requred: true
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
  },
  activities: selfLink.embed()
}, {id: true, _id: true, discriminatorKey: 'userType'});

/**
 * Name Virtuals
 */

UserSchema.path('username').validate(
  validations.alphanumeric,
  'Username may only contain letters and numbers',
  'alphanumeric'
);

/**
 * Virtuals
 */
UserSchema.virtual('url').get(function() {
  return '/' + this.id;
});

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

// Return a user's access entries
UserSchema.method('tokens', function(contexts) {
  var self = this;
  contexts = [].concat(contexts || this.groups);
  return contexts.map(function(group) {
    return access.entry('group', self.userType, group);
  }).concat([
    // Defaults for all users
    access.entry('public', this.userType),
    access.entry('user', this.userType, this.id)
  ]);
});

UserSchema.method('isStudent', function() {
  return this.userType === 'student';
});

UserSchema.method('isTeacher', function() {
  return this.userType === 'teacher';
});

UserSchema.plugin(selfLink);