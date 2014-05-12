var validations = require('lib/validations');
var config = require('lib/config');
var access = require('lib/access');

module.exports = function(Schema) {
  var UserSchema = new Schema({
    username: {
      type: String,
      required: true,
      validate: [
        validations.minLength(3),
        'Must be at least 3 characters',
        'minLength'
      ]
    },
    email: {
      type: String,
      validate: [
        validations.email,
        'Invalid email address',
        'email'
      ]
    },
    name: {
      first: {
        type: String,
        required: true
      },
      last: {
        type: String,
        required: true,
      }
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
  }, {id: true, _id: true});

  /**
   * Type
   */
  UserSchema.virtual('displayName').get(function() {
    return [
    this.name.title === 'None' ? this.name.first : this.name.title,
    this.name.last
    ].filter(Boolean).join(' ');
  });

  UserSchema.virtual('type').get(function() {
    return this.__t;
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
    return [this.name.first, this.name.last].filter(Boolean).join(' ');
  }).set(function(name) {
    name = name || '';
    var parts = name.split(' ');
    this.name.first = parts.shift();
    // Join the remaining parts, in case this person has a
    // multi-part last name
    this.name.last = parts.join(' ');
  });


  UserSchema.virtual('url').get(function() {
    return config.userProfile + this.id
  });

  UserSchema.virtual('avatar').get(function() {
    return config.avatar + this.id;
  });

  // returns access entries for a particular group
  UserSchema.method('access', function(group) {
    return access.user(this, group);
  });

  // returns access with address prepended
  UserSchema.method('fullAccess', function(group, parent) {
    return access.all({id: group, allow: this.access(group)}, parent);
  });

  return UserSchema;
};