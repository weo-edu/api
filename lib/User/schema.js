var validations = require('lib/validations');
var access = require('lib/access');
var mongoose = require('mongoose');
var Schema = mongoose.Schema;
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
  activities: selfLink.embed(),
  reputationLog: selfLink.embed('points')
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
    if (this.color)
      key.color = this.color;
    return key;
  }
});

UserSchema.plugin(selfLink);

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

UserSchema.virtual('reputation').get(function() {
  return _.reduce(this.reputationLog.total, function(sum, total) {
    return sum + total.points;
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
          || (group.parent && group.parent.id === context));
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

UserSchema.method('isMemberOf', function(group) {
  // Allow a model or id to be passed in
  var groupId = group.id || group;
  return _.any(this.groups, {id: groupId});
});

UserSchema.method('createShare', function(objectType, options) {
  options = options || {};
  var Share = mongoose.model('Share');
  var Group = mongoose.model('Group');

  var share = Share.create(objectType);
  console.log('user foreign key', this.toKey());
  this.actor = this.toKey();

  console.log('actor2', this.actor);
  share.channels = [].concat(options.channels);
  _.each(options.groups, function(group) {
    share.channels.push(Group.path(group, 'board'));
    share.withGroup(group);
  });
  if (options.public)
    share.withPublic();
  return share;
});

UserSchema.method('createPost', function(options) {
  var share = this.createShare('post', _.extend({
    public: true
  }, options || {}));
  share.status = 'draft';
  return share;
});

UserSchema.method('createTip', function(group) {
  return this.createShare('tip', {
    groups: [group]
  });
});

UserSchema.method('createProfile', function() {
  return this.createShare('profile', {
    channels: this.path('activities'),
    groups: this.groups
  });
});

UserSchema.static('path', function(user, property) {
  if (_.isObject(user))
    user = user.id;
  return 'user!' + user + '.' + property;
});

