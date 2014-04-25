var validations = require('lib/validations');

module.exports = function(Schema) {
  var UserSchema = new Schema({
    username: {
      type: String,
      required: true,
      unique: true,
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

  UserSchema.virtual('full_name').get(function() {
    return this.first_name + ' ' + this.last_name;
  }).set(function(name) {
    var parts = name.split(' ');
    this.first_name = parts.shift();
    // Join the remaining parts, in case this person has a
    // multi-part last name
    this.last_name = parts.join(' ');
  });

  UserSchema.virtual('type').get(function() {
    return this.__t;
  });

  return UserSchema;
};