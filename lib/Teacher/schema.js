var validations = require('lib/validations');
/*
  This schema is intended to inherit from the User schema, and so
  only specifies the things that differ from that schema
 */
module.exports = function(Schema) {
  var TeacherSchema = new Schema({
    username: {
      type: String,
      required: true,
      unique: true,
      // Must be lowercase to prevent people from sigining up tiwce
      lowercase: true,
      validate: [
        validations.email,
        'Must be a valid email address',
        'email'
      ]
    },
    title: {
      type: String,
      required: true,
      enum: ['Mrs.', 'Ms.', 'Mr.', 'Dr.', 'None']
    }
  }, {id: true, _id: true});

  // Override name in teacher because teacher's may have titles
  TeacherSchema.virtual('name').get(function() {
    var first = this.title === 'None' ? this.first_name : this.title;
    return [first, this.last_name].filter(Boolean).join(' ');
  });

  TeacherSchema.virtual('email').get(function() {
    return this.username;
  }).set(function(val) {
    this.username = val;
  });

  return TeacherSchema;
};