var validations = require('lib/validations');
var access = require('lib/access');
var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var titles = ['Mrs.', 'Ms.', 'Mr.', 'Dr.', 'None'];
var selfLink = require('lib/schema-plugin-selflink');
var qs = require('querystring');

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
  userType: {
    type: String
  },

  reputation: selfLink.embed(function() {
    return '/share?' + qs.stringify({channel: this.getChannel('reputation')});
  }, ['points']),

  activities: selfLink.embed(function() {
    return '/share?' + qs.stringify({channel: this.getChannel('activities')});
  }),

  reset: {
    token: String,
    createdAt: Date
  },

  auth: {
    google: String
  }
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

UserSchema.foreignKey.add({
  color: {
    type: String
  }
});

/**
 * Name Virtuals
 */

UserSchema.path('username').validate(
  validations.alphanumericdash,
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
  if (!this.groups)
    return [];
  return this.groups.map(function(group) {
    return group.id;
  });
});

UserSchema.virtual('reputationPoints').get(function() {
  return this.reputation.canonicalTotal.points;
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
  return this.groups.filter(function(group) {
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
  return this.groups.some(function(group) {
    return group.id === groupId;
  });
});

UserSchema.method('createShare', function(objectType, options) {
  options = options || {};
  var Share = mongoose.model('Share');

  var share = Share.create(objectType);
  share.set({actor: this.toKey()});
  if (options.channels)
    share.channels = [].concat(options.channels);

  options.groups && options.groups.forEach(function(group) {
    share.withGroup(group);
  });

  if (options.public)
    share.withPublic();
  return share;
});

UserSchema.method('createSection', function(options) {
  options = options || {};
  options.public = true;

  var share = this.createShare('section', options);
  share.status = 'draft';
  return share;
});

UserSchema.method('createTip', function(group) {
  var share = this.createShare('tip', {
    groups: [group],
    channels: [group.path('board')]
  });

  return share;
});

UserSchema.method('createProfile', function() {
  return this.createShare('profile', {
    channels: this.getChannel('activities'),
    public: true
  });
});

UserSchema.static('path', function(user, property) {
  if ('object' === typeof user)
    user = user.id;
  return 'user!' + user + '.' + property;
});

UserSchema.static('findByIdAndPopulate', function(id, cb) {
  var User = mongoose.model('User');
  User.findById(id, function(err, user) {
    if (err) return cb(err);
    user.populateSelfLinks(cb);
  });
});

