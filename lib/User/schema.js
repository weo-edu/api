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

// Kind of a hack to work around the fact that Group/User schemas
// require each other
UserSchema.on('init', function() {
  var GroupSchema = require('lib/Group/schema');
  UserSchema.add({
    groups: [GroupSchema.foreignKey]
  });
});

UserSchema.plugin(require('lib/schema-plugin-foreign-key'), {
  model: 'User',
  transform: function(key) {
    key.image = key.image || {};
    key.image.url = this.image.url;
    key.url = '/' + this.id + '/';
    key.color = this.color;
    return key;
  }
});

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

UserSchema.virtual('groupIds').get(function() {
  return this.groups.map(function(group) {
    return group.id;
  });
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
UserSchema.method('tokens', function(context) {
  var self = this;
  return this.groups
  .filter(function(group) {
    return group.status === 'active'
      && (!context
          || group.id === context
          || (group.parent && group.parent.toString()) === context);
  }).map(function(group) {
    return access.encode('group', self.userType, group.id);
  }).concat([
    // Defaults for all users
    access.encode('public', this.userType),
    access.encode('user', this.userType, this.id)
  ]);
});

UserSchema.method('isStudent', function() {
  return this.userType === 'student';
});

UserSchema.method('isTeacher', function() {
  return this.userType === 'teacher';
});

UserSchema.plugin(selfLink);