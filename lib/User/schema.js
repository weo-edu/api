var validations = require('lib/validations');
var config = require('lib/config');
var access = require('lib/access');

module.exports = function(Schema) {
  var UserSchema = new Schema({
    username: {
      type: String,
      required: true,
      match: [/[a-zA-Z0-9]*/, 'Username may only contain letters and numbers'],
      validate: [validations.minLength(3), 'Must be at least 3 characters']
    },
    first_name: {
      type: String,
      required: true
    },
    last_name: {
      type: String,
      required: true
    },
    password: {
      type: String,
      match: [/.{6,}/, 'Password must be at least 6 characters long']
    },
    groups: [{type: Schema.Types.ObjectId, ref: 'Group'}],
    preferences: Schema.Types.Mixed
  }, {id: true, _id: true});

  UserSchema
    .virtual('full_name')
    .get(function() {
      return this.first_name + ' ' + this.last_name;
    })
    .set(function(name) {
      var parts = name.split(' ');
      this.first_name = parts.shift();
      // Join the remaining parts, in case this person has a
      // multi-part last name
      this.last_name = parts.join(' ');
    });

  UserSchema
    .virtual('type')
    .get(function() {
      return this.__t;
    });

  // Display name is different than full name
  UserSchema.virtual('name')
    .get(function() {
      return this.first_name + this.last_name;
    });

  UserSchema.virtual('url').get(function() {
    return config.userProfile + this.id
  });

  UserSchema.virtual('avatar').get(function() {
    return config.avatar + this.id;
  });

  UserSchema.method('access', function(group) {
    access.user(this, group);
  });

  UserSchema.method('accessKeys', function(group) {
    return access.keys({id: group, access: this.access(group)});
  });

  return UserSchema;
};