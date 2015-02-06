var validations = require('lib/validations');
var access = require('lib/access');
var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var titles = ['Mrs.', 'Ms.', 'Mr.', 'Dr.', 'None'];
var selfLink = require('lib/schema-plugin-selflink');
var asArray = require('lib/as-array');
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
    requred: true,
  },
  name: {
    givenName: {
      type: String,
      required: true,
      editableBy: ['me', 'teacher']
    },
    familyName: {
      type: String,
      required: true,
      editableBy: ['me', 'teacher']
    },
    honorificPrefix: {
      type: String,
      editableBy: ['me', 'teacher'],
      default: 'None',
      enum: titles
    }
  },
  username: {
    type: String,
    required: true,
    editableBy: ['me', 'teacher'],
    validate: [
      validations.minLength(3),
      'Must be at least 3 characters',
      'minLength'
    ]
  },
  password: {
    type: String,
    required: true,
    trusted: true,
    editableBy: ['me', 'teacher'],
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

  activities: selfLink.embed(function() {
    return '/share?' + qs.stringify({channel: this.getChannel('activities')});
  }),

  drafts: selfLink.embed(function() {
    return '/share?' + qs.stringify({channel: this.getChannel('drafts')});
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
  var ids = [];

  if(this.groups) {
    this.groups.forEach(function(group) {
      if(group.status === 'active')
        ids.push(group.id);
    });
  }

  return ids;
});

/**
 * Name
 */

UserSchema.method('setDisplayName', function() {
  this.displayName = [(this.name.honorificPrefix === 'None' || !this.name.honorificPrefix)
        ? this.name.givenName
        : this.name.honorificPrefix,
        this.name.familyName
      ].filter(Boolean).join(' ');
});

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
    share.channels = asArray(options.channels);

  options.groups && options.groups.forEach(function(group) {
    share.withGroup(group);
  });

  if (options.public) {
    if(options.public === 'true')
      options.public = 'teacher';

    asArray(options.public).forEach(function(type) {
      share.withPublic(type);
    });
  }
  return share;
});

UserSchema.method('createSection', function(options) {
  options = options || {};
  options.public = true;
  return this.createShare('section', options);
});

UserSchema.method('createTip', function(group) {
  var share = this.createShare('tip', {
    groups: [group],
    channels: [group.path('board')]
  });

  return share;
});

UserSchema.static('path', function(user, property) {
  var id = user.id || user;
  return 'user!' + id + '.' + property;
});
